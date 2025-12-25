import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, BookOpen, Award, TrendingUp, Download, FileText, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/Navbar';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserRole } from '@/hooks/useUserRole';

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
  totalAttendance: number;
  totalExams: number;
  totalExamResults: number;
  avgOverallProgress: number;
  avgOverallExamScore: number;
}

interface TopStudent {
  user_id: string;
  full_name: string | null;
  avgScore: number;
  totalExams: number;
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

  useEffect(() => {
    if (!roleLoading && !canAccessDashboard()) {
      navigate('/');
      return;
    }
    fetchReportData();
  }, [roleLoading]);

  const fetchReportData = async () => {
    try {
      // Fetch all base data
      const [
        { data: profiles },
        { data: courses },
        { data: enrollments },
        { data: lessons },
        { data: attendance },
        { data: exams },
        { data: examResults }
      ] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('courses').select('*'),
        supabase.from('course_enrollments').select('*'),
        supabase.from('lessons').select('*'),
        supabase.from('lesson_attendance').select('*'),
        supabase.from('exams').select('*'),
        supabase.from('exam_results').select('*, exams:exam_id(max_score)')
      ]);

      // Calculate overall stats
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
        totalStudents: (profiles || []).length,
        totalEnrollments: (enrollments || []).length,
        activeEnrollments,
        pendingEnrollments,
        totalLessons: (lessons || []).length,
        totalAttendance: (attendance || []).length,
        totalExams: (exams || []).length,
        totalExamResults: (examResults || []).length,
        avgOverallProgress: avgProgress,
        avgOverallExamScore: avgExamScore,
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

      // Calculate top students by exam score
      const studentScores = new Map<string, { scores: number[], name: string | null }>();
      
      (examResults || []).forEach(result => {
        const maxScore = (result.exams as any)?.max_score || 100;
        const percentage = (result.score / maxScore) * 100;
        
        if (!studentScores.has(result.user_id)) {
          const profile = (profiles || []).find(p => p.user_id === result.user_id);
          studentScores.set(result.user_id, { scores: [], name: profile?.full_name || null });
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
                {isArabic ? 'نظرة شاملة على أداء الطلاب' : 'Overview of student performance'}
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
              <span className="text-xs">{isArabic ? 'الحضور' : 'Attendance'}</span>
            </div>
            <p className="text-2xl font-bold">{overallStats?.totalAttendance || 0}</p>
          </div>
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
                      {isArabic ? 'الدروس' : 'Lessons'}
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
                    <div className={`h-2 w-16 rounded-full bg-muted overflow-hidden`}>
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
