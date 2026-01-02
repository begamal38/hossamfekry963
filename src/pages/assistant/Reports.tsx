import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, BookOpen, Award, TrendingUp, Building, Globe, Layers, BarChart3, Lightbulb } from 'lucide-react';
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
  totalCenterAttendance: number;
  totalOnlineAttendance: number;
  totalExams: number;
  totalExamResults: number;
  avgOverallProgress: number;
  avgOverallExamScore: number;
  studentsByMode: {
    online: number;
    center: number;
    hybrid: number;
  };
}

interface TopStudent {
  user_id: string;
  full_name: string | null;
  avgScore: number;
  totalExams: number;
  attendance_mode: string;
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
        { data: enrollments },
        { data: lessons },
        { data: attendance },
        { data: exams },
        { data: examResults },
        { data: chaptersData },
        { data: lessonCompletionsData },
        { data: examAttemptsData }
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
        supabase.from('exam_attempts').select('*')
      ]);

      setChapters(chaptersData || []);
      setLessonCompletions(lessonCompletionsData || []);
      setExamAttempts(examAttemptsData || []);

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

      setOverallStats({
        totalStudents: profiles.length,
        totalEnrollments: (enrollments || []).length,
        activeEnrollments,
        pendingEnrollments,
        totalLessons: (lessons || []).length,
        totalCenterAttendance: centerAttendance,
        totalOnlineAttendance: onlineAttendance,
        totalExams: (exams || []).length,
        totalExamResults: (examResults || []).length,
        avgOverallProgress: avgProgress,
        avgOverallExamScore: avgExamScore,
        studentsByMode: {
          online: onlineStudents,
          center: centerStudents,
          hybrid: hybridStudents,
        },
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

  // Compute chapter analytics
  const chapterAnalyticsData = useMemo(() => {
    return chapters.map(ch => {
      const courseTitle = (ch.course as any)?.title || '';
      const courseTitleAr = (ch.course as any)?.title_ar || '';
      
      return {
        id: ch.id,
        title: ch.title,
        titleAr: ch.title_ar,
        courseName: courseTitle,
        courseNameAr: courseTitleAr,
        totalLessons: 0, // Would need join
        avgCompletion: Math.floor(Math.random() * 100), // Placeholder
        totalStudents: overallStats?.totalStudents || 0,
        examPassRate: null as number | null,
      };
    });
  }, [chapters, overallStats]);

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

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'center': return <Building className="h-3 w-3" />;
      case 'hybrid': return <Layers className="h-3 w-3" />;
      default: return <Globe className="h-3 w-3" />;
    }
  };

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
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

        {/* Attendance Mode Distribution */}
        <div className="bg-card border rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {isArabic ? 'توزيع الطلاب حسب نوع الحضور' : 'Students by Attendance Mode'}
          </h2>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-5 w-5 text-purple-600" />
                <span className="font-medium">{isArabic ? 'أونلاين' : 'Online'}</span>
              </div>
              <p className="text-3xl font-bold text-purple-600">{overallStats?.studentsByMode.online || 0}</p>
              <p className="text-sm text-muted-foreground">
                {isArabic ? 'سجلات حضور أونلاين' : 'Online attendance records'}: {overallStats?.totalOnlineAttendance || 0}
              </p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Building className="h-5 w-5 text-blue-600" />
                <span className="font-medium">{isArabic ? 'سنتر' : 'Center'}</span>
              </div>
              <p className="text-3xl font-bold text-blue-600">{overallStats?.studentsByMode.center || 0}</p>
              <p className="text-sm text-muted-foreground">
                {isArabic ? 'سجلات حضور سنتر' : 'Center attendance records'}: {overallStats?.totalCenterAttendance || 0}
              </p>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="h-5 w-5 text-amber-600" />
                <span className="font-medium">{isArabic ? 'هجين' : 'Hybrid'}</span>
              </div>
              <p className="text-3xl font-bold text-amber-600">{overallStats?.studentsByMode.hybrid || 0}</p>
              <p className="text-sm text-muted-foreground">
                {isArabic ? 'يحضرون سنتر وأونلاين' : 'Attend both center & online'}
              </p>
            </div>
          </div>
        </div>

        {/* Attendance Breakdown by Lesson */}
        <div className="bg-card border rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            {isArabic ? 'تفاصيل الحضور حسب الدرس' : 'Attendance Breakdown by Lesson'}
          </h2>

          {attendanceBreakdown.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              {isArabic ? 'لا توجد بيانات حضور بعد' : 'No attendance data yet'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-start py-3 px-2 text-sm font-medium text-muted-foreground">
                      {isArabic ? 'الدرس' : 'Lesson'}
                    </th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-blue-600">
                      <div className="flex items-center justify-center gap-1">
                        <Building className="h-3 w-3" />
                        {isArabic ? 'سنتر' : 'Center'}
                      </div>
                    </th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-purple-600">
                      <div className="flex items-center justify-center gap-1">
                        <Globe className="h-3 w-3" />
                        {isArabic ? 'أونلاين' : 'Online'}
                      </div>
                    </th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-green-600">
                      <div className="flex items-center justify-center gap-1">
                        <Layers className="h-3 w-3" />
                        {isArabic ? 'كلاهما' : 'Both'}
                      </div>
                    </th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-red-600">
                      {isArabic ? 'غائب' : 'Absent'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {attendanceBreakdown.map(lesson => (
                    <tr key={lesson.lessonId} className="hover:bg-muted/30">
                      <td className="py-3 px-2 font-medium">
                        {isArabic ? lesson.lessonTitleAr : lesson.lessonTitle}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                          {lesson.centerCount}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30">
                          {lesson.onlineCount}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                          {lesson.bothCount}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
                          {lesson.absentCount}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{student.full_name || (isArabic ? 'بدون اسم' : 'No name')}</p>
                        <Badge variant="outline" className="text-xs gap-1">
                          {getModeIcon(student.attendance_mode)}
                        </Badge>
                      </div>
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
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
