import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, Phone, Mail, GraduationCap, Calendar, BookOpen, 
  Award, Clock, Settings, Video
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

interface Profile {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  grade: string | null;
  academic_year: string | null;
  language_track: string | null;
  is_suspended: boolean;
  created_at: string;
}

interface Enrollment {
  id: string;
  course_id: string;
  status: string;
  progress: number | null;
  completed_lessons: number | null;
  course: {
    title: string;
    title_ar: string;
    lessons_count: number | null;
  };
}

interface ExamResult {
  id: string;
  score: number;
  exam: {
    title: string;
    title_ar: string;
    max_score: number;
    course: {
      title: string;
      title_ar: string;
    };
  };
}

// Removed attendance mode config - unified platform model

const ACADEMIC_YEAR_LABELS: Record<string, { ar: string; en: string }> = {
  'second_secondary': { ar: 'تانية ثانوي', en: '2nd Secondary' },
  'third_secondary': { ar: 'تالته ثانوي', en: '3rd Secondary' },
};

const LANGUAGE_TRACK_LABELS: Record<string, { ar: string; en: string }> = {
  'arabic': { ar: 'عربي', en: 'Arabic' },
  'languages': { ar: 'لغات', en: 'Languages' },
};

export default function StudentProfile() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { canAccessDashboard, loading: roleLoading } = useUserRole();
  const isArabic = language === 'ar';

  const [profile, setProfile] = useState<Profile | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    
    // Redirect staff to assistant dashboard
    if (!roleLoading && canAccessDashboard()) {
      navigate('/assistant');
      return;
    }

    if (user) {
      fetchProfileData();
    }
  }, [user, authLoading, roleLoading]);

  const fetchProfileData = async () => {
    if (!user) return;

    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch enrollments
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select(`
          id,
          course_id,
          status,
          progress,
          completed_lessons,
          courses:course_id (
            title,
            title_ar,
            lessons_count
          )
        `)
        .eq('user_id', user.id);

      if (enrollmentError) throw enrollmentError;
      const formattedEnrollments = (enrollmentData || []).map(e => ({
        ...e,
        course: e.courses as any
      }));
      setEnrollments(formattedEnrollments);

      // Fetch exam results from exam_attempts (auto-corrected results)
      const { data: examData, error: examError } = await supabase
        .from('exam_attempts')
        .select(`
          id,
          score,
          total_questions,
          completed_at,
          exams:exam_id (
            title,
            title_ar,
            max_score,
            courses:course_id (
              title,
              title_ar
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('is_completed', true)
        .order('completed_at', { ascending: false });

      if (examError) throw examError;
      const formattedExams = (examData || []).map(e => {
        const maxScore = (e.exams as any)?.max_score || 100;
        const percentageScore = Math.round((e.score / e.total_questions) * maxScore);
        return {
          id: e.id,
          score: percentageScore,
          exam: {
            ...(e.exams as any),
            max_score: maxScore,
            course: (e.exams as any)?.courses
          }
        };
      });
      setExamResults(formattedExams);

      // Fetch attendance count
      const { count, error: attendanceError } = await supabase
        .from('lesson_attendance')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (attendanceError) throw attendanceError;
      setAttendanceCount(count || 0);

    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGradeLabel = (grade: string | null) => {
    if (!grade) return isArabic ? 'غير محدد' : 'Not specified';
    // Use unified grade labels
    const grades: Record<string, { ar: string; en: string }> = {
      'second_secondary': { ar: 'تانية ثانوي', en: '2nd Secondary' },
      'third_secondary': { ar: 'تالته ثانوي', en: '3rd Secondary' },
      'second_arabic': { ar: 'تانية ثانوي - عربي', en: '2nd Secondary - Arabic' },
      'second_languages': { ar: 'تانية ثانوي - لغات', en: '2nd Secondary - Languages' },
      'third_arabic': { ar: 'تالته ثانوي - عربي', en: '3rd Secondary - Arabic' },
      'third_languages': { ar: 'تالته ثانوي - لغات', en: '3rd Secondary - Languages' },
    };
    return grades[grade]?.[isArabic ? 'ar' : 'en'] || grade;
  };

  const getGroupLabel = () => {
    if (!profile?.academic_year || !profile?.language_track) return null;
    const year = ACADEMIC_YEAR_LABELS[profile.academic_year];
    const track = LANGUAGE_TRACK_LABELS[profile.language_track];
    if (!year || !track) return null;
    return isArabic ? `${year.ar} - ${track.ar}` : `${year.en} - ${track.en}`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'active': { label: isArabic ? 'نشط' : 'Active', variant: 'default' },
      'pending': { label: isArabic ? 'معلق' : 'Pending', variant: 'secondary' },
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

  if (authLoading || loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-3.5 h-3.5 rounded-full bg-primary animate-pulse-dot"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 text-center">
          <p className="text-muted-foreground">{isArabic ? 'لم يتم العثور على الملف الشخصي' : 'Profile not found'}</p>
        </div>
        <Footer />
      </div>
    );
  }

  const groupLabel = getGroupLabel();
  const totalLessons = enrollments.reduce((sum, e) => sum + (e.course?.lessons_count || 0), 0);
  const completedLessons = enrollments.reduce((sum, e) => sum + (e.completed_lessons || 0), 0);

  return (
    <div className="min-h-screen bg-muted/30 pb-mobile-nav" dir={isArabic ? 'rtl' : 'ltr'}>
      <Navbar />
      
      <main className="pt-24 pb-16 content-appear">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">{isArabic ? 'ملفي الشخصي' : 'My Profile'}</h1>
            <Button variant="outline" size="sm" asChild className="gap-2">
              <Link to="/settings">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">{isArabic ? 'الإعدادات' : 'Settings'}</span>
              </Link>
            </Button>
          </div>

          {/* Profile Card */}
          <div className="bg-card rounded-xl border p-6 mb-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="h-10 w-10 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="text-2xl font-bold">{profile.full_name || user?.email?.split('@')[0]}</h2>
                    {groupLabel && (
                      <Badge variant="secondary" className="mt-2">{groupLabel}</Badge>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="truncate">{user?.email}</span>
                  </div>
                  {profile.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4 shrink-0" />
                      <span dir="ltr">{profile.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <GraduationCap className="h-4 w-4 shrink-0" />
                    <span>{getGradeLabel(profile.grade)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span>{isArabic ? 'تاريخ التسجيل:' : 'Registered:'} {new Date(profile.created_at).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card rounded-xl border p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-green-500" />
                </div>
              </div>
              <p className="text-2xl font-bold">{completedLessons}</p>
              <p className="text-sm text-muted-foreground">{isArabic ? 'دروس مكتملة' : 'Completed'}</p>
            </div>

            <div className="bg-card rounded-xl border p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
              </div>
              <p className="text-2xl font-bold">{totalLessons - completedLessons}</p>
              <p className="text-sm text-muted-foreground">{isArabic ? 'متبقية' : 'Remaining'}</p>
            </div>

            <div className="bg-card rounded-xl border p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Award className="h-5 w-5 text-purple-500" />
                </div>
              </div>
              <p className="text-2xl font-bold">{examResults.length}</p>
              <p className="text-sm text-muted-foreground">{isArabic ? 'امتحانات' : 'Exams'}</p>
            </div>

            <div className="bg-card rounded-xl border p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Video className="h-5 w-5 text-amber-500" />
                </div>
              </div>
              <p className="text-2xl font-bold">{attendanceCount}</p>
              <p className="text-sm text-muted-foreground">{isArabic ? 'حضور' : 'Attendance'}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Enrolled Courses */}
            <div className="bg-card rounded-xl border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {isArabic ? 'كورساتي' : 'My Courses'}
              </h3>
              
              {enrollments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">{isArabic ? 'لم تشترك في أي كورس بعد' : 'No courses enrolled yet'}</p>
                  <Button asChild>
                    <Link to="/courses">{isArabic ? 'تصفح الكورسات' : 'Browse Courses'}</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {enrollments.map(enrollment => (
                    <div key={enrollment.id} className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium">{isArabic ? enrollment.course?.title_ar : enrollment.course?.title}</p>
                        {getStatusBadge(enrollment.status)}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>
                          {enrollment.completed_lessons || 0} / {enrollment.course?.lessons_count || 0} {isArabic ? 'درس' : 'lessons'}
                        </span>
                      </div>
                      <Progress value={enrollment.progress || 0} className="mt-2 h-2" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Exam Results */}
            <div className="bg-card rounded-xl border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                {isArabic ? 'نتائجي' : 'My Results'}
              </h3>
              
              {examResults.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">{isArabic ? 'لا توجد نتائج بعد' : 'No results yet'}</p>
              ) : (
                <div className="space-y-3">
                  {examResults.slice(0, 5).map(result => (
                    <div key={result.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{isArabic ? result.exam?.title_ar : result.exam?.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {isArabic ? result.exam?.course?.title_ar : result.exam?.course?.title}
                        </p>
                      </div>
                      <div className="text-end shrink-0">
                        <p className={`text-lg font-bold ${getScoreColor(result.score, result.exam?.max_score || 100)}`}>
                          {result.score}/{result.exam?.max_score || 100}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
