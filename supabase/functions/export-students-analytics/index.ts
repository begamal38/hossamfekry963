import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StudentAnalytics {
  user_id: string;
  full_name: string;
  phone: string;
  email: string;
  academic_year: string;
  language_track: string;
  attendance_mode: string;
  governorate: string;
  created_at: string;
  
  // Engagement metrics
  total_enrollments: number;
  active_courses: number;
  
  // Lesson metrics
  total_lessons_completed: number;
  avg_lesson_completion_rate: number;
  last_lesson_date: string | null;
  days_since_last_activity: number | null;
  
  // Exam metrics
  total_exams_taken: number;
  avg_exam_score: number;
  highest_exam_score: number;
  lowest_exam_score: number;
  exams_passed: number;
  exams_failed: number;
  pass_rate: number;
  
  // Center attendance (for center/hybrid students)
  center_sessions_attended: number;
  center_attendance_rate: number;
  
  // Derived fields
  performance_level: 'excellent' | 'good' | 'average' | 'at_risk' | 'inactive';
  risk_reason: string | null;
  engagement_score: number;
}

// Safe number helpers
function safeNumber(value: unknown, defaultVal = 0): number {
  if (value === null || value === undefined) return defaultVal;
  const num = Number(value);
  return isNaN(num) || !isFinite(num) ? defaultVal : num;
}

function safePercentage(numerator: number, denominator: number): number {
  if (denominator === 0 || !isFinite(denominator)) return 0;
  const result = (numerator / denominator) * 100;
  return isNaN(result) || !isFinite(result) ? 0 : Math.round(result);
}

function safeArray<T>(arr: T[] | null | undefined): T[] {
  return Array.isArray(arr) ? arr : [];
}

function calculatePerformanceLevel(student: Partial<StudentAnalytics>): { level: StudentAnalytics['performance_level']; reason: string | null } {
  const avgExamScore = safeNumber(student.avg_exam_score, 0);
  const avgLessonCompletionRate = safeNumber(student.avg_lesson_completion_rate, 0);
  const daysInactive = student.days_since_last_activity;
  const totalExamsTaken = safeNumber(student.total_exams_taken, 0);
  const totalLessonsCompleted = safeNumber(student.total_lessons_completed, 0);
  const passRate = safeNumber(student.pass_rate, 0);

  // Check for inactive first
  if (daysInactive !== null && daysInactive !== undefined && daysInactive > 14) {
    return { level: 'inactive', reason: `لم ينشط منذ ${daysInactive} يوم` };
  }

  // Check for at-risk conditions
  const riskReasons: string[] = [];
  
  if (totalLessonsCompleted === 0 && totalExamsTaken === 0) {
    riskReasons.push('لم يبدأ أي محتوى');
  }
  if (avgExamScore < 50 && totalExamsTaken > 0) {
    riskReasons.push('متوسط درجات منخفض');
  }
  if (passRate < 50 && totalExamsTaken >= 2) {
    riskReasons.push('نسبة نجاح منخفضة');
  }
  if (avgLessonCompletionRate < 30 && totalLessonsCompleted > 0) {
    riskReasons.push('تقدم بطيء في الدروس');
  }

  if (riskReasons.length > 0) {
    return { level: 'at_risk', reason: riskReasons.join(' | ') };
  }

  // Determine positive performance levels
  if (avgExamScore >= 85 && passRate >= 90 && avgLessonCompletionRate >= 80) {
    return { level: 'excellent', reason: null };
  }
  if (avgExamScore >= 70 && passRate >= 70 && avgLessonCompletionRate >= 60) {
    return { level: 'good', reason: null };
  }

  return { level: 'average', reason: null };
}

function calculateEngagementScore(student: Partial<StudentAnalytics>): number {
  const avgLessonCompletionRate = safeNumber(student.avg_lesson_completion_rate, 0);
  const totalLessonsCompleted = safeNumber(student.total_lessons_completed, 0);
  const totalExamsTaken = safeNumber(student.total_exams_taken, 0);
  const daysInactive = student.days_since_last_activity;
  const centerAttendanceRate = safeNumber(student.center_attendance_rate, 0);

  let score = 0;
  
  // Lesson completion contributes 40%
  score += (avgLessonCompletionRate / 100) * 40;
  
  // Activity bonus (lessons completed) contributes 20%
  const lessonBonus = Math.min(totalLessonsCompleted / 10, 1) * 20;
  score += lessonBonus;
  
  // Exam participation contributes 20%
  const examBonus = Math.min(totalExamsTaken / 5, 1) * 20;
  score += examBonus;
  
  // Recency contributes 20%
  if (daysInactive === null || daysInactive === undefined || daysInactive === 0) {
    score += 20;
  } else if (daysInactive <= 3) {
    score += 15;
  } else if (daysInactive <= 7) {
    score += 10;
  } else if (daysInactive <= 14) {
    score += 5;
  }

  // Center attendance bonus (for center students)
  if (centerAttendanceRate > 0) {
    score = score * 0.9 + (centerAttendanceRate / 100) * 10;
  }

  const finalScore = Math.round(Math.min(score, 100));
  return isNaN(finalScore) ? 0 : finalScore;
}

function translateValue(type: string, value: string | null | undefined): string {
  if (!value) return '';
  
  const translations: Record<string, Record<string, string>> = {
    academic_year: {
      'second_secondary': 'الثاني الثانوي',
      'third_secondary': 'الثالث الثانوي',
    },
    language_track: {
      'arabic': 'عربي',
      'languages': 'لغات',
    },
    attendance_mode: {
      'online': 'أونلاين',
      'center': 'سنتر',
      'hybrid': 'هجين',
    },
    performance_level: {
      'excellent': 'ممتاز',
      'good': 'جيد',
      'average': 'متوسط',
      'at_risk': 'يحتاج متابعة',
      'inactive': 'غير نشط',
    },
  };
  
  return translations[type]?.[value] || value;
}

function createEmptyAnalytics(userId: string, profile: Record<string, unknown>, email: string): StudentAnalytics {
  return {
    user_id: userId,
    full_name: String(profile.full_name || ''),
    phone: String(profile.phone || ''),
    email: email,
    academic_year: translateValue('academic_year', profile.academic_year as string),
    language_track: translateValue('language_track', profile.language_track as string),
    attendance_mode: translateValue('attendance_mode', profile.attendance_mode as string),
    governorate: String(profile.governorate || ''),
    created_at: profile.created_at ? new Date(String(profile.created_at)).toLocaleDateString('ar-EG') : '',
    
    total_enrollments: 0,
    active_courses: 0,
    
    total_lessons_completed: 0,
    avg_lesson_completion_rate: 0,
    last_lesson_date: null,
    days_since_last_activity: null,
    
    total_exams_taken: 0,
    avg_exam_score: 0,
    highest_exam_score: 0,
    lowest_exam_score: 0,
    exams_passed: 0,
    exams_failed: 0,
    pass_rate: 0,
    
    center_sessions_attended: 0,
    center_attendance_rate: 0,
    
    performance_level: 'at_risk',
    risk_reason: 'لم يبدأ أي محتوى',
    engagement_score: 0,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Export students analytics request received');

    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('No authorization header found');
      return new Response(
        JSON.stringify({ error: 'NO_AUTH', message: 'يجب تسجيل الدخول للتصدير', message_en: 'Authentication required for export' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      console.error('Missing required environment variables');
      return new Response(
        JSON.stringify({ error: 'CONFIG_ERROR', message: 'خطأ في إعدادات الخادم', message_en: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, { 
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } }
    });

    // Verify authentication
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      console.error('Auth verification failed:', userError?.message);
      return new Response(
        JSON.stringify({ error: 'AUTH_FAILED', message: 'فشل التحقق من الهوية', message_en: 'Authentication verification failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check permissions
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'assistant_teacher']);

    if (rolesError) {
      console.error('Roles check error:', rolesError.message);
      return new Response(
        JSON.stringify({ error: 'PERMISSION_CHECK_FAILED', message: 'فشل التحقق من الصلاحيات', message_en: 'Permission check failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!roles || roles.length === 0) {
      return new Response(
        JSON.stringify({ error: 'PERMISSION_DENIED', message: 'ليس لديك صلاحية التصدير', message_en: 'You do not have export permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isAdmin = roles.some(r => r.role === 'admin');
    console.log(`User role: ${isAdmin ? 'admin' : 'assistant_teacher'}`);

    // Get student user IDs
    const { data: studentRoles, error: studentRolesError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('role', 'student');

    if (studentRolesError) {
      console.error('Student roles fetch error:', studentRolesError.message);
      return new Response(
        JSON.stringify({ error: 'DATA_FETCH_ERROR', message: 'فشل جلب بيانات الطلاب', message_en: 'Failed to fetch student data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const studentUserIds = safeArray(studentRoles).map(r => r.user_id);
    
    // Early return for no students - return empty data with headers structure
    if (studentUserIds.length === 0) {
      console.log('No students found - returning empty export');
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: { overview: [], atRisk: [], topPerformers: [] },
          summary: { total: 0, atRisk: 0, topPerformers: 0, inactive: 0, avgEngagement: 0, avgExamScore: 0 },
          generatedAt: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${studentUserIds.length} students`);

    // Fetch all required data in parallel with error handling
    let profiles: Record<string, unknown>[] = [];
    let enrollments: Record<string, unknown>[] = [];
    let lessons: Record<string, unknown>[] = [];
    let lessonCompletions: Record<string, unknown>[] = [];
    let exams: Record<string, unknown>[] = [];
    let examAttempts: Record<string, unknown>[] = [];
    let centerAttendance: Record<string, unknown>[] = [];
    let authUsers: { id: string; email?: string }[] = [];

    try {
      const [
        profilesResult,
        enrollmentsResult,
        lessonsResult,
        lessonCompletionsResult,
        examsResult,
        examAttemptsResult,
        centerAttendanceResult,
        authUsersResult,
      ] = await Promise.all([
        supabaseAdmin.from('profiles').select('*').in('user_id', studentUserIds).neq('user_id', user.id),
        supabaseAdmin.from('course_enrollments').select('user_id, course_id, progress, status').in('user_id', studentUserIds),
        supabaseAdmin.from('lessons').select('id, course_id'),
        supabaseAdmin.from('lesson_completions').select('user_id, lesson_id, completed_at').in('user_id', studentUserIds),
        supabaseAdmin.from('exams').select('id, pass_mark, max_score'),
        supabaseAdmin.from('exam_attempts').select('user_id, exam_id, score, is_completed, completed_at').in('user_id', studentUserIds).eq('is_completed', true),
        supabaseAdmin.from('center_session_attendance').select('student_id, status, session_id').in('student_id', studentUserIds),
        supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
      ]);

      // Extract data with safe defaults
      profiles = safeArray(profilesResult.data);
      enrollments = safeArray(enrollmentsResult.data);
      lessons = safeArray(lessonsResult.data);
      lessonCompletions = safeArray(lessonCompletionsResult.data);
      exams = safeArray(examsResult.data);
      examAttempts = safeArray(examAttemptsResult.data);
      centerAttendance = safeArray(centerAttendanceResult.data);
      authUsers = safeArray(authUsersResult.data?.users);

      // Log any errors but continue with available data
      if (profilesResult.error) console.warn('Profiles fetch warning:', profilesResult.error.message);
      if (enrollmentsResult.error) console.warn('Enrollments fetch warning:', enrollmentsResult.error.message);
      if (lessonsResult.error) console.warn('Lessons fetch warning:', lessonsResult.error.message);
      if (lessonCompletionsResult.error) console.warn('Lesson completions fetch warning:', lessonCompletionsResult.error.message);
      if (examsResult.error) console.warn('Exams fetch warning:', examsResult.error.message);
      if (examAttemptsResult.error) console.warn('Exam attempts fetch warning:', examAttemptsResult.error.message);
      if (centerAttendanceResult.error) console.warn('Center attendance fetch warning:', centerAttendanceResult.error.message);
      if (authUsersResult.error) console.warn('Auth users fetch warning:', authUsersResult.error.message);

    } catch (fetchError) {
      console.error('Data fetch error:', fetchError);
      return new Response(
        JSON.stringify({ error: 'DATA_FETCH_ERROR', message: 'فشل جلب البيانات من قاعدة البيانات', message_en: 'Failed to fetch data from database' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle case where profiles table returns empty
    if (profiles.length === 0) {
      console.log('No student profiles found - returning empty export');
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: { overview: [], atRisk: [], topPerformers: [] },
          summary: { total: 0, atRisk: 0, topPerformers: 0, inactive: 0, avgEngagement: 0, avgExamScore: 0 },
          generatedAt: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create lookup maps with safe defaults
    const emailMap = new Map<string, string>();
    authUsers.forEach(u => {
      if (u && u.id) emailMap.set(u.id, u.email || '');
    });

    const examMap = new Map<string, { id: string; pass_mark: number; max_score: number }>();
    exams.forEach(e => {
      if (e && e.id) {
        examMap.set(String(e.id), {
          id: String(e.id),
          pass_mark: safeNumber(e.pass_mark, 60),
          max_score: safeNumber(e.max_score, 100),
        });
      }
    });

    const lessonsByCourse = new Map<string, number>();
    lessons.forEach(l => {
      if (l && l.course_id) {
        const courseId = String(l.course_id);
        lessonsByCourse.set(courseId, (lessonsByCourse.get(courseId) || 0) + 1);
      }
    });

    const now = new Date();

    // Process each student with individual error handling
    const analyticsData: StudentAnalytics[] = [];
    const processingErrors: string[] = [];

    for (const profile of profiles) {
      try {
        const userId = String(profile.user_id);
        const email = emailMap.get(userId) || '';
        
        // Get user-specific data with safe filtering
        const userEnrollments = enrollments.filter(e => e && e.user_id === userId);
        const activeEnrollments = userEnrollments.filter(e => e.status === 'active');
        const userCompletions = lessonCompletions.filter(c => c && c.user_id === userId);
        const userExamAttempts = examAttempts.filter(a => a && a.user_id === userId);
        const userCenterAttendance = centerAttendance.filter(a => a && a.student_id === userId);

        // Calculate last activity date
        let lastCompletion: Record<string, unknown> | null = null;
        if (userCompletions.length > 0) {
          lastCompletion = userCompletions.reduce((latest, c) => {
            try {
              const latestDate = latest.completed_at ? new Date(String(latest.completed_at)) : new Date(0);
              const currentDate = c.completed_at ? new Date(String(c.completed_at)) : new Date(0);
              return currentDate > latestDate ? c : latest;
            } catch {
              return latest;
            }
          }, userCompletions[0]);
        }

        let daysSinceLastActivity: number | null = null;
        if (lastCompletion && lastCompletion.completed_at) {
          try {
            const lastDate = new Date(String(lastCompletion.completed_at));
            daysSinceLastActivity = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceLastActivity < 0 || !isFinite(daysSinceLastActivity)) daysSinceLastActivity = null;
          } catch {
            daysSinceLastActivity = null;
          }
        }

        // Calculate lesson completion rate
        let avgLessonCompletionRate = 0;
        if (userEnrollments.length > 0) {
          const completionRates: number[] = [];
          for (const enrollment of userEnrollments) {
            const courseId = String(enrollment.course_id);
            const courseLessons = lessonsByCourse.get(courseId) || 1;
            const completed = userCompletions.filter(c => {
              const lesson = lessons.find(l => l.id === c.lesson_id);
              return lesson && String(lesson.course_id) === courseId;
            }).length;
            completionRates.push(safePercentage(completed, courseLessons));
          }
          if (completionRates.length > 0) {
            avgLessonCompletionRate = completionRates.reduce((a, b) => a + b, 0) / completionRates.length;
          }
        }

        // Calculate exam metrics
        const examScores: number[] = [];
        let passedExams = 0;
        
        for (const attempt of userExamAttempts) {
          const exam = examMap.get(String(attempt.exam_id));
          const maxScore = exam?.max_score || 100;
          const score = safeNumber(attempt.score, 0);
          const normalizedScore = safePercentage(score, maxScore);
          examScores.push(normalizedScore);
          
          if (exam && score >= exam.pass_mark) {
            passedExams++;
          }
        }

        const avgExamScore = examScores.length > 0 
          ? examScores.reduce((a, b) => a + b, 0) / examScores.length 
          : 0;

        // Calculate center attendance
        const attendedSessions = userCenterAttendance.filter(a => a.status === 'present').length;
        const centerAttendanceRate = safePercentage(attendedSessions, userCenterAttendance.length);

        // Build partial student for calculations
        const partialStudent: Partial<StudentAnalytics> = {
          avg_exam_score: avgExamScore,
          avg_lesson_completion_rate: avgLessonCompletionRate,
          days_since_last_activity: daysSinceLastActivity,
          total_exams_taken: userExamAttempts.length,
          total_lessons_completed: userCompletions.length,
          pass_rate: safePercentage(passedExams, userExamAttempts.length),
          center_attendance_rate: centerAttendanceRate,
        };

        const { level, reason } = calculatePerformanceLevel(partialStudent);
        const engagementScore = calculateEngagementScore(partialStudent);

        analyticsData.push({
          user_id: userId,
          full_name: String(profile.full_name || ''),
          phone: String(profile.phone || ''),
          email: email,
          academic_year: translateValue('academic_year', profile.academic_year as string),
          language_track: translateValue('language_track', profile.language_track as string),
          attendance_mode: translateValue('attendance_mode', profile.attendance_mode as string),
          governorate: String(profile.governorate || ''),
          created_at: profile.created_at ? new Date(String(profile.created_at)).toLocaleDateString('ar-EG') : '',
          
          total_enrollments: userEnrollments.length,
          active_courses: activeEnrollments.length,
          
          total_lessons_completed: userCompletions.length,
          avg_lesson_completion_rate: Math.round(avgLessonCompletionRate),
          last_lesson_date: lastCompletion && lastCompletion.completed_at 
            ? new Date(String(lastCompletion.completed_at)).toLocaleDateString('ar-EG') 
            : null,
          days_since_last_activity: daysSinceLastActivity,
          
          total_exams_taken: userExamAttempts.length,
          avg_exam_score: Math.round(avgExamScore),
          highest_exam_score: examScores.length > 0 ? Math.round(Math.max(...examScores)) : 0,
          lowest_exam_score: examScores.length > 0 ? Math.round(Math.min(...examScores)) : 0,
          exams_passed: passedExams,
          exams_failed: Math.max(0, userExamAttempts.length - passedExams),
          pass_rate: Math.round(partialStudent.pass_rate || 0),
          
          center_sessions_attended: attendedSessions,
          center_attendance_rate: Math.round(centerAttendanceRate),
          
          performance_level: level,
          risk_reason: reason,
          engagement_score: engagementScore,
        });

      } catch (studentError) {
        const userId = profile.user_id ? String(profile.user_id) : 'unknown';
        console.error(`Error processing student ${userId}:`, studentError);
        processingErrors.push(userId);
        
        // Add minimal analytics for failed student
        const email = emailMap.get(String(profile.user_id)) || '';
        analyticsData.push(createEmptyAnalytics(String(profile.user_id), profile, email));
      }
    }

    if (processingErrors.length > 0) {
      console.warn(`Processing errors for ${processingErrors.length} students`);
    }

    // Sort and filter for different sheets
    const atRiskStudents = analyticsData
      .filter(s => s.performance_level === 'at_risk' || s.performance_level === 'inactive')
      .sort((a, b) => a.engagement_score - b.engagement_score);

    const topPerformers = analyticsData
      .filter(s => s.performance_level === 'excellent' || s.performance_level === 'good')
      .sort((a, b) => b.avg_exam_score - a.avg_exam_score);

    const studentsWithExams = analyticsData.filter(s => s.total_exams_taken > 0);
    const summary = {
      total: analyticsData.length,
      atRisk: atRiskStudents.length,
      topPerformers: topPerformers.length,
      inactive: analyticsData.filter(s => s.performance_level === 'inactive').length,
      avgEngagement: analyticsData.length > 0 
        ? Math.round(analyticsData.reduce((a, b) => a + b.engagement_score, 0) / analyticsData.length)
        : 0,
      avgExamScore: studentsWithExams.length > 0
        ? Math.round(studentsWithExams.reduce((a, b) => a + b.avg_exam_score, 0) / studentsWithExams.length)
        : 0,
      processingErrors: processingErrors.length,
    };

    console.log(`Analytics generated: ${summary.total} students, ${summary.atRisk} at-risk, ${summary.topPerformers} top performers`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          overview: analyticsData,
          atRisk: atRiskStudents,
          topPerformers: topPerformers,
        },
        summary,
        generatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Export analytics error:', errorMessage, errorStack);
    
    return new Response(
      JSON.stringify({ 
        error: 'SERVER_ERROR', 
        message: 'حدث خطأ في الخادم أثناء التصدير. يرجى المحاولة مرة أخرى.',
        message_en: 'Server error during export. Please try again.',
        details: errorMessage,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
