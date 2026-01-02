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

function calculatePerformanceLevel(student: Partial<StudentAnalytics>): { level: StudentAnalytics['performance_level']; reason: string | null } {
  const {
    avg_exam_score = 0,
    avg_lesson_completion_rate = 0,
    days_since_last_activity,
    total_exams_taken = 0,
    total_lessons_completed = 0,
    pass_rate = 0,
  } = student;

  // Check for inactive first
  if (days_since_last_activity !== null && days_since_last_activity !== undefined && days_since_last_activity > 14) {
    return { level: 'inactive', reason: `لم ينشط منذ ${days_since_last_activity} يوم` };
  }

  // Check for at-risk conditions
  const riskReasons: string[] = [];
  
  if (total_lessons_completed === 0 && total_exams_taken === 0) {
    riskReasons.push('لم يبدأ أي محتوى');
  }
  if (avg_exam_score < 50 && total_exams_taken > 0) {
    riskReasons.push('متوسط درجات منخفض');
  }
  if (pass_rate < 50 && total_exams_taken >= 2) {
    riskReasons.push('نسبة نجاح منخفضة');
  }
  if (avg_lesson_completion_rate < 30 && total_lessons_completed > 0) {
    riskReasons.push('تقدم بطيء في الدروس');
  }

  if (riskReasons.length > 0) {
    return { level: 'at_risk', reason: riskReasons.join(' | ') };
  }

  // Determine positive performance levels
  if (avg_exam_score >= 85 && pass_rate >= 90 && avg_lesson_completion_rate >= 80) {
    return { level: 'excellent', reason: null };
  }
  if (avg_exam_score >= 70 && pass_rate >= 70 && avg_lesson_completion_rate >= 60) {
    return { level: 'good', reason: null };
  }

  return { level: 'average', reason: null };
}

function calculateEngagementScore(student: Partial<StudentAnalytics>): number {
  const {
    avg_lesson_completion_rate = 0,
    total_lessons_completed = 0,
    total_exams_taken = 0,
    days_since_last_activity,
    center_attendance_rate = 0,
  } = student;

  let score = 0;
  
  // Lesson completion contributes 40%
  score += (avg_lesson_completion_rate / 100) * 40;
  
  // Activity bonus (lessons completed) contributes 20%
  const lessonBonus = Math.min(total_lessons_completed / 10, 1) * 20;
  score += lessonBonus;
  
  // Exam participation contributes 20%
  const examBonus = Math.min(total_exams_taken / 5, 1) * 20;
  score += examBonus;
  
  // Recency contributes 20%
  const daysInactive = days_since_last_activity ?? null;
  if (daysInactive === null || daysInactive === 0) {
    score += 20;
  } else if (daysInactive <= 3) {
    score += 15;
  } else if (daysInactive <= 7) {
    score += 10;
  } else if (daysInactive <= 14) {
    score += 5;
  }

  // Center attendance bonus (for center students)
  if (center_attendance_rate > 0) {
    score = score * 0.9 + (center_attendance_rate / 100) * 10;
  }

  return Math.round(Math.min(score, 100));
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Export students analytics request received');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'NO_AUTH', message: 'يجب تسجيل الدخول للتصدير' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        auth: { persistSession: false },
        global: { headers: { Authorization: authHeader } }
      }
    );

    // Verify authentication
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'AUTH_FAILED', message: 'فشل التحقق من الهوية' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check permissions
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'assistant_teacher']);

    if (rolesError || !roles || roles.length === 0) {
      return new Response(
        JSON.stringify({ error: 'PERMISSION_DENIED', message: 'ليس لديك صلاحية التصدير' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isAdmin = roles.some(r => r.role === 'admin');
    console.log(`User role: ${isAdmin ? 'admin' : 'assistant_teacher'}`);

    // Get student user IDs
    const { data: studentRoles } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('role', 'student');

    const studentUserIds = (studentRoles || []).map(r => r.user_id);
    
    if (studentUserIds.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: { overview: [], atRisk: [], topPerformers: [] },
          summary: { total: 0, atRisk: 0, topPerformers: 0, inactive: 0 }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all required data in parallel
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
      supabaseAdmin.from('profiles')
        .select('*')
        .in('user_id', studentUserIds)
        .neq('user_id', user.id),
      supabaseAdmin.from('course_enrollments')
        .select('user_id, course_id, progress, status')
        .in('user_id', studentUserIds),
      supabaseAdmin.from('lessons')
        .select('id, course_id'),
      supabaseAdmin.from('lesson_completions')
        .select('user_id, lesson_id, completed_at')
        .in('user_id', studentUserIds),
      supabaseAdmin.from('exams')
        .select('id, pass_mark, max_score'),
      supabaseAdmin.from('exam_attempts')
        .select('user_id, exam_id, score, is_completed, completed_at')
        .in('user_id', studentUserIds)
        .eq('is_completed', true),
      supabaseAdmin.from('center_session_attendance')
        .select('student_id, status, session_id')
        .in('student_id', studentUserIds),
      supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
    ]);

    const profiles = profilesResult.data || [];
    const enrollments = enrollmentsResult.data || [];
    const lessons = lessonsResult.data || [];
    const lessonCompletions = lessonCompletionsResult.data || [];
    const exams = examsResult.data || [];
    const examAttempts = examAttemptsResult.data || [];
    const centerAttendance = centerAttendanceResult.data || [];
    const authUsers = authUsersResult.data?.users || [];

    // Create lookup maps
    const emailMap = new Map(authUsers.map(u => [u.id, u.email || '']));
    const examMap = new Map(exams.map(e => [e.id, e]));
    const lessonsByCourse = new Map<string, number>();
    lessons.forEach(l => {
      lessonsByCourse.set(l.course_id, (lessonsByCourse.get(l.course_id) || 0) + 1);
    });

    const now = new Date();

    // Process each student
    const analyticsData: StudentAnalytics[] = profiles.map(profile => {
      const userId = profile.user_id;
      
      // Enrollment data
      const userEnrollments = enrollments.filter(e => e.user_id === userId);
      const activeEnrollments = userEnrollments.filter(e => e.status === 'active');
      
      // Lesson completion data
      const userCompletions = lessonCompletions.filter(c => c.user_id === userId);
      const lastCompletion = userCompletions.length > 0 
        ? userCompletions.reduce((latest, c) => 
            new Date(c.completed_at) > new Date(latest.completed_at) ? c : latest
          )
        : null;
      
      const daysSinceLastActivity = lastCompletion 
        ? Math.floor((now.getTime() - new Date(lastCompletion.completed_at).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      // Calculate average lesson completion rate across enrolled courses
      let avgLessonCompletionRate = 0;
      if (userEnrollments.length > 0) {
        const completionRates = userEnrollments.map(e => {
          const courseLessons = lessonsByCourse.get(e.course_id) || 1;
          const completed = userCompletions.filter(c => {
            const lesson = lessons.find(l => l.id === c.lesson_id);
            return lesson?.course_id === e.course_id;
          }).length;
          return (completed / courseLessons) * 100;
        });
        avgLessonCompletionRate = completionRates.reduce((a, b) => a + b, 0) / completionRates.length;
      }

      // Exam data
      const userExamAttempts = examAttempts.filter(a => a.user_id === userId);
      const examScores = userExamAttempts.map(a => {
        const exam = examMap.get(a.exam_id);
        const maxScore = exam?.max_score || 100;
        return (a.score / maxScore) * 100;
      });
      
      const avgExamScore = examScores.length > 0 
        ? examScores.reduce((a, b) => a + b, 0) / examScores.length 
        : 0;
      
      const passedExams = userExamAttempts.filter(a => {
        const exam = examMap.get(a.exam_id);
        return exam && a.score >= exam.pass_mark;
      }).length;

      // Center attendance data
      const userCenterAttendance = centerAttendance.filter(a => a.student_id === userId);
      const attendedSessions = userCenterAttendance.filter(a => a.status === 'present').length;
      const centerAttendanceRate = userCenterAttendance.length > 0 
        ? (attendedSessions / userCenterAttendance.length) * 100 
        : 0;

      const partialStudent: Partial<StudentAnalytics> = {
        avg_exam_score: avgExamScore,
        avg_lesson_completion_rate: avgLessonCompletionRate,
        days_since_last_activity: daysSinceLastActivity,
        total_exams_taken: userExamAttempts.length,
        total_lessons_completed: userCompletions.length,
        pass_rate: userExamAttempts.length > 0 ? (passedExams / userExamAttempts.length) * 100 : 0,
        center_attendance_rate: centerAttendanceRate,
      };

      const { level, reason } = calculatePerformanceLevel(partialStudent);
      const engagementScore = calculateEngagementScore(partialStudent);

      return {
        user_id: userId,
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        email: emailMap.get(userId) || '',
        academic_year: translateValue('academic_year', profile.academic_year),
        language_track: translateValue('language_track', profile.language_track),
        attendance_mode: translateValue('attendance_mode', profile.attendance_mode),
        governorate: profile.governorate || '',
        created_at: profile.created_at ? new Date(profile.created_at).toLocaleDateString('ar-EG') : '',
        
        total_enrollments: userEnrollments.length,
        active_courses: activeEnrollments.length,
        
        total_lessons_completed: userCompletions.length,
        avg_lesson_completion_rate: Math.round(avgLessonCompletionRate),
        last_lesson_date: lastCompletion ? new Date(lastCompletion.completed_at).toLocaleDateString('ar-EG') : null,
        days_since_last_activity: daysSinceLastActivity,
        
        total_exams_taken: userExamAttempts.length,
        avg_exam_score: Math.round(avgExamScore),
        highest_exam_score: examScores.length > 0 ? Math.round(Math.max(...examScores)) : 0,
        lowest_exam_score: examScores.length > 0 ? Math.round(Math.min(...examScores)) : 0,
        exams_passed: passedExams,
        exams_failed: userExamAttempts.length - passedExams,
        pass_rate: Math.round(partialStudent.pass_rate || 0),
        
        center_sessions_attended: attendedSessions,
        center_attendance_rate: Math.round(centerAttendanceRate),
        
        performance_level: level,
        risk_reason: reason,
        engagement_score: engagementScore,
      };
    });

    // Sort and filter for different sheets
    const atRiskStudents = analyticsData
      .filter(s => s.performance_level === 'at_risk' || s.performance_level === 'inactive')
      .sort((a, b) => a.engagement_score - b.engagement_score);

    const topPerformers = analyticsData
      .filter(s => s.performance_level === 'excellent' || s.performance_level === 'good')
      .sort((a, b) => b.avg_exam_score - a.avg_exam_score);

    const summary = {
      total: analyticsData.length,
      atRisk: atRiskStudents.length,
      topPerformers: topPerformers.length,
      inactive: analyticsData.filter(s => s.performance_level === 'inactive').length,
      avgEngagement: analyticsData.length > 0 
        ? Math.round(analyticsData.reduce((a, b) => a + b.engagement_score, 0) / analyticsData.length)
        : 0,
      avgExamScore: analyticsData.filter(s => s.total_exams_taken > 0).length > 0
        ? Math.round(analyticsData.filter(s => s.total_exams_taken > 0).reduce((a, b) => a + b.avg_exam_score, 0) / analyticsData.filter(s => s.total_exams_taken > 0).length)
        : 0,
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
    console.error('Export analytics error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'SERVER_ERROR', message: 'حدث خطأ في الخادم أثناء التصدير' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
