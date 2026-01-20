import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Users, BookOpen, Award, TrendingUp, BarChart3, Play, Clock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/Navbar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useIsMobile } from '@/hooks/use-mobile';
import { SmartInsights } from '@/components/analytics/SmartInsights';
import { MobileChapterAnalytics } from '@/components/analytics/MobileChapterCard';
import { MobileExamAnalytics } from '@/components/analytics/MobileExamAnalytics';
import { MobileMetricCard } from '@/components/analytics/MobileMetricCard';
import { ChapterAnalytics } from '@/components/analytics/ChapterAnalytics';
import { ExamAnalytics } from '@/components/analytics/ExamAnalytics';
import { PulsingDots } from '@/components/ui/PulsingDots';
import { ReportsStatusHeader } from '@/components/analytics/ReportsStatusHeader';
import { type SystemStatusCode } from '@/lib/statusCopy';
import { cn } from '@/lib/utils';

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
  avgScoreExcludingZero: number; // NEW: exclude zero attempts
  totalFocusSessions: number;
  meaningfulFocusSessions: number; // NEW: sessions > 2 min
  totalFocusMinutes: number;
  studentsWithFocusSessions: number;
  avgFocusMinutesPerStudent: number;
  studentsWatchingNotTesting: number; // NEW: watch but don't test
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
  const location = useLocation();
  const { language, isRTL } = useLanguage();
  const { canAccessDashboard, loading: roleLoading } = useUserRole();
  const isMobile = useIsMobile();
  const isArabic = language === 'ar';
  
  // Status filter from dashboard navigation
  const [focusStatus, setFocusStatus] = useState<SystemStatusCode | null>(() => {
    const state = location.state as { focusStatus?: SystemStatusCode } | null;
    return state?.focusStatus || null;
  });

  const handleClearFilter = () => {
    setFocusStatus(null);
    // Clear location state
    navigate(location.pathname, { replace: true, state: {} });
  };

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

      setChapters(chaptersData || []);
      setLessonCompletions(lessonCompletionsData || []);
      setExamAttempts(examAttemptsData || []);
      setFocusSessions(focusSessionsData || []);
      setLessons(lessonsData || []);
      setEnrollments(enrollmentsData || []);
      setChapterEnrollments(chapterEnrollmentsData || []);
      setExams(examsData || []);
      
      const lessons = lessonsData || [];
      const enrollments = enrollmentsData || [];
      const exams = examsData || [];
      const profiles = (allProfiles || []).filter(p => studentUserIds.includes(p.user_id));

      const activeEnrollments = (enrollments || []).filter(e => e.status === 'active').length;
      const pendingEnrollments = (enrollments || []).filter(e => e.status === 'pending').length;

      const avgProgress = (enrollments || []).length > 0
        ? Math.round((enrollments || []).reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments!.length)
        : 0;

      // Standard avg score
      const avgExamScore = (examResults || []).length > 0
        ? Math.round((examResults || []).reduce((sum, r) => {
            const maxScore = (r.exams as any)?.max_score || 100;
            return sum + ((r.score / maxScore) * 100);
          }, 0) / examResults!.length)
        : 0;

      // NEW: Avg score excluding students with 0 attempts
      const validResults = (examResults || []).filter(r => r.score > 0);
      const avgScoreExcludingZero = validResults.length > 0
        ? Math.round(validResults.reduce((sum, r) => {
            const maxScore = (r.exams as any)?.max_score || 100;
            return sum + ((r.score / maxScore) * 100);
          }, 0) / validResults.length)
        : 0;

      // Focus session stats
      const allFocusSessions = focusSessionsData || [];
      const totalFocusSessions = allFocusSessions.length;
      
      // NEW: Only count sessions > 2 minutes (120 seconds)
      const meaningfulFocusSessions = allFocusSessions.filter(
        s => (s.total_active_seconds || 0) > 120
      ).length;
      
      const totalFocusMinutes = Math.round(
        allFocusSessions.reduce((sum, s) => sum + (s.total_active_seconds || 0), 0) / 60
      );
      const studentsWithFocusSessions = new Set(allFocusSessions.map(s => s.user_id)).size;
      const avgFocusMinutesPerStudent = studentsWithFocusSessions > 0 
        ? Math.round(totalFocusMinutes / studentsWithFocusSessions) 
        : 0;

      // NEW: Students who watched but didn't test
      const studentsWithFocus = new Set(allFocusSessions.map(s => s.user_id));
      const studentsWithExams = new Set((examAttemptsData || []).map(a => a.user_id));
      const studentsWatchingNotTesting = [...studentsWithFocus].filter(
        id => !studentsWithExams.has(id)
      ).length;

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
        avgScoreExcludingZero,
        totalFocusSessions,
        meaningfulFocusSessions,
        totalFocusMinutes,
        studentsWithFocusSessions,
        avgFocusMinutesPerStudent,
        studentsWatchingNotTesting,
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

      // Attendance breakdown
      const lessonBreakdowns: AttendanceBreakdown[] = (lessons || []).slice(0, 10).map(lesson => {
        const lessonAttendance = (attendance || []).filter(a => a.lesson_id === lesson.id);
        
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

      // Top students
      const studentScores = new Map<string, { scores: number[], name: string | null }>();

      (examResults || []).forEach(result => {
        const maxScore = (result.exams as any)?.max_score || 100;
        const percentage = (result.score / maxScore) * 100;

        if (!studentScores.has(result.user_id)) {
          const profile = (profiles || []).find(p => p.user_id === result.user_id);
          studentScores.set(result.user_id, { 
            scores: [], 
            name: profile?.full_name || null,
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

  // Insights data with smart metrics
  const insightsData = useMemo(() => {
    if (!overallStats) return null;

    const lessonDropoffs = attendanceBreakdown
      .filter(l => l.totalStudents > 0)
      .map(l => ({
        lessonId: l.lessonId,
        title: isArabic ? l.lessonTitleAr : l.lessonTitle,
        dropoffRate: Math.round((l.absentCount / l.totalStudents) * 100)
      }))
      .filter(l => l.dropoffRate > 20)
      .sort((a, b) => b.dropoffRate - a.dropoffRate);

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

    const lowProgressStudents = courseStats.reduce((count, course) => {
      return count + (course.avgProgress < 25 ? course.totalStudents : 0);
    }, 0);

    const chapterProgress = chapters.map(ch => ({
      chapterId: ch.id,
      title: isArabic ? ch.title_ar : ch.title,
      avgProgress: 50
    }));

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
      activeStudentsToday: activeToday,
      totalStudents: overallStats.totalStudents,
      chapterProgress,
      avgScoreExcludingZero: overallStats.avgScoreExcludingZero,
      meaningfulFocusSessions: overallStats.meaningfulFocusSessions,
      studentsWatchingNotTesting: overallStats.studentsWatchingNotTesting,
    };
  }, [overallStats, attendanceBreakdown, examAttempts, chapters, lessonCompletions, courseStats, isArabic]);

  // Chapter analytics data
  const chapterAnalyticsData = useMemo(() => {
    return chapters.map(ch => {
      const courseTitle = (ch.course as any)?.title || '';
      const courseTitleAr = (ch.course as any)?.title_ar || '';
      
      const chapterLessons = lessons.filter(l => l.chapter_id === ch.id);
      const chapterLessonIds = chapterLessons.map(l => l.id);
      const totalLessons = chapterLessons.length;
      
      const chapterStudentIds = new Set<string>();
      
      const directChapterEnrolls = chapterEnrollments.filter(
        ce => ce.chapter_id === ch.id && ce.status === 'active'
      );
      directChapterEnrolls.forEach(ce => chapterStudentIds.add(ce.user_id));
      
      if (chapterStudentIds.size === 0) {
        const courseEnrolls = enrollments.filter(
          e => e.course_id === ch.course_id && e.status === 'active'
        );
        courseEnrolls.forEach(e => chapterStudentIds.add(e.user_id));
      }
      
      const totalStudents = chapterStudentIds.size;
      
      let avgCompletion = 0;
      if (totalLessons > 0 && totalStudents > 0) {
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
        
        let totalCompletionPercent = 0;
        chapterStudentIds.forEach(studentId => {
          const completed = studentCompletions.get(studentId) || 0;
          totalCompletionPercent += (completed / totalLessons) * 100;
        });
        
        avgCompletion = Math.round(totalCompletionPercent / totalStudents);
      }
      
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
      
      // Focus sessions > 2 min only
      const chapterFocusSessions = focusSessions.filter(
        fs => chapterLessonIds.includes(fs.lesson_id) && (fs.total_active_seconds || 0) > 120
      );
      
      const totalActiveMinutes = Math.round(
        chapterFocusSessions.reduce((sum, fs) => sum + (fs.total_active_seconds || 0), 0) / 60
      );
      
      const studentsWithFocus = new Set(
        chapterFocusSessions.map(fs => fs.user_id)
      ).size;
      
      const avgViewingMinutes = studentsWithFocus > 0 
        ? Math.round(totalActiveMinutes / studentsWithFocus) 
        : 0;
      
      const expectedDuration = chapterLessons.reduce(
        (sum, l) => sum + (l.duration_minutes || 0), 0
      );
      
      const viewingCoverage = expectedDuration > 0 && studentsWithFocus > 0
        ? Math.min(100, Math.round((avgViewingMinutes / expectedDuration) * 100))
        : 0;
      
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
        totalActiveMinutes,
        studentsWithFocus,
        avgViewingMinutes,
        expectedDuration,
        viewingCoverage,
        totalInterruptions,
      };
    });
  }, [chapters, lessons, lessonCompletions, enrollments, chapterEnrollments, exams, examAttempts, focusSessions]);

  // Exam analytics data
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

  // Loading state - only show if loading > 300ms
  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <PulsingDots size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-mobile-nav" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />

      <main className="container mx-auto px-3 md:px-4 py-6 pt-20 md:pt-24">
        {/* Header - Compact on mobile */}
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 md:h-10 md:w-10" onClick={() => navigate('/assistant')}>
            <ArrowLeft className={cn("h-4 w-4 md:h-5 md:w-5", isRTL && 'rotate-180')} />
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-bold truncate">
              {isArabic ? 'التقارير والإحصائيات' : 'Reports & Statistics'}
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground truncate">
              {isArabic ? 'نظرة شاملة على أداء الطلاب' : 'Student performance overview'}
            </p>
          </div>
        </div>

        {/* Status Filter Header - Shows when navigated from dashboard status */}
        <ReportsStatusHeader
          focusStatus={focusStatus}
          onClearFilter={handleClearFilter}
          isRTL={isRTL}
        />

        {/* Mobile: Vertical metric cards */}
        {isMobile ? (
          <div className="space-y-2 mb-4">
            <MobileMetricCard
              icon={Users}
              label={isArabic ? 'الطلاب' : 'Students'}
              value={overallStats?.totalStudents || 0}
              subValue={`${overallStats?.activeEnrollments || 0} ${isArabic ? 'نشط' : 'active'}`}
            />
            <MobileMetricCard
              icon={TrendingUp}
              label={isArabic ? 'متوسط التقدم' : 'Avg Progress'}
              value={`${overallStats?.avgOverallProgress || 0}%`}
              colorClass={overallStats?.avgOverallProgress && overallStats.avgOverallProgress >= 50 ? 'text-green-600' : 'text-amber-600'}
              bgClass={overallStats?.avgOverallProgress && overallStats.avgOverallProgress >= 50 ? 'bg-green-500/10' : 'bg-amber-500/10'}
            />
            <MobileMetricCard
              icon={Award}
              label={isArabic ? 'متوسط الدرجات (فعلي)' : 'Avg Score (active)'}
              value={`${overallStats?.avgScoreExcludingZero || 0}%`}
              subValue={isArabic ? 'بدون الصفر' : 'excl. zero'}
              colorClass={getScoreColor(overallStats?.avgScoreExcludingZero || 0)}
              bgClass="bg-primary/10"
            />
            <MobileMetricCard
              icon={Eye}
              label={isArabic ? 'جلسات تركيز فعالة' : 'Meaningful Focus'}
              value={overallStats?.meaningfulFocusSessions || 0}
              subValue={isArabic ? '> 2 دقيقة' : '> 2 min'}
              colorClass="text-green-600"
              bgClass="bg-green-500/10"
            />
          </div>
        ) : (
          /* Desktop: Grid stats */
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 mb-6">
            <div className="bg-card border rounded-xl p-3 md:p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1 md:mb-2">
                <Users className="h-4 w-4" />
                <span className="text-xs">{isArabic ? 'الطلاب' : 'Students'}</span>
              </div>
              <p className="text-xl md:text-2xl font-bold">{overallStats?.totalStudents || 0}</p>
            </div>

            <div className="bg-card border rounded-xl p-3 md:p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1 md:mb-2">
                <BookOpen className="h-4 w-4" />
                <span className="text-xs">{isArabic ? 'الاشتراكات' : 'Enrollments'}</span>
              </div>
              <p className="text-xl md:text-2xl font-bold">{overallStats?.activeEnrollments || 0}</p>
              <p className="text-xs text-muted-foreground">
                {overallStats?.pendingEnrollments || 0} {isArabic ? 'معلق' : 'pending'}
              </p>
            </div>

            <div className="bg-card border rounded-xl p-3 md:p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1 md:mb-2">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">{isArabic ? 'متوسط التقدم' : 'Avg Progress'}</span>
              </div>
              <p className="text-xl md:text-2xl font-bold">{overallStats?.avgOverallProgress || 0}%</p>
            </div>

            <div className="bg-card border rounded-xl p-3 md:p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1 md:mb-2">
                <Award className="h-4 w-4" />
                <span className="text-xs">{isArabic ? 'متوسط الدرجات' : 'Avg Score'}</span>
              </div>
              <p className={cn("text-xl md:text-2xl font-bold", getScoreColor(overallStats?.avgScoreExcludingZero || 0))}>
                {overallStats?.avgScoreExcludingZero || 0}%
              </p>
              <p className="text-xs text-muted-foreground">{isArabic ? 'بدون الصفر' : 'excl. zero'}</p>
            </div>

            <div className="bg-card border rounded-xl p-3 md:p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1 md:mb-2">
                <Eye className="h-4 w-4" />
                <span className="text-xs">{isArabic ? 'تركيز فعال' : 'Real Focus'}</span>
              </div>
              <p className="text-xl md:text-2xl font-bold text-green-600">{overallStats?.meaningfulFocusSessions || 0}</p>
              <p className="text-xs text-muted-foreground">{isArabic ? '> 2 دقيقة' : '> 2 min'}</p>
            </div>
          </div>
        )}

        {/* Focus Mode Summary - Compact on mobile */}
        {(overallStats?.totalFocusSessions ?? 0) > 0 && (
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-3 md:p-4 mb-4 md:mb-6">
            <h2 className="text-sm md:text-base font-semibold mb-2 md:mb-3 flex items-center gap-2">
              <Play className="h-4 w-4 text-green-600" />
              {isArabic ? 'نشاط التركيز' : 'Focus Activity'}
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              <div className="bg-background/50 rounded-lg p-2 md:p-3 text-center">
                <p className="text-lg md:text-2xl font-bold text-green-600">
                  {overallStats?.totalFocusMinutes && overallStats.totalFocusMinutes >= 60 
                    ? `${Math.floor(overallStats.totalFocusMinutes / 60)}h`
                    : `${overallStats?.totalFocusMinutes || 0}m`
                  }
                </p>
                <p className="text-xs text-muted-foreground">{isArabic ? 'وقت المشاهدة' : 'Watch Time'}</p>
              </div>
              <div className="bg-background/50 rounded-lg p-2 md:p-3 text-center">
                <p className="text-lg md:text-2xl font-bold text-green-600">
                  {overallStats?.studentsWithFocusSessions || 0}
                </p>
                <p className="text-xs text-muted-foreground">{isArabic ? 'طالب نشط' : 'Active'}</p>
              </div>
              <div className="bg-background/50 rounded-lg p-2 md:p-3 text-center">
                <p className="text-lg md:text-2xl font-bold">{overallStats?.avgFocusMinutesPerStudent || 0}m</p>
                <p className="text-xs text-muted-foreground">{isArabic ? 'متوسط/طالب' : 'Avg/Student'}</p>
              </div>
              <div className="bg-background/50 rounded-lg p-2 md:p-3 text-center">
                <p className={cn(
                  "text-lg md:text-2xl font-bold",
                  (overallStats?.studentsWatchingNotTesting || 0) > 3 ? "text-amber-600" : "text-foreground"
                )}>
                  {overallStats?.studentsWatchingNotTesting || 0}
                </p>
                <p className="text-xs text-muted-foreground">{isArabic ? 'يشاهد فقط' : 'Watch Only'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Smart Insights - "What should I fix today?" */}
        {insightsData && (
          <div className="mb-4 md:mb-6">
            <SmartInsights data={insightsData} isArabic={isArabic} />
          </div>
        )}

        {/* Analytics - Mobile vs Desktop */}
        {isMobile ? (
          <div className="space-y-4 mb-4">
            <MobileChapterAnalytics chapters={chapterAnalyticsData} isArabic={isArabic} />
            <MobileExamAnalytics exams={examAnalyticsData} isArabic={isArabic} />
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4 md:gap-6 mb-6">
            <ChapterAnalytics chapters={chapterAnalyticsData} isArabic={isArabic} />
            <ExamAnalytics exams={examAnalyticsData} isArabic={isArabic} />
          </div>
        )}

        {/* Course Stats - Table on desktop, Cards on mobile */}
        <div className="bg-card border rounded-xl p-3 md:p-4 mb-4 md:mb-6">
          <h2 className="text-sm md:text-base font-semibold mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            {isArabic ? 'إحصائيات الكورسات' : 'Course Statistics'}
          </h2>

          {courseStats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-3">
              {isArabic ? 'لا توجد كورسات' : 'No courses yet'}
            </p>
          ) : isMobile ? (
            <div className="space-y-2">
              {courseStats.slice(0, 5).map(course => (
                <div key={course.id} className="border rounded-lg p-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium truncate flex-1">
                      {isArabic ? course.title_ar : course.title}
                    </span>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {course.totalStudents}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={course.avgProgress} className="flex-1 h-1.5" />
                    <span className="text-xs text-muted-foreground">{course.avgProgress}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-start py-2 px-2 text-xs font-medium text-muted-foreground">
                      {isArabic ? 'الكورس' : 'Course'}
                    </th>
                    <th className="text-start py-2 px-2 text-xs font-medium text-muted-foreground">
                      {isArabic ? 'الطلاب' : 'Students'}
                    </th>
                    <th className="text-start py-2 px-2 text-xs font-medium text-muted-foreground">
                      {isArabic ? 'الحصص' : 'Lessons'}
                    </th>
                    <th className="text-start py-2 px-2 text-xs font-medium text-muted-foreground hidden md:table-cell">
                      {isArabic ? 'التقدم' : 'Progress'}
                    </th>
                    <th className="text-start py-2 px-2 text-xs font-medium text-muted-foreground hidden md:table-cell">
                      {isArabic ? 'متوسط الدرجات' : 'Avg Score'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {courseStats.map(course => (
                    <tr key={course.id} className="hover:bg-muted/30">
                      <td className="py-2 px-2 text-sm font-medium">
                        {isArabic ? course.title_ar : course.title}
                      </td>
                      <td className="py-2 px-2 text-sm">{course.totalStudents}</td>
                      <td className="py-2 px-2 text-sm">{course.totalLessons}</td>
                      <td className="py-2 px-2 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <Progress value={course.avgProgress} className="w-16 h-1.5" />
                          <span className="text-xs">{course.avgProgress}%</span>
                        </div>
                      </td>
                      <td className="py-2 px-2 hidden md:table-cell">
                        {course.totalExams > 0 ? (
                          <span className={cn("text-sm font-medium", getScoreColor(course.avgExamScore))}>
                            {course.avgExamScore}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Students - Compact */}
        <div className="bg-card border rounded-xl p-3 md:p-4">
          <h2 className="text-sm md:text-base font-semibold mb-3 flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            {isArabic ? 'أفضل الطلاب' : 'Top Students'}
          </h2>

          {topStudents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-3">
              {isArabic ? 'لا توجد نتائج' : 'No exam results yet'}
            </p>
          ) : (
            <div className="space-y-2">
              {topStudents.slice(0, isMobile ? 5 : 10).map((student, index) => (
                <div
                  key={student.user_id}
                  className="flex items-center justify-between p-2 md:p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/assistant/students/${student.user_id}`)}
                >
                  <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    <div className={cn(
                      "w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0",
                      index < 3 ? 'bg-primary' : 'bg-muted-foreground'
                    )}>
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{student.full_name || (isArabic ? 'بدون اسم' : 'No name')}</p>
                      <p className="text-xs text-muted-foreground">
                        {student.totalExams} {isArabic ? 'امتحان' : 'exams'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="h-1.5 w-10 md:w-12 rounded-full bg-muted overflow-hidden hidden sm:block">
                      <div
                        className={getScoreBgColor(student.avgScore)}
                        style={{ width: `${student.avgScore}%`, height: '100%' }}
                      />
                    </div>
                    <span className={cn("text-sm font-bold", getScoreColor(student.avgScore))}>
                      {student.avgScore}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
