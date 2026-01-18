import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, BookOpen, Award, TrendingUp, BarChart3, Lightbulb, Clock, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/Navbar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserRole } from '@/hooks/useUserRole';
import { ActionableInsights } from '@/components/analytics/ActionableInsights';
import { ChapterAnalytics } from '@/components/analytics/ChapterAnalytics';
import { ExamAnalytics } from '@/components/analytics/ExamAnalytics';

interface CourseStats {
  id: string;
  title: string;
  title_ar: string;
  totalStudents: number;
  avgProgress: number;
  totalLessons: number;
  totalExams: number;
  avgExamScore: number;
}

interface OverallStats {
  totalStudents: number;
  totalEnrollments: number;
  activeEnrollments: number;
  pendingEnrollments: number;
  totalLessons: number;
  totalExams: number;
  totalExamResults: number;
  avgOverallProgress: number;
  avgOverallExamScore: number;
  // Focus mode stats
  totalFocusSessions: number;
  totalFocusMinutes: number;
  studentsWithFocusSessions: number;
  avgFocusMinutesPerStudent: number;
}

interface TopStudent {
  user_id: string;
  full_name: string | null;
  avgScore: number;
  totalExams: number;
}

interface AttendanceBreakdown {
  lessonId: string;
  lessonTitle: string;
  lessonTitleAr: string;
  centerCount: number;
  onlineCount: number;
  bothCount: number;
  absentCount: number;
  totalStudents: number;
}

export default function Reports() {
  const navigate = useNavigate();
  const { language, isRTL } = useLanguage();
  const { canAccessDashboard, loading: roleLoading } = useUserRole();
  const isArabic = language === 'ar';

  const [loading, setLoading] = useState(true);
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [courseStats, setCourseStats] = useState<CourseStats[]>([]);
  const [topStudents, setTopStudents] = useState<TopStudent[]>([]);
  const [attendanceBreakdown, setAttendanceBreakdown] = useState<AttendanceBreakdown[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [lessonCompletions, setLessonCompletions] = useState<any[]>([]);
  const [examAttempts, setExamAttempts] = useState<any[]>([]);
  const [focusSessions, setFocusSessions] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [chapterEnrollments, setChapterEnrollments] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);

  useEffect(() => {
    if (!roleLoading && !canAccessDashboard()) {
      navigate('/');
      return;
    }
    fetchReportData();
  }, [roleLoading]);

  const fetchReportData = async () => {
    try {
      // First, get student user IDs from user_roles
      const { data: studentRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'student');

      const studentUserIds = (studentRoles || []).map(r => r.user_id);

      const [
        { data: allProfiles },
        { data: courses },
        { data: enrollmentsData },
        { data: lessonsData },
        { data: attendance },
        { data: examsData },
        { data: examResults },
        { data: chaptersData },
        { data: lessonCompletionsData },
        { data: examAttemptsData },
        { data: focusSessionsData },
        { data: chapterEnrollmentsData }
      ] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('courses').select('*'),
        supabase.from('course_enrollments').select('*'),
        supabase.from('lessons').select('*'),
        supabase.from('lesson_attendance').select('*'),
        supabase.from('exams').select('*, course:courses(title, title_ar)'),
        supabase.from('exam_results').select('*, exams:exam_id(max_score)'),
        supabase.from('chapters').select('*, course:courses(title, title_ar)'),
        supabase.from('lesson_completions').select('*'),
        supabase.from('exam_attempts').select('*'),
        supabase.from('focus_sessions').select('*'),
        supabase.from('chapter_enrollments').select('*')
      ]);

      // Store in state for useMemo dependencies
      setChapters(chaptersData || []);
      setLessonCompletions(lessonCompletionsData || []);
      setExamAttempts(examAttemptsData || []);
      setFocusSessions(focusSessionsData || []);
      setLessons(lessonsData || []);
      setEnrollments(enrollmentsData || []);
      setChapterEnrollments(chapterEnrollmentsData || []);
      setExams(examsData || []);
      
      // Use local variables for calculations in this function
      const lessons = lessonsData || [];
      const enrollments = enrollmentsData || [];
      const exams = examsData || [];

      // Filter profiles to only include students
      const profiles = (allProfiles || []).filter(p => studentUserIds.includes(p.user_id));

      // Count attendance by type
      const centerAttendance = (attendance || []).filter(a => a.attendance_type === 'center').length;
      const onlineAttendance = (attendance || []).filter(a => a.attendance_type === 'online').length;

      // Count students by attendance mode (only actual students)
      const onlineStudents = profiles.filter(p => p.attendance_mode === 'online').length;
      const centerStudents = profiles.filter(p => p.attendance_mode === 'center').length;
      const hybridStudents = profiles.filter(p => p.attendance_mode === 'hybrid').length;

      const activeEnrollments = (enrollments || []).filter(e => e.status === 'active').length;
      const pendingEnrollments = (enrollments || []).filter(e => e.status === 'pending').length;

      const avgProgress = (enrollments || []).length > 0
        ? Math.round((enrollments || []).reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments!.length)
        : 0;

      const avgExamScore = (examResults || []).length > 0
        ? Math.round((examResults || []).reduce((sum, r) => {
            const maxScore = (r.exams as any)?.max_score || 100;
            return sum + ((r.score / maxScore) * 100);
          }, 0) / examResults!.length)
        : 0;

      // Calculate focus session stats
      const allFocusSessions = focusSessionsData || [];
      const totalFocusSessions = allFocusSessions.length;
      const totalFocusMinutes = Math.round(
        allFocusSessions.reduce((sum, s) => sum + (s.total_active_seconds || 0), 0) / 60
      );
      const studentsWithFocusSessions = new Set(allFocusSessions.map(s => s.user_id)).size;
      const avgFocusMinutesPerStudent = studentsWithFocusSessions > 0 
        ? Math.round(totalFocusMinutes / studentsWithFocusSessions) 
        : 0;

      setOverallStats({
        totalStudents: profiles.length,
        totalEnrollments: (enrollments || []).length,
        activeEnrollments,
        pendingEnrollments,
        totalLessons: (lessons || []).length,
        totalExams: (exams || []).length,
        totalExamResults: (examResults || []).length,
        avgOverallProgress: avgProgress,
        avgOverallExamScore: avgExamScore,
        totalFocusSessions,
        totalFocusMinutes,
        studentsWithFocusSessions,
        avgFocusMinutesPerStudent,
      });

      // Calculate course-level stats
      const courseStatsData: CourseStats[] = (courses || []).map(course => {
        const courseEnrollments = (enrollments || []).filter(e => e.course_id === course.id);
        const courseLessons = (lessons || []).filter(l => l.course_id === course.id);
        const courseExams = (exams || []).filter(e => e.course_id === course.id);
        const courseExamIds = courseExams.map(e => e.id);
        const courseExamResults = (examResults || []).filter(r => courseExamIds.includes(r.exam_id));

        const avgProgress = courseEnrollments.length > 0
          ? Math.round(courseEnrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / courseEnrollments.length)
          : 0;

        const avgScore = courseExamResults.length > 0
          ? Math.round(courseExamResults.reduce((sum, r) => {
              const maxScore = (r.exams as any)?.max_score || 100;
              return sum + ((r.score / maxScore) * 100);
            }, 0) / courseExamResults.length)
          : 0;

        return {
          id: course.id,
          title: course.title,
          title_ar: course.title_ar,
          totalStudents: courseEnrollments.length,
          avgProgress,
          totalLessons: courseLessons.length,
          totalExams: courseExams.length,
          avgExamScore: avgScore,
        };
      });

      setCourseStats(courseStatsData);

      // Calculate attendance breakdown per lesson (for first 10 lessons)
      const lessonBreakdowns: AttendanceBreakdown[] = (lessons || []).slice(0, 10).map(lesson => {
        const lessonAttendance = (attendance || []).filter(a => a.lesson_id === lesson.id);
        
        // Get unique users who attended
        const userAttendance = new Map<string, { center: boolean; online: boolean }>();
        lessonAttendance.forEach(a => {
          const existing = userAttendance.get(a.user_id) || { center: false, online: false };
          if (a.attendance_type === 'center') existing.center = true;
          if (a.attendance_type === 'online') existing.online = true;
          userAttendance.set(a.user_id, existing);
        });

        let centerOnly = 0, onlineOnly = 0, both = 0;
        userAttendance.forEach(att => {
          if (att.center && att.online) both++;
          else if (att.center) centerOnly++;
          else if (att.online) onlineOnly++;
        });

        // Get course enrollments count for this lesson's course
        const courseEnrollments = (enrollments || []).filter(
          e => e.course_id === lesson.course_id && e.status === 'active'
        ).length;

        const attendedCount = centerOnly + onlineOnly + both;
        const absentCount = Math.max(0, courseEnrollments - attendedCount);

        return {
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          lessonTitleAr: lesson.title_ar,
          centerCount: centerOnly,
          onlineCount: onlineOnly,
          bothCount: both,
          absentCount,
          totalStudents: courseEnrollments,
        };
      });

      setAttendanceBreakdown(lessonBreakdowns);

      // Calculate top students
      const studentScores = new Map<string, { scores: number[], name: string | null, mode: string }>();

      (examResults || []).forEach(result => {
        const maxScore = (result.exams as any)?.max_score || 100;
        const percentage = (result.score / maxScore) * 100;

        if (!studentScores.has(result.user_id)) {
          const profile = (profiles || []).find(p => p.user_id === result.user_id);
          studentScores.set(result.user_id, { 
            scores: [], 
            name: profile?.full_name || null,
            mode: profile?.attendance_mode || 'online'
          });
        }
        studentScores.get(result.user_id)!.scores.push(percentage);
      });

      const topStudentsData: TopStudent[] = Array.from(studentScores.entries())
        .map(([userId, data]) => ({
          user_id: userId,
          full_name: data.name,
          avgScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
          totalExams: data.scores.length,
          attendance_mode: data.mode,
        }))
        .sort((a, b) => b.avgScore - a.avgScore)
        .slice(0, 10);

      setTopStudents(topStudentsData);

    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Compute actionable insights data
  const insightsData = useMemo(() => {
    if (!overallStats) return null;

    // Calculate lesson drop-offs (lessons with low completion rates)
    const lessonDropoffs = attendanceBreakdown
      .filter(l => l.totalStudents > 0)
      .map(l => ({
        lessonId: l.lessonId,
        title: isArabic ? l.lessonTitleAr : l.lessonTitle,
        dropoffRate: Math.round((l.absentCount / l.totalStudents) * 100)
      }))
      .filter(l => l.dropoffRate > 20)
      .sort((a, b) => b.dropoffRate - a.dropoffRate);

    // Calculate exam failures
    const examFailures = examAttempts.length > 0 
      ? Object.entries(
          examAttempts.reduce((acc, a) => {
            if (!acc[a.exam_id]) acc[a.exam_id] = { total: 0, failed: 0 };
            acc[a.exam_id].total++;
            const passMark = 60;
            if ((a.score / a.total_questions) * 100 < passMark) acc[a.exam_id].failed++;
            return acc;
          }, {} as Record<string, { total: number; failed: number }>)
        )
        .map(([examId, data]) => {
          const typedData = data as { total: number; failed: number };
          return {
            examId,
            title: examId,
            failRate: typedData.total > 0 ? Math.round((typedData.failed / typedData.total) * 100) : 0
          };
        })
        .filter(e => e.failRate > 30)
      : [];

    // Low progress students (< 25%)
    const lowProgressStudents = courseStats.reduce((count, course) => {
      return count + (course.avgProgress < 25 ? course.totalStudents : 0);
    }, 0);

    // Chapter progress
    const chapterProgress = chapters.map(ch => ({
      chapterId: ch.id,
      title: isArabic ? ch.title_ar : ch.title,
      avgProgress: 50 // Placeholder - would need proper calculation
    }));

    // Active students today (simplified - users with completions today)
    const today = new Date().toDateString();
    const activeToday = new Set(
      lessonCompletions
        .filter(lc => new Date(lc.completed_at).toDateString() === today)
        .map(lc => lc.user_id)
    ).size;

    return {
      lessonDropoffs,
      examFailures,
      lowProgressStudents,
      avgCompletionTime: 0,
      activeStudentsToday: activeToday,
      totalStudents: overallStats.totalStudents,
      chapterProgress,
    };
  }, [overallStats, attendanceBreakdown, examAttempts, chapters, lessonCompletions, courseStats, isArabic]);

  // Compute chapter analytics with REAL data
  const chapterAnalyticsData = useMemo(() => {
    return chapters.map(ch => {
      const courseTitle = (ch.course as any)?.title || '';
      const courseTitleAr = (ch.course as any)?.title_ar || '';
      
      // Get lessons for this chapter
      const chapterLessons = lessons.filter(l => l.chapter_id === ch.id);
      const chapterLessonIds = chapterLessons.map(l => l.id);
      const totalLessons = chapterLessons.length;
      
      // Get students enrolled in this chapter (via chapter_enrollments or course_enrollments)
      const chapterStudentIds = new Set<string>();
      
      // First check chapter-level enrollments
      const directChapterEnrolls = chapterEnrollments.filter(
        ce => ce.chapter_id === ch.id && ce.status === 'active'
      );
      directChapterEnrolls.forEach(ce => chapterStudentIds.add(ce.user_id));
      
      // If no chapter enrollments, fall back to course enrollments
      if (chapterStudentIds.size === 0) {
        const courseEnrolls = enrollments.filter(
          e => e.course_id === ch.course_id && e.status === 'active'
        );
        courseEnrolls.forEach(e => chapterStudentIds.add(e.user_id));
      }
      
      const totalStudents = chapterStudentIds.size;
      
      // Calculate average completion for this chapter
      let avgCompletion = 0;
      if (totalLessons > 0 && totalStudents > 0) {
        // Count completions per student for lessons in this chapter
        const studentCompletions = new Map<string, number>();
        
        lessonCompletions
          .filter(lc => chapterLessonIds.includes(lc.lesson_id))
          .forEach(lc => {
            if (chapterStudentIds.has(lc.user_id)) {
              studentCompletions.set(
                lc.user_id, 
                (studentCompletions.get(lc.user_id) || 0) + 1
              );
            }
          });
        
        // Calculate completion percentage per student, then average
        let totalCompletionPercent = 0;
        chapterStudentIds.forEach(studentId => {
          const completed = studentCompletions.get(studentId) || 0;
          totalCompletionPercent += (completed / totalLessons) * 100;
        });
        
        avgCompletion = Math.round(totalCompletionPercent / totalStudents);
      }
      
      // Calculate exam pass rate for chapter exams
      const chapterExams = exams.filter(e => e.chapter_id === ch.id);
      let examPassRate: number | null = null;
      
      if (chapterExams.length > 0) {
        const chapterExamIds = chapterExams.map(e => e.id);
        const chapterAttempts = examAttempts.filter(
          a => chapterExamIds.includes(a.exam_id) && a.is_completed
        );
        
        if (chapterAttempts.length > 0) {
          const passedCount = chapterAttempts.filter(a => {
            const percentage = a.total_questions > 0 
              ? (a.score / a.total_questions) * 100 
              : 0;
            return percentage >= 60;
          }).length;
          
          examPassRate = Math.round((passedCount / chapterAttempts.length) * 100);
        }
      }
      
      // Calculate REAL focus time from focus_sessions for this chapter's lessons
      const chapterFocusSessions = focusSessions.filter(
        fs => chapterLessonIds.includes(fs.lesson_id)
      );
      
      // Total active viewing minutes for all students in this chapter
      const totalActiveMinutes = Math.round(
        chapterFocusSessions.reduce((sum, fs) => sum + (fs.total_active_seconds || 0), 0) / 60
      );
      
      // Students who actually watched (have focus sessions)
      const studentsWithFocus = new Set(
        chapterFocusSessions.map(fs => fs.user_id)
      ).size;
      
      // Average viewing minutes per student
      const avgViewingMinutes = studentsWithFocus > 0 
        ? Math.round(totalActiveMinutes / studentsWithFocus) 
        : 0;
      
      // Total expected duration for chapter lessons (in minutes)
      const expectedDuration = chapterLessons.reduce(
        (sum, l) => sum + (l.duration_minutes || 0), 0
      );
      
      // Viewing coverage: what percentage of expected time students actually watched
      const viewingCoverage = expectedDuration > 0 && studentsWithFocus > 0
        ? Math.min(100, Math.round((avgViewingMinutes / expectedDuration) * 100))
        : 0;
      
      // Total interruptions in this chapter
      const totalInterruptions = chapterFocusSessions.reduce(
        (sum, fs) => sum + (fs.interruptions || 0), 0
      );
      
      return {
        id: ch.id,
        title: ch.title,
        titleAr: ch.title_ar,
        courseName: courseTitle,
        courseNameAr: courseTitleAr,
        totalLessons,
        avgCompletion,
        totalStudents,
        examPassRate,
        // New focus-based metrics
        totalActiveMinutes,
        studentsWithFocus,
        avgViewingMinutes,
        expectedDuration,
        viewingCoverage,
        totalInterruptions,
      };
    });
  }, [chapters, lessons, lessonCompletions, enrollments, chapterEnrollments, exams, examAttempts]);

  // Compute exam analytics
  const examAnalyticsData = useMemo(() => {
    const examStats = new Map<string, {
      title: string;
      titleAr: string;
      courseName: string;
      courseNameAr: string;
      attempts: number;
      passed: number;
      failed: number;
      totalScore: number;
    }>();

    examAttempts.forEach(attempt => {
      if (!attempt.is_completed) return;
      
      const examId = attempt.exam_id;
      if (!examStats.has(examId)) {
        examStats.set(examId, {
          title: examId,
          titleAr: examId,
          courseName: '',
          courseNameAr: '',
          attempts: 0,
          passed: 0,
          failed: 0,
          totalScore: 0,
        });
      }

      const stat = examStats.get(examId)!;
      stat.attempts++;
      const percentage = attempt.total_questions > 0 
        ? (attempt.score / attempt.total_questions) * 100 
        : 0;
      stat.totalScore += percentage;
      if (percentage >= 60) stat.passed++;
      else stat.failed++;
    });

    return Array.from(examStats.entries()).map(([id, stat]) => ({
      id,
      title: stat.title,
      titleAr: stat.titleAr,
      courseName: stat.courseName,
      courseNameAr: stat.courseNameAr,
      totalAttempts: stat.attempts,
      passCount: stat.passed,
      failCount: stat.failed,
      avgScore: stat.attempts > 0 ? Math.round(stat.totalScore / stat.attempts) : 0,
      firstAttemptPassRate: 0,
    }));
  }, [examAttempts]);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-blue-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-3.5 h-3.5 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: `${i * 150}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-mobile-nav" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />

      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/assistant')}>
              <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{isArabic ? 'التقارير والإحصائيات' : 'Reports & Statistics'}</h1>
              <p className="text-muted-foreground text-sm">
                {isArabic ? 'نظرة شاملة على أداء الطلاب والحضور' : 'Overview of student performance and attendance'}
              </p>
            </div>
          </div>
        </div>

        {/* Overall Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Users className="h-4 w-4" />
              <span className="text-xs">{isArabic ? 'الطلاب' : 'Students'}</span>
            </div>
            <p className="text-2xl font-bold">{overallStats?.totalStudents || 0}</p>
          </div>

          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <BookOpen className="h-4 w-4" />
              <span className="text-xs">{isArabic ? 'الاشتراكات' : 'Enrollments'}</span>
            </div>
            <p className="text-2xl font-bold">{overallStats?.activeEnrollments || 0}</p>
            <p className="text-xs text-muted-foreground">
              {overallStats?.pendingEnrollments || 0} {isArabic ? 'معلق' : 'pending'}
            </p>
          </div>

          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">{isArabic ? 'متوسط التقدم' : 'Avg Progress'}</span>
            </div>
            <p className="text-2xl font-bold">{overallStats?.avgOverallProgress || 0}%</p>
          </div>

          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Award className="h-4 w-4" />
              <span className="text-xs">{isArabic ? 'متوسط الدرجات' : 'Avg Score'}</span>
            </div>
            <p className={`text-2xl font-bold ${getScoreColor(overallStats?.avgOverallExamScore || 0)}`}>
              {overallStats?.avgOverallExamScore || 0}%
            </p>
          </div>

          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs">{isArabic ? 'الامتحانات' : 'Exams'}</span>
            </div>
            <p className="text-2xl font-bold">{overallStats?.totalExamResults || 0}</p>
          </div>
        </div>

        {/* Focus Mode Stats Section - Only show when there's meaningful data */}
        {(overallStats?.totalFocusSessions ?? 0) > 0 && (
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Play className="h-5 w-5 text-green-600" />
              {isArabic ? 'نشاط وضع التركيز' : 'Focus Mode Activity'}
            </h2>
            
            {/* Main Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-background/50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-green-600">{overallStats?.totalFocusSessions || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">{isArabic ? 'جلسة تركيز' : 'Focus Sessions'}</p>
              </div>
              <div className="bg-background/50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-green-600">
                  {overallStats?.totalFocusMinutes && overallStats.totalFocusMinutes >= 60 
                    ? `${Math.floor(overallStats.totalFocusMinutes / 60)}h ${overallStats.totalFocusMinutes % 60}m`
                    : `${overallStats?.totalFocusMinutes || 0}m`
                  }
                </p>
                <p className="text-xs text-muted-foreground mt-1">{isArabic ? 'وقت المشاهدة الفعلي' : 'Actual Watch Time'}</p>
              </div>
              <div className="bg-background/50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-green-600">
                  {overallStats?.studentsWithFocusSessions || 0}
                  <span className="text-lg text-muted-foreground">/{overallStats?.totalStudents || 0}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">{isArabic ? 'طلاب استخدموا وضع التركيز' : 'Students Used Focus'}</p>
              </div>
              <div className="bg-background/50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-green-600">{overallStats?.avgFocusMinutesPerStudent || 0}m</p>
                <p className="text-xs text-muted-foreground mt-1">{isArabic ? 'متوسط/طالب' : 'Avg/Student'}</p>
              </div>
            </div>
            
            {/* Focus Rate Progress Bar */}
            <div className="bg-background/50 rounded-lg p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">{isArabic ? 'نسبة الطلاب النشطين في وضع التركيز' : 'Students Active in Focus Mode'}</span>
                <span className="font-semibold text-green-600">
                  {overallStats?.totalStudents && overallStats.totalStudents > 0 
                    ? Math.round((overallStats.studentsWithFocusSessions / overallStats.totalStudents) * 100)
                    : 0}%
                </span>
              </div>
              <Progress 
                value={overallStats?.totalStudents && overallStats.totalStudents > 0 
                  ? (overallStats.studentsWithFocusSessions / overallStats.totalStudents) * 100
                  : 0} 
                className="h-2 [&>div]:bg-green-500" 
              />
            </div>
          </div>
        )}

        {/* Actionable Insights Section */}
        {insightsData && (
          <div className="mb-8">
            <ActionableInsights data={insightsData} isArabic={isArabic} />
          </div>
        )}

        {/* Analytics Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <ChapterAnalytics chapters={chapterAnalyticsData} isArabic={isArabic} />
          <ExamAnalytics exams={examAnalyticsData} isArabic={isArabic} />
        </div>


        {/* Course Stats */}
        <div className="bg-card border rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            {isArabic ? 'إحصائيات الكورسات' : 'Course Statistics'}
          </h2>

          {courseStats.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              {isArabic ? 'لا توجد كورسات بعد' : 'No courses yet'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-start py-3 px-2 text-sm font-medium text-muted-foreground">
                      {isArabic ? 'الكورس' : 'Course'}
                    </th>
                    <th className="text-start py-3 px-2 text-sm font-medium text-muted-foreground">
                      {isArabic ? 'الطلاب' : 'Students'}
                    </th>
                    <th className="text-start py-3 px-2 text-sm font-medium text-muted-foreground">
                      {isArabic ? 'الحصص' : 'Lessons'}
                    </th>
                    <th className="text-start py-3 px-2 text-sm font-medium text-muted-foreground hidden md:table-cell">
                      {isArabic ? 'التقدم' : 'Progress'}
                    </th>
                    <th className="text-start py-3 px-2 text-sm font-medium text-muted-foreground hidden md:table-cell">
                      {isArabic ? 'متوسط الدرجات' : 'Avg Score'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {courseStats.map(course => (
                    <tr key={course.id} className="hover:bg-muted/30">
                      <td className="py-3 px-2 font-medium">
                        {isArabic ? course.title_ar : course.title}
                      </td>
                      <td className="py-3 px-2">{course.totalStudents}</td>
                      <td className="py-3 px-2">{course.totalLessons}</td>
                      <td className="py-3 px-2 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <Progress value={course.avgProgress} className="w-20 h-2" />
                          <span className="text-sm">{course.avgProgress}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 hidden md:table-cell">
                        {course.totalExams > 0 ? (
                          <span className={`font-medium ${getScoreColor(course.avgExamScore)}`}>
                            {course.avgExamScore}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Students */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            {isArabic ? 'أفضل الطلاب (حسب درجات الامتحانات)' : 'Top Students (by Exam Scores)'}
          </h2>

          {topStudents.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              {isArabic ? 'لا توجد نتائج امتحانات بعد' : 'No exam results yet'}
            </p>
          ) : (
            <div className="space-y-3">
              {topStudents.map((student, index) => (
                <div
                  key={student.user_id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/assistant/students/${student.user_id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      index < 3 ? 'bg-primary' : 'bg-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{student.full_name || (isArabic ? 'بدون اسم' : 'No name')}</p>
                      <p className="text-xs text-muted-foreground">
                        {student.totalExams} {isArabic ? 'امتحان' : 'exams'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full ${getScoreBgColor(student.avgScore)}`}
                        style={{ width: `${student.avgScore}%` }}
                      />
                    </div>
                    <span className={`font-bold ${getScoreColor(student.avgScore)}`}>
                      {student.avgScore}%
                    </span>
                  </div>
                </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
