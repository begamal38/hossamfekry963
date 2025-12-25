import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowRight, User, Phone, GraduationCap, Calendar, BookOpen, Video, Building, Award, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserRole } from '@/hooks/useUserRole';

interface StudentProfile {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  grade: string | null;
  created_at: string;
}

interface Enrollment {
  id: string;
  course_id: string;
  status: string;
  progress: number | null;
  completed_lessons: number | null;
  enrolled_at: string;
  course: {
    title: string;
    title_ar: string;
    lessons_count: number | null;
  };
}

interface AttendanceStats {
  online_count: number;
  center_count: number;
  total_count: number;
}

interface ExamResult {
  id: string;
  score: number;
  notes: string | null;
  created_at: string;
  exam: {
    title: string;
    title_ar: string;
    max_score: number;
    exam_date: string | null;
    course: {
      title: string;
      title_ar: string;
    };
  };
}

export default function StudentDetails() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { canAccessDashboard, loading: roleLoading } = useUserRole();
  const isArabic = language === 'ar';

  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({ online_count: 0, center_count: 0, total_count: 0 });
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roleLoading && !canAccessDashboard()) {
      navigate('/');
      return;
    }

    if (userId) {
      fetchStudentData();
    }
  }, [userId, roleLoading]);

  const fetchStudentData = async () => {
    if (!userId) return;

    try {
      // Fetch student profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) throw profileError;
      setStudent(profileData);

      // Fetch enrollments with course info
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select(`
          id,
          course_id,
          status,
          progress,
          completed_lessons,
          enrolled_at,
          courses:course_id (
            title,
            title_ar,
            lessons_count
          )
        `)
        .eq('user_id', userId);

      if (enrollmentError) throw enrollmentError;
      
      const formattedEnrollments = (enrollmentData || []).map(e => ({
        ...e,
        course: e.courses as any
      }));
      setEnrollments(formattedEnrollments);

      // Fetch attendance stats
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('lesson_attendance')
        .select(`
          id,
          lessons:lesson_id (
            lesson_type
          )
        `)
        .eq('user_id', userId);

      if (attendanceError) throw attendanceError;

      const stats = (attendanceData || []).reduce((acc, att) => {
        const lessonType = (att.lessons as any)?.lesson_type;
        if (lessonType === 'online') acc.online_count++;
        else if (lessonType === 'center') acc.center_count++;
        acc.total_count++;
        return acc;
      }, { online_count: 0, center_count: 0, total_count: 0 });

      setAttendanceStats(stats);

      // Fetch exam results
      const { data: examData, error: examError } = await supabase
        .from('exam_results')
        .select(`
          id,
          score,
          notes,
          created_at,
          exams:exam_id (
            title,
            title_ar,
            max_score,
            exam_date,
            courses:course_id (
              title,
              title_ar
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (examError) throw examError;

      const formattedExams = (examData || []).map(e => ({
        ...e,
        exam: {
          ...(e.exams as any),
          course: (e.exams as any)?.courses
        }
      }));
      setExamResults(formattedExams);

    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGradeLabel = (grade: string | null) => {
    if (!grade) return isArabic ? 'غير محدد' : 'Not specified';
    const grades: Record<string, { ar: string; en: string }> = {
      'first': { ar: 'الصف الأول الثانوي', en: '1st Secondary' },
      'second': { ar: 'الصف الثاني الثانوي', en: '2nd Secondary' },
      'third_arabic': { ar: 'الصف الثالث الثانوي (عربي)', en: '3rd Secondary (Arabic)' },
      'third_english': { ar: 'الصف الثالث الثانوي (لغات)', en: '3rd Secondary (Languages)' },
    };
    return grades[grade]?.[isArabic ? 'ar' : 'en'] || grade;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'active': { label: isArabic ? 'نشط' : 'Active', variant: 'default' },
      'pending': { label: isArabic ? 'معلق' : 'Pending', variant: 'secondary' },
      'expired': { label: isArabic ? 'منتهي' : 'Expired', variant: 'destructive' },
      'cancelled': { label: isArabic ? 'ملغي' : 'Cancelled', variant: 'outline' },
    };
    const config = statusConfig[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-background pt-20 px-4">
        <div className="container mx-auto max-w-4xl text-center py-12">
          <p className="text-muted-foreground">{isArabic ? 'الطالب غير موجود' : 'Student not found'}</p>
          <Button variant="outline" onClick={() => navigate('/assistant/students')} className="mt-4">
            {isArabic ? 'العودة للقائمة' : 'Back to List'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 px-4 pb-12" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/assistant/students')}>
            <ArrowRight className={`h-5 w-5 ${isArabic ? '' : 'rotate-180'}`} />
          </Button>
          <h1 className="text-2xl font-bold">{isArabic ? 'تفاصيل الطالب' : 'Student Details'}</h1>
        </div>

        {/* Student Info Card */}
        <div className="bg-card rounded-xl border p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{student.full_name || (isArabic ? 'بدون اسم' : 'No Name')}</h2>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span dir="ltr">{student.phone || (isArabic ? 'لا يوجد' : 'N/A')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  <span>{getGradeLabel(student.grade)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(student.created_at).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-card rounded-xl border p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Video className="h-5 w-5 text-blue-500" />
              </div>
              <span className="text-sm text-muted-foreground">{isArabic ? 'حضور أونلاين' : 'Online Attendance'}</span>
            </div>
            <p className="text-2xl font-bold">{attendanceStats.online_count}</p>
          </div>

          <div className="bg-card rounded-xl border p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Building className="h-5 w-5 text-green-500" />
              </div>
              <span className="text-sm text-muted-foreground">{isArabic ? 'حضور السنتر' : 'Center Attendance'}</span>
            </div>
            <p className="text-2xl font-bold">{attendanceStats.center_count}</p>
          </div>

          <div className="bg-card rounded-xl border p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-purple-500" />
              </div>
              <span className="text-sm text-muted-foreground">{isArabic ? 'إجمالي الحضور' : 'Total Attendance'}</span>
            </div>
            <p className="text-2xl font-bold">{attendanceStats.total_count}</p>
          </div>
        </div>

        {/* Enrollments */}
        <div className="bg-card rounded-xl border p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            {isArabic ? 'الكورسات المشترك فيها' : 'Enrolled Courses'}
          </h3>
          
          {enrollments.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">{isArabic ? 'لا توجد اشتراكات' : 'No enrollments'}</p>
          ) : (
            <div className="space-y-4">
              {enrollments.map(enrollment => (
                <div key={enrollment.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{isArabic ? enrollment.course?.title_ar : enrollment.course?.title}</p>
                    <div className="flex items-center gap-4 mt-2">
                      {getStatusBadge(enrollment.status)}
                      <span className="text-sm text-muted-foreground">
                        {enrollment.completed_lessons || 0} / {enrollment.course?.lessons_count || 0} {isArabic ? 'درس' : 'lessons'}
                      </span>
                    </div>
                    <Progress value={enrollment.progress || 0} className="mt-2 h-2" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Exam Results */}
        <div className="bg-card rounded-xl border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            {isArabic ? 'نتائج الامتحانات' : 'Exam Results'}
          </h3>
          
          {examResults.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">{isArabic ? 'لا توجد نتائج امتحانات' : 'No exam results'}</p>
          ) : (
            <div className="space-y-3">
              {examResults.map(result => (
                <div key={result.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium">{isArabic ? result.exam?.title_ar : result.exam?.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {isArabic ? result.exam?.course?.title_ar : result.exam?.course?.title}
                    </p>
                    {result.exam?.exam_date && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(result.exam.exam_date).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}
                      </p>
                    )}
                  </div>
                  <div className="text-end">
                    <p className={`text-xl font-bold ${getScoreColor(result.score, result.exam?.max_score || 100)}`}>
                      {result.score} / {result.exam?.max_score || 100}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {Math.round((result.score / (result.exam?.max_score || 100)) * 100)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}