import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Play, 
  CheckCircle2, 
  BookOpen, 
  Clock,
  Users,
  Lock,
  Unlock
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Course {
  id: string;
  title: string;
  title_ar: string;
  description: string | null;
  description_ar: string | null;
  grade: string;
  is_free: boolean;
  price: number;
  lessons_count: number;
  duration_hours: number;
}

interface Lesson {
  id: string;
  title: string;
  title_ar: string;
  order_index: number;
  duration_minutes: number;
  lesson_type: string;
}

interface Attendance {
  lesson_id: string;
}

const GRADE_OPTIONS: Record<string, { ar: string; en: string }> = {
  'second_arabic': { ar: 'ثانية ثانوي عربي', en: '2nd Year - Arabic' },
  'second_languages': { ar: 'ثانية ثانوي لغات', en: '2nd Year - Languages' },
  'third_arabic': { ar: 'ثالثة ثانوي عربي', en: '3rd Year - Arabic' },
  'third_languages': { ar: 'ثالثة ثانوي لغات', en: '3rd Year - Languages' },
};

export default function CourseView() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { t, language, isRTL } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const isArabic = language === 'ar';

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId, user]);

  const fetchCourseData = async () => {
    try {
      // Fetch course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Fetch lessons
      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index');

      setLessons(lessonsData || []);

      // Check enrollment and attendance
      if (user) {
        const { data: enrollment } = await supabase
          .from('course_enrollments')
          .select('id, status')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .maybeSingle();

        setIsEnrolled(!!enrollment);
        setEnrollmentStatus(enrollment?.status || '');

        // Fetch attendance
        const lessonIds = (lessonsData || []).map(l => l.id);
        if (lessonIds.length > 0) {
          const { data: attendanceData } = await supabase
            .from('lesson_attendance')
            .select('lesson_id')
            .eq('user_id', user.id)
            .in('lesson_id', lessonIds);

          setAttendances(attendanceData || []);
        }
      }
    } catch (error) {
      console.error('Error fetching course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!course?.is_free && course?.price > 0) {
      navigate(`/payment/${courseId}`);
      return;
    }

    setEnrolling(true);
    try {
      const { error } = await supabase
        .from('course_enrollments')
        .insert({
          user_id: user.id,
          course_id: courseId,
          status: 'active'
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: isArabic ? 'مشترك بالفعل' : 'Already enrolled',
            description: isArabic ? 'أنت مشترك في هذا الكورس بالفعل' : 'You are already enrolled in this course',
          });
        } else {
          throw error;
        }
      } else {
        setIsEnrolled(true);
        setEnrollmentStatus('active');
        toast({
          title: isArabic ? 'تم الاشتراك!' : 'Enrolled!',
          description: isArabic ? 'تم الاشتراك في الكورس بنجاح' : 'Successfully enrolled in the course',
        });
      }
    } catch (error) {
      console.error('Error enrolling:', error);
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'فشل في الاشتراك' : 'Failed to enroll',
      });
    } finally {
      setEnrolling(false);
    }
  };

  const isLessonCompleted = (lessonId: string) => {
    return attendances.some(a => a.lesson_id === lessonId);
  };

  const completedLessons = lessons.filter(l => isLessonCompleted(l.id)).length;
  const progressPercent = lessons.length > 0 ? (completedLessons / lessons.length) * 100 : 0;

  const canAccessLesson = (index: number) => {
    if (course?.is_free) return true;
    if (!isEnrolled) return false;
    if (enrollmentStatus !== 'active') return false;
    return true;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 pt-24 text-center">
          <h1 className="text-2xl font-bold mb-4">{isArabic ? 'الكورس غير موجود' : 'Course not found'}</h1>
          <Button onClick={() => navigate('/courses')}>
            {isArabic ? 'العودة للكورسات' : 'Back to Courses'}
          </Button>
        </main>
      </div>
    );
  }

  const gradeInfo = GRADE_OPTIONS[course.grade];

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />

      <main className="pt-20 pb-16">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 border-b">
          <div className="container mx-auto px-4 py-8">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/courses')}
              className="mb-4 gap-2"
            >
              <ArrowLeft className={cn("w-4 h-4", isRTL && "rotate-180")} />
              {isArabic ? 'الكورسات' : 'Courses'}
            </Button>

            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline">{isArabic ? gradeInfo?.ar : gradeInfo?.en}</Badge>
                  {course.is_free && (
                    <Badge className="bg-green-600">{isArabic ? 'مجاني' : 'Free'}</Badge>
                  )}
                </div>

                <h1 className="text-3xl md:text-4xl font-bold mb-4">
                  {isArabic ? course.title_ar : course.title}
                </h1>
                <p className="text-lg text-muted-foreground mb-6">
                  {isArabic ? course.description_ar : course.description}
                </p>

                <div className="flex flex-wrap gap-6 text-sm text-muted-foreground mb-6">
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    {lessons.length} {isArabic ? 'حصة' : 'lessons'}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    {course.duration_hours} {isArabic ? 'ساعة' : 'hours'}
                  </span>
                  <span className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {isArabic ? 'ثانوية عامة' : 'Thanaweya Amma'}
                  </span>
                </div>

                {!isEnrolled ? (
                  <Button 
                    size="lg" 
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="gap-2"
                  >
                    {enrolling ? (
                      isArabic ? 'جاري الاشتراك...' : 'Enrolling...'
                    ) : course.is_free ? (
                      <>{isArabic ? 'اشترك مجاناً' : 'Enroll Free'}</>
                    ) : (
                      <>
                        {isArabic ? 'اشترك الآن' : 'Enroll Now'} - {course.price} {isArabic ? 'ج.م' : 'EGP'}
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {isArabic ? 'مشترك' : 'Enrolled'}
                      </Badge>
                      {enrollmentStatus === 'pending' && (
                        <Badge variant="secondary">
                          {isArabic ? 'في انتظار التفعيل' : 'Pending Activation'}
                        </Badge>
                      )}
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{isArabic ? 'تقدمك' : 'Your Progress'}</span>
                        <span>{completedLessons}/{lessons.length} {isArabic ? 'حصة' : 'lessons'}</span>
                      </div>
                      <Progress value={progressPercent} className="h-2" />
                    </div>
                  </div>
                )}
              </div>

              {/* Course Image */}
              <div className="lg:w-80 shrink-0">
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center">
                  <BookOpen className="w-20 h-20 text-primary/50" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lessons List */}
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-6">
            {isArabic ? 'محتوى الكورس' : 'Course Content'}
          </h2>

          <div className="space-y-3">
            {lessons.map((lesson, index) => {
              const completed = isLessonCompleted(lesson.id);
              const canAccess = canAccessLesson(index);

              return (
                <div
                  key={lesson.id}
                  className={cn(
                    "flex items-center gap-4 p-4 bg-card border rounded-xl transition-all",
                    canAccess ? "hover:border-primary/50 cursor-pointer" : "opacity-60"
                  )}
                  onClick={() => canAccess && navigate(`/lesson/${lesson.id}`)}
                >
                  {/* Lesson Number */}
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                    completed 
                      ? "bg-green-500 text-white" 
                      : canAccess
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {completed ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                  </div>

                  {/* Lesson Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">
                      {isArabic ? lesson.title_ar : lesson.title}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {lesson.duration_minutes} {isArabic ? 'دقيقة' : 'min'}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {lesson.lesson_type === 'center' 
                          ? (isArabic ? 'سنتر' : 'Center')
                          : (isArabic ? 'أونلاين' : 'Online')
                        }
                      </Badge>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="shrink-0">
                    {canAccess ? (
                      <Button size="sm" variant={completed ? "secondary" : "default"}>
                        {completed ? (
                          <>{isArabic ? 'مراجعة' : 'Review'}</>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-1" />
                            {isArabic ? 'ابدأ' : 'Start'}
                          </>
                        )}
                      </Button>
                    ) : (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {lessons.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {isArabic ? 'لسه مفيش حصص' : 'No lessons yet'}
              </h3>
              <p className="text-muted-foreground">
                {isArabic ? 'الحصص هتتضاف قريب' : 'Lessons will be added soon'}
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
