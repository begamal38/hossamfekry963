/**
 * Reports & Statistics Page
 * 
 * This is the System Truth Surface - READ-ONLY, Status-Driven.
 * 
 * RULES:
 * - Consumes useSystemStatus hook directly
 * - NO new business logic computed here
 * - All sections explain WHY the current status exists
 * - Uses same thresholds as Status Engine
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Users, BookOpen, Award, TrendingUp, BarChart3, Play, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/Navbar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSystemStatus, type SystemStatusMetrics } from '@/hooks/useSystemStatus';
// SmartInsights removed - consolidated into ActionableBreakdown
import { MobileChapterAnalytics } from '@/components/analytics/MobileChapterCard';
import { MobileExamAnalytics } from '@/components/analytics/MobileExamAnalytics';
import { MobileMetricCard } from '@/components/analytics/MobileMetricCard';
import { ChapterAnalytics } from '@/components/analytics/ChapterAnalytics';
import { ExamAnalytics } from '@/components/analytics/ExamAnalytics';
import { PulsingDots } from '@/components/ui/PulsingDots';
import { ReportsStatusHeader } from '@/components/analytics/ReportsStatusHeader';
import { StatusEvidenceBlocks } from '@/components/analytics/StatusEvidenceBlocks';
import { ActionableBreakdown } from '@/components/analytics/ActionableBreakdown';
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

interface TopStudent {
  user_id: string;
  full_name: string | null;
  avgScore: number;
  totalExams: number;
}

export default function Reports() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, isRTL } = useLanguage();
  const { canAccessDashboard, loading: roleLoading } = useUserRole();
  const isMobile = useIsMobile();
  const isArabic = language === 'ar';
  
  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS ENGINE CONSUMPTION (Single Source of Truth)
  // ═══════════════════════════════════════════════════════════════════════════
  
  const systemStatus = useSystemStatus();
  
  // Status filter from dashboard navigation
  const [isFiltered, setIsFiltered] = useState<boolean>(() => {
    const state = location.state as { focusStatus?: SystemStatusCode } | null;
    return !!state?.focusStatus;
  });

  const handleClearFilter = () => {
    setIsFiltered(false);
    navigate(location.pathname, { replace: true, state: {} });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SUPPLEMENTARY DATA (for drill-down sections only)
  // ═══════════════════════════════════════════════════════════════════════════

  const [loading, setLoading] = useState(true);
  const [courseStats, setCourseStats] = useState<CourseStats[]>([]);
  const [topStudents, setTopStudents] = useState<TopStudent[]>([]);
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
    fetchSupplementaryData();
  }, [roleLoading]);

  /**
   * Fetch supplementary data for drill-down sections.
   * This is NOT used for status computation - that comes from useSystemStatus.
   */
  const fetchSupplementaryData = async () => {
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
      
      const profiles = (allProfiles || []).filter(p => studentUserIds.includes(p.user_id));

      // Course stats for drill-down
      const courseStatsData: CourseStats[] = (courses || []).map(course => {
        const courseEnrollments = (enrollmentsData || []).filter(e => e.course_id === course.id);
        const courseLessons = (lessonsData || []).filter(l => l.course_id === course.id);
        const courseExams = (examsData || []).filter(e => e.course_id === course.id);
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

      // Top students for drill-down
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
      console.error('Error fetching supplementary data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // DERIVED DATA FOR DRILL-DOWN COMPONENTS (uses same thresholds)
  // ═══════════════════════════════════════════════════════════════════════════

  // SmartInsights data (uses SAME metrics as status engine where applicable)
  const insightsData = useMemo(() => {
    if (!systemStatus.metrics) return null;

    const lessonDropoffs: { lessonId: string; title: string; dropoffRate: number }[] = [];
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

    // Calculate students watching but not testing from focus sessions and exam attempts
    const studentsWithFocus = new Set(focusSessions.filter(s => (s.total_active_seconds || 0) > 120).map(s => s.user_id));
    const studentsWithExams = new Set(examAttempts.map(a => a.user_id));
    const studentsWatchingNotTesting = [...studentsWithFocus].filter(id => !studentsWithExams.has(id)).length;

    return {
      lessonDropoffs,
      examFailures,
      lowProgressStudents,
      activeStudentsToday: activeToday,
      totalStudents: systemStatus.metrics.totalStudents,
      chapterProgress,
      avgScoreExcludingZero: systemStatus.metrics.avgExamScore,
      meaningfulFocusSessions: systemStatus.metrics.meaningfulFocusSessions,
      studentsWatchingNotTesting,
    };
  }, [systemStatus.metrics, examAttempts, chapters, lessonCompletions, courseStats, focusSessions, isArabic]);

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
      
      // Focus sessions > 2 min only (same threshold as status engine)
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

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPER FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════

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

  // ═══════════════════════════════════════════════════════════════════════════
  // LOADING STATE
  // ═══════════════════════════════════════════════════════════════════════════

  if (loading || roleLoading || systemStatus.loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <PulsingDots size="lg" />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-background pb-mobile-nav" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />

      <main className="container mx-auto px-3 md:px-4 py-6 pt-20 md:pt-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 md:h-10 md:w-10" onClick={() => navigate('/assistant')}>
            <ArrowLeft className={cn("h-4 w-4 md:h-5 md:w-5", isRTL && 'rotate-180')} />
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-bold truncate">
              {isArabic ? 'التقارير والإحصائيات' : 'Reports & Statistics'}
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground truncate">
              {isArabic ? 'مركز القرار - حالة المنصة الفعلية' : 'Decision Center - Actual Platform State'}
            </p>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION A: Status Context Header (Top - No Numbers)
        ═══════════════════════════════════════════════════════════════════ */}
        <ReportsStatusHeader
          statusCode={systemStatus.statusCode}
          isRTL={isRTL}
          isFiltered={isFiltered}
          onClearFilter={handleClearFilter}
        />

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION B: Evidence Blocks (Why this status?)
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="mb-4 md:mb-6">
          <StatusEvidenceBlocks
            metrics={systemStatus.metrics}
            statusCode={systemStatus.statusCode}
            isRTL={isRTL}
          />
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION C: Actionable Breakdown (What needs fixing?)
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="mb-4 md:mb-6">
          <ActionableBreakdown
            statusCode={systemStatus.statusCode}
            metrics={systemStatus.metrics}
            isRTL={isRTL}
          />
        </div>

        {/* SmartInsights REMOVED - ActionableBreakdown is the single source for insights */}

        {/* ═══════════════════════════════════════════════════════════════════
            DRILL-DOWN SECTIONS (Secondary - Below Analytics)
        ═══════════════════════════════════════════════════════════════════ */}
        
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

        {/* Course Stats */}
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

        {/* Top Students */}
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
