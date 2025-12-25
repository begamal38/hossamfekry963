import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Clock, 
  Award,
  FileText,
  ChevronRight,
  Settings,
  Play,
  CheckCircle2,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/dashboard/StatCard';
import { CourseProgressCard } from '@/components/dashboard/CourseProgressCard';
import { LessonActivityList, LessonActivity } from '@/components/dashboard/LessonActivityList';
import { ExamActivityList, ExamActivity } from '@/components/dashboard/ExamActivityList';
import { OverallProgressCard } from '@/components/dashboard/OverallProgressCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const GRADE_OPTIONS: Record<string, { ar: string; en: string }> = {
  'first': { ar: 'الصف الأول الثانوي', en: '1st Year Secondary' },
  'second_arabic': { ar: 'ثانية ثانوي عربي', en: '2nd Year - Arabic' },
  'second_languages': { ar: 'ثانية ثانوي لغات', en: '2nd Year - Languages' },
  'third_arabic': { ar: 'ثالثة ثانوي عربي', en: '3rd Year - Arabic' },
  'third_languages': { ar: 'ثالثة ثانوي لغات', en: '3rd Year - Languages' },
};

interface Profile {
  full_name: string | null;
  phone: string | null;
  grade: string | null;
  avatar_url: string | null;
}

interface EnrolledCourse {
  id: string;
  course_id: string;
  progress: number;
  completed_lessons: number;
  course: {
    id: string;
    title: string;
    title_ar: string;
    lessons_count: number;
    duration_hours: number;
  };
}

interface ExamResult {
  id: string;
  score: number;
  exam: {
    id: string;
    title: string;
    title_ar: string;
    max_score: number;
    course: {
      title: string;
      title_ar: string;
    };
  };
}

const Dashboard: React.FC = () => {
  const { t, language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { canAccessDashboard, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const isArabic = language === 'ar';

  const [profile, setProfile] = useState<Profile | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [allExams, setAllExams] = useState<ExamActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Redirect assistant teachers and admins to their dashboard
  useEffect(() => {
    if (!roleLoading && canAccessDashboard()) {
      navigate('/assistant');
    }
  }, [roleLoading, canAccessDashboard, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, phone, grade, avatar_url')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (profileError) throw profileError;
        setProfile(profileData);

        // Fetch enrolled courses with course details
        const { data: enrollmentsData, error: enrollmentsError } = await supabase
          .from('course_enrollments')
          .select(`
            id,
            course_id,
            progress,
            completed_lessons,
            course:courses (
              id,
              title,
              title_ar,
              lessons_count,
              duration_hours
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'active');

        if (enrollmentsError) throw enrollmentsError;
        setEnrolledCourses((enrollmentsData || []) as unknown as EnrolledCourse[]);

        // Fetch exam results for this user
        const { data: examResultsData, error: examResultsError } = await supabase
          .from('exam_results')
          .select(`
            id,
            score,
            exam:exams (
              id,
              title,
              title_ar,
              max_score,
              course:courses (
                title,
                title_ar
              )
            )
          `)
          .eq('user_id', user.id);

        if (examResultsError) throw examResultsError;
        setExamResults((examResultsData || []) as unknown as ExamResult[]);

        // Fetch all available exams for courses the user is enrolled in
        const courseIds = (enrollmentsData || []).map(e => e.course_id);
        if (courseIds.length > 0) {
          const { data: allExamsData, error: allExamsError } = await supabase
            .from('exams')
            .select(`
              id,
              title,
              title_ar,
              max_score,
              course:courses (
                title,
                title_ar
              )
            `)
            .in('course_id', courseIds);

          if (allExamsError) throw allExamsError;

          // Map exams to activity format
          const examActivities: ExamActivity[] = (allExamsData || []).map(exam => {
            const result = (examResultsData || []).find(r => (r.exam as any)?.id === exam.id);
            return {
              id: exam.id,
              title: isArabic ? exam.title_ar : exam.title,
              courseName: isArabic ? (exam.course as any)?.title_ar : (exam.course as any)?.title,
              isAttempted: !!result,
              score: result?.score,
              maxScore: exam.max_score,
              canRetake: false, // Can be configured based on business logic
            };
          });
          setAllExams(examActivities);
        }

      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, isArabic]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const fullName = profile?.full_name || user?.email?.split('@')[0] || '';
  const firstName = fullName.split(' ')[0];
  const gradeInfo = profile?.grade ? GRADE_OPTIONS[profile.grade] : null;

  // Calculate stats
  const totalLessonsCompleted = enrolledCourses.reduce((sum, e) => sum + (e.completed_lessons || 0), 0);
  const totalLessons = enrolledCourses.reduce((sum, e) => sum + (e.course?.lessons_count || 0), 0);
  const lessonsRemaining = totalLessons - totalLessonsCompleted;
  
  const examsTaken = examResults.length;
  const examsPending = allExams.filter(e => !e.isAttempted).length;
  
  const overallProgress = totalLessons > 0 
    ? Math.round((totalLessonsCompleted / totalLessons) * 100) 
    : 0;

  // Mock lesson activity data (would come from real data in production)
  const lessonActivities: LessonActivity[] = enrolledCourses.slice(0, 5).map((enrollment, index) => ({
    id: `lesson-${index}`,
    title: isArabic 
      ? `الدرس ${enrollment.completed_lessons + 1}` 
      : `Lesson ${enrollment.completed_lessons + 1}`,
    courseName: isArabic ? enrollment.course?.title_ar : enrollment.course?.title,
    isCompleted: false,
    isLastAccessed: index === 0,
    timeSpent: index === 0 ? '45 min' : undefined,
  }));

  return (
    <div className="min-h-screen bg-muted/30" dir={isArabic ? 'rtl' : 'ltr'}>
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Welcome Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                  {isArabic ? `أهلاً ${firstName}! 👋` : `Welcome ${firstName}! 👋`}
                </h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-muted-foreground">
                    {isArabic ? 'لوحة تحكم الطالب' : 'Student Dashboard'}
                  </p>
                  {gradeInfo && (
                    <Badge variant="secondary" className="text-sm">
                      {isArabic ? gradeInfo.ar : gradeInfo.en}
                    </Badge>
                  )}
                </div>
              </div>
              <Button variant="outline" asChild className="gap-2">
                <Link to="/settings">
                  <Settings className="w-4 h-4" />
                  {isArabic ? 'الإعدادات' : 'Settings'}
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={CheckCircle2}
              value={totalLessonsCompleted}
              label={isArabic ? 'دروس مكتملة' : 'Lessons Completed'}
              variant="success"
            />
            <StatCard
              icon={BookOpen}
              value={lessonsRemaining}
              label={isArabic ? 'دروس متبقية' : 'Lessons Remaining'}
              variant="primary"
            />
            <StatCard
              icon={Award}
              value={examsTaken}
              label={isArabic ? 'امتحانات تمت' : 'Exams Taken'}
              variant="accent"
            />
            <StatCard
              icon={Clock}
              value={examsPending}
              label={isArabic ? 'امتحانات معلقة' : 'Exams Pending'}
              variant="warning"
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content - 2 columns */}
            <div className="lg:col-span-2 space-y-6">
              {/* Course Progress Section */}
              <section className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    {isArabic ? 'تقدم الكورسات' : 'Course Progress'}
                  </h2>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/courses" className="gap-1">
                      {isArabic ? 'عرض الكل' : 'View All'}
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>

                {enrolledCourses.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {isArabic ? 'لم تشترك في أي كورس بعد' : 'No courses enrolled yet'}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {isArabic ? 'تصفح الكورسات المتاحة وابدأ رحلة التعلم' : 'Browse available courses and start learning'}
                    </p>
                    <Button asChild>
                      <Link to="/courses">
                        {isArabic ? 'تصفح الكورسات' : 'Browse Courses'}
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {enrolledCourses.map((enrollment) => {
                      const course = enrollment.course;
                      if (!course) return null;
                      
                      return (
                        <CourseProgressCard
                          key={enrollment.id}
                          title={isArabic ? course.title_ar : course.title}
                          completedLessons={enrollment.completed_lessons || 0}
                          totalLessons={course.lessons_count || 0}
                          isRTL={isArabic}
                          onContinue={() => navigate(`/courses`)}
                        />
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Lesson Activity Section */}
              <section className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <Play className="w-5 h-5 text-primary" />
                  {isArabic ? 'نشاط الدروس' : 'Lesson Activity'}
                </h2>
                
                <LessonActivityList
                  lessons={lessonActivities}
                  isRTL={isArabic}
                  onLessonClick={(id) => console.log('Continue lesson:', id)}
                />
              </section>

              {/* Exam Activity Section */}
              <section className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  {isArabic ? 'الامتحانات' : 'Exams'}
                </h2>
                
                <ExamActivityList
                  exams={allExams}
                  isRTL={isArabic}
                  onTakeExam={(id) => console.log('Take exam:', id)}
                  onRetakeExam={(id) => console.log('Retake exam:', id)}
                />
              </section>
            </div>

            {/* Sidebar - 1 column */}
            <div className="space-y-6">
              {/* Overall Progress */}
              <OverallProgressCard
                progressPercent={overallProgress}
                isRTL={isArabic}
              />

              {/* Profile Card */}
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-semibold text-foreground mb-4">
                  {isArabic ? 'معلومات الحساب' : 'Account Info'}
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-bold">
                        {firstName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{fullName}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                  </div>

                  {profile?.phone && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">
                        {isArabic ? 'رقم الواتساب' : 'WhatsApp'}
                      </p>
                      <p className="font-medium text-foreground" dir="ltr">{profile.phone}</p>
                    </div>
                  )}

                  {gradeInfo && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">
                        {isArabic ? 'المرحلة الدراسية' : 'Grade'}
                      </p>
                      <p className="font-medium text-foreground">
                        {isArabic ? gradeInfo.ar : gradeInfo.en}
                      </p>
                    </div>
                  )}
                </div>

                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link to="/settings">
                    {isArabic ? 'تعديل الحساب' : 'Edit Profile'}
                    <ChevronRight className={cn("w-4 h-4", isArabic ? "mr-2 rotate-180" : "ml-2")} />
                  </Link>
                </Button>
              </div>

              {/* Quick Actions CTA */}
              <div className="bg-gradient-to-br from-primary to-accent rounded-xl p-6 text-primary-foreground">
                <h3 className="font-bold text-lg mb-2">
                  {isArabic ? 'ابدأ الآن!' : 'Start Now!'}
                </h3>
                <p className="text-primary-foreground/80 text-sm mb-4">
                  {isArabic 
                    ? 'استمر في رحلة التعلم وحقق أهدافك'
                    : 'Continue your learning journey and achieve your goals'
                  }
                </p>
                <Button variant="secondary" className="w-full" asChild>
                  <Link to="/courses">
                    {isArabic ? 'تصفح الكورسات' : 'Browse Courses'}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
