import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Play, 
  CheckCircle2, 
  BookOpen, 
  Clock,
  Users,
  Lock,
  FileVideo,
  Layers,
  Zap,
  Brain,
  Target,
  Shield,
  Star,
  Smartphone,
  MessageCircle,
  TrendingUp,
  Award,
  ChevronDown
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
import { useChapterProgress } from '@/hooks/useChapterProgress';
import { useToast } from '@/hooks/use-toast';
import { useFacebookPixel } from '@/hooks/useFacebookPixel';
import { cn } from '@/lib/utils';
import { canAccessContent, parseAcademicPath } from '@/lib/academicValidation';
import { hasValidVideo, calculateProgress, isCoursePreview } from '@/lib/contentVisibility';
import { SEOHead } from '@/components/seo/SEOHead';
import { ChapterExamSection } from '@/components/course/ChapterExamSection';

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
  thumbnail_url: string | null;
  slug: string;
}

interface Lesson {
  id: string;
  short_id: number;
  title: string;
  title_ar: string;
  order_index: number;
  duration_minutes: number;
  lesson_type: string;
  chapter_id: string | null;
  video_url: string | null;
}

interface Chapter {
  id: string;
  title: string;
  title_ar: string;
  order_index: number;
  description?: string | null;
  description_ar?: string | null;
}

interface Attendance {
  lesson_id: string;
}

const GRADE_OPTIONS: Record<string, { ar: string; en: string }> = {
  'second_arabic': { ar: 'تانية ثانوي عربي', en: '2nd Secondary - Arabic' },
  'second_languages': { ar: 'تانية ثانوي لغات', en: '2nd Secondary - Languages' },
  'third_arabic': { ar: 'تالته ثانوي عربي', en: '3rd Secondary - Arabic' },
  'third_languages': { ar: 'تالته ثانوي لغات', en: '3rd Secondary - Languages' },
};

// Official WhatsApp number
const OFFICIAL_WHATSAPP = '01225565645';

export default function CourseView() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { t, language, isRTL } = useLanguage();
  const { user } = useAuth();
  const { loading: rolesLoading, isAdmin, isAssistantTeacher } = useUserRole();
  const { toast } = useToast();
  const { trackViewContent, trackSubscribe } = useFacebookPixel();
  const isArabic = language === 'ar';
  
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseId || '');
  const canBypassRestrictions = !!user && !rolesLoading && (isAdmin() || isAssistantTeacher());

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [userProfile, setUserProfile] = useState<{ grade: string | null; academic_year: string | null; language_track: string | null } | null>(null);
  const [accessBlocked, setAccessBlocked] = useState<{ blocked: boolean; message: string } | null>(null);
  const [showFullContent, setShowFullContent] = useState(false);
  const [enrollmentCount, setEnrollmentCount] = useState<number>(0);

  const {
    chapterProgress,
    chapterExams,
    examAttempts,
    canAccessChapterExam,
    getChapterProgress,
  } = useChapterProgress(course?.id || '');

  const visibleLessons = useMemo(() => lessons, [lessons]);

  const lessonsByChapter = useMemo(() => {
    const grouped: Record<string, Lesson[]> = { uncategorized: [] };
    chapters.forEach(chapter => { grouped[chapter.id] = []; });
    visibleLessons.forEach(lesson => {
      if (lesson.chapter_id && grouped[lesson.chapter_id]) {
        grouped[lesson.chapter_id].push(lesson);
      } else {
        grouped.uncategorized.push(lesson);
      }
    });
    return grouped;
  }, [visibleLessons, chapters]);

  const progressData = useMemo(() => {
    const completedIds = attendances.map(a => a.lesson_id);
    return calculateProgress(visibleLessons, completedIds);
  }, [visibleLessons, attendances]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [courseId]);

  useEffect(() => {
    if (courseId) fetchCourseData();
  }, [courseId, user, rolesLoading]);

  useEffect(() => {
    if (canBypassRestrictions) setAccessBlocked(null);
  }, [canBypassRestrictions]);

  const fetchCourseData = async () => {
    try {
      let courseData;
      let courseError;
      
      if (isUUID) {
        const result = await supabase.from('courses').select('*').eq('id', courseId).single();
        courseData = result.data;
        courseError = result.error;
        if (courseData?.slug) {
          navigate(`/course/${courseData.slug}`, { replace: true });
          return;
        }
      } else {
        const result = await supabase.from('courses').select('*').eq('slug', courseId).single();
        courseData = result.data;
        courseError = result.error;
      }

      if (courseError) throw courseError;
      setCourse(courseData);

      const courseName = isArabic ? courseData.title_ar : courseData.title;
      trackViewContent(courseName, courseData.id, courseData.price || 0);

      // Fetch enrollment count for social proof
      const { count } = await supabase
        .from('course_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseData.id)
        .eq('status', 'active');
      setEnrollmentCount(count || 0);

      // Academic validation only for logged-in students
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('grade, academic_year, language_track')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileData) setUserProfile(profileData);

        if (profileData && !canBypassRestrictions) {
          const coursePath = parseAcademicPath(courseData.grade);
          const validation = canAccessContent(profileData, {
            grade: coursePath.grade,
            language_track: coursePath.track,
          });
          if (!validation.allowed) {
            setAccessBlocked({ blocked: true, message: isArabic ? validation.messageAr : validation.message });
          } else {
            setAccessBlocked(null);
          }
        } else {
          setAccessBlocked(null);
        }
      }

      const actualCourseId = courseData.id;
      
      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', actualCourseId)
        .order('order_index');
      setLessons(lessonsData || []);

      const { data: chaptersData } = await supabase
        .from('chapters')
        .select('*')
        .eq('course_id', actualCourseId)
        .order('order_index');
      setChapters(chaptersData || []);

      if (user) {
        const { data: enrollment } = await supabase
          .from('course_enrollments')
          .select('id, status')
          .eq('user_id', user.id)
          .eq('course_id', actualCourseId)
          .maybeSingle();

        setIsEnrolled(!!enrollment);
        setEnrollmentStatus(enrollment?.status || '');

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
      navigate(`/auth?redirect=${encodeURIComponent(`/course/${courseId}`)}`);
      return;
    }

    if (accessBlocked?.blocked) {
      toast({ variant: 'destructive', title: isArabic ? 'غير مسموح' : 'Not Allowed', description: accessBlocked.message });
      return;
    }

    if (!course?.is_free && course?.price > 0) {
      navigate(`/payment/${course.id}`);
      return;
    }

    setEnrolling(true);
    try {
      const { error } = await supabase.from('course_enrollments').insert({
        user_id: user.id,
        course_id: course.id,
        status: 'active'
      });

      if (error) {
        if (error.code === '23505') {
          toast({ title: isArabic ? 'مشترك بالفعل' : 'Already enrolled', description: isArabic ? 'أنت مشترك في هذا الكورس بالفعل' : 'You are already enrolled in this course' });
        } else throw error;
      } else {
        setIsEnrolled(true);
        setEnrollmentStatus('active');
        trackSubscribe(course.price || 0, 'EGP');
        toast({ title: isArabic ? 'تم الاشتراك!' : 'Enrolled!', description: isArabic ? 'تم الاشتراك في الكورس بنجاح' : 'Successfully enrolled in the course' });
      }
    } catch (error) {
      console.error('Error enrolling:', error);
      toast({ variant: 'destructive', title: isArabic ? 'خطأ' : 'Error', description: isArabic ? 'فشل في الاشتراك' : 'Failed to enroll' });
    } finally {
      setEnrolling(false);
    }
  };

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(
      isArabic 
        ? `مرحباً، أريد الاستفسار عن كورس: ${course?.title_ar}`
        : `Hello, I want to inquire about: ${course?.title}`
    );
    window.open(`https://wa.me/2${OFFICIAL_WHATSAPP}?text=${message}`, '_blank');
  };

  const isLessonCompleted = (lessonId: string) => attendances.some(a => a.lesson_id === lessonId);

  const canAccessLesson = (lessonId: string, lessonCompleted: boolean) => {
    if (canBypassRestrictions) return true;
    if (accessBlocked?.blocked) return false;
    if (course?.is_free) return true;
    if (!isEnrolled) return false;
    if (enrollmentStatus === 'suspended') return lessonCompleted;
    if (enrollmentStatus === 'active') return true;
    return false;
  };

  if (loading) {
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

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 pt-24 text-center">
          <h1 className="text-2xl font-bold mb-4">{isArabic ? 'الكورس غير موجود' : 'Course not found'}</h1>
          <Button onClick={() => navigate('/courses')}>{isArabic ? 'العودة للكورسات' : 'Back to Courses'}</Button>
        </main>
      </div>
    );
  }

  const gradeInfo = GRADE_OPTIONS[course.grade];
  const isPreviewCourse = isCoursePreview(course.grade);
  const isPaidCourse = !course.is_free && course.price > 0;

  // Benefits for landing page
  const benefits = [
    { icon: Brain, text: isArabic ? 'فهم قبل الحفظ — شرح يوصّل المعلومة بطريقة مختلفة' : 'Understanding before memorization — explanation that delivers differently' },
    { icon: Target, text: isArabic ? 'Focus Mode — نظام يقيس تركيزك الحقيقي مش مجرد مشاهدة' : 'Focus Mode — system that measures real focus, not just views' },
    { icon: TrendingUp, text: isArabic ? 'امتحانات ذكية — تحليل أداء يفهمك نقاط ضعفك' : 'Smart exams — performance analysis that reveals your weak points' },
    { icon: Star, text: isArabic ? 'جرّب قبل ما تدفع — حصص مجانية متاحة' : 'Try before you pay — free lessons available' },
  ];

  // Platform features
  const platformFeatures = [
    { icon: Smartphone, text: isArabic ? 'شغال على الموبايل والكمبيوتر' : 'Works on mobile and desktop' },
    { icon: MessageCircle, text: isArabic ? 'دعم مباشر من المدرسين المساعدين' : 'Direct support from assistant teachers' },
    { icon: Award, text: isArabic ? 'داشبورد ذكي لمتابعة تقدمك' : 'Smart dashboard to track your progress' },
    { icon: Shield, text: isArabic ? 'تصحيح تلقائي وتحليل فوري' : 'Automatic correction and instant analysis' },
  ];

  // Show landing page for visitors viewing paid courses (not enrolled)
  const showLandingPage = isPaidCourse && !isEnrolled && !canBypassRestrictions;

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <SEOHead 
        title={`${course.title} – Hossam Fekry Platform`}
        titleAr={`${course.title_ar} – منصة حسام فكري`}
        description={course.description || `Chemistry course for ${gradeInfo?.en || 'Thanaweya Amma'} students`}
        descriptionAr={course.description_ar || `كورس كيمياء لطلاب ${gradeInfo?.ar || 'الثانوية العامة'}`}
        canonical={`https://hossamfekry.com/course/${course.slug}`}
        ogImage={course.thumbnail_url || '/favicon.jpg'}
      />
      <Navbar />

      <main className="pt-20 pb-16">
        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 1: HERO - Course title, promise, and primary CTA
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 border-b">
          <div className="container mx-auto px-4 py-8 md:py-12">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/courses')}
              className="mb-4 gap-2"
            >
              <ArrowLeft className={cn("w-4 h-4", isRTL && "rotate-180")} />
              {isArabic ? 'الكورسات' : 'Courses'}
            </Button>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Course Info */}
              <div className="flex-1">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className="text-sm">{isArabic ? gradeInfo?.ar : gradeInfo?.en}</Badge>
                  {course.is_free && <Badge className="bg-green-600">{isArabic ? 'مجاني' : 'Free'}</Badge>}
                  {isPreviewCourse && canBypassRestrictions && (
                    <Badge className="bg-amber-500 text-white">{isArabic ? 'معاينة' : 'Preview'}</Badge>
                  )}
                </div>

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                  {isArabic ? course.title_ar : course.title}
                </h1>
                
                {/* Strong promise / outcome */}
                <p className="text-lg md:text-xl text-muted-foreground mb-6 max-w-2xl">
                  {isArabic 
                    ? 'افهم الكيمياء بطريقة مختلفة — مش مجرد شرح، ده نظام كامل هيخليك تحقق أعلى الدرجات'
                    : 'Understand chemistry differently — not just lessons, a complete system to achieve top grades'
                  }
                </p>

                {/* Course stats */}
                <div className="flex flex-wrap gap-4 md:gap-6 text-sm text-muted-foreground mb-6">
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    {lessons.length} {isArabic ? 'حصة' : 'sessions'}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    {course.duration_hours} {isArabic ? 'ساعة' : 'hours'}
                  </span>
                  {enrollmentCount > 10 && (
                    <span className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      {enrollmentCount}+ {isArabic ? 'طالب مشترك' : 'enrolled'}
                    </span>
                  )}
                </div>

                {/* Primary CTA for visitors */}
                {showLandingPage ? (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button size="lg" onClick={handleEnroll} className="gap-2 text-base px-8">
                      <Zap className="w-5 h-5" />
                      {isArabic ? 'اشترك الآن' : 'Enroll Now'} — {course.price} {isArabic ? 'ج.م' : 'EGP'}
                    </Button>
                    <Button size="lg" variant="outline" onClick={handleWhatsAppContact} className="gap-2">
                      <MessageCircle className="w-5 h-5" />
                      {isArabic ? 'استفسر أولاً' : 'Ask First'}
                    </Button>
                  </div>
                ) : canBypassRestrictions ? (
                  <div className="space-y-3">
                    <Badge className="bg-secondary text-secondary-foreground">{isArabic ? 'عرض المدرس' : 'Teacher View'}</Badge>
                    <div className="flex flex-wrap gap-2">
                      <Button size="lg" onClick={() => navigate('/assistant/lessons')} className="gap-2">
                        <BookOpen className="w-4 h-4" />
                        {isArabic ? 'إدارة الحصص' : 'Manage Sessions'}
                      </Button>
                    </div>
                  </div>
                ) : isEnrolled ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary"><CheckCircle2 className="w-3 h-3 mr-1" />{isArabic ? 'مشترك' : 'Enrolled'}</Badge>
                      {enrollmentStatus === 'pending' && <Badge variant="secondary">{isArabic ? 'في انتظار التفعيل' : 'Pending Activation'}</Badge>}
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{isArabic ? 'تقدمك' : 'Your Progress'}</span>
                        <span>{progressData.completed}/{progressData.total} {isArabic ? 'حصة' : 'sessions'}</span>
                      </div>
                      <Progress value={progressData.percent} className="h-2" />
                    </div>
                  </div>
                ) : course.is_free ? (
                  <Button size="lg" onClick={handleEnroll} disabled={enrolling} className="gap-2">
                    {enrolling ? (isArabic ? 'جاري الاشتراك...' : 'Enrolling...') : (isArabic ? 'اشترك مجاناً' : 'Enroll Free')}
                  </Button>
                ) : null}
              </div>

              {/* Course Image */}
              <div className="lg:w-96 shrink-0 w-full">
                <img 
                  src={course.thumbnail_url || '/images/default-course-cover.svg'} 
                  alt={isArabic ? course.title_ar : course.title}
                  className={cn(
                    "w-full aspect-video object-cover rounded-2xl shadow-xl",
                    !course.thumbnail_url && "opacity-60"
                  )}
                  onError={(e) => { (e.target as HTMLImageElement).src = '/images/default-course-cover.svg'; }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 2: WHY THIS COURSE? (Only for landing page visitors)
        ═══════════════════════════════════════════════════════════════════ */}
        {showLandingPage && (
          <section className="py-12 md:py-16 bg-muted/30">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
                {isArabic ? 'ليه الكورس ده مختلف؟' : 'Why is this course different?'}
              </h2>
              <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-10">
                {isArabic 
                  ? 'مش مجرد فيديوهات على اليوتيوب — ده نظام تعليمي كامل مصمم عشان تفهم وتتفوق'
                  : "Not just YouTube videos — this is a complete educational system designed for understanding and excellence"
                }
              </p>

              <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-4 p-5 bg-card border rounded-xl hover:border-primary/30 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <benefit.icon className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-foreground/90">{benefit.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 3: COURSE CONTENT OVERVIEW
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              {isArabic ? 'محتوى الكورس' : 'Course Content'}
            </h2>
            <p className="text-muted-foreground mb-8">
              {chapters.length} {isArabic ? 'أبواب' : 'chapters'} • {lessons.length} {isArabic ? 'حصة' : 'lessons'}
            </p>

            {/* Show limited content for landing page, full for enrolled */}
            <div className="space-y-6">
              {chapters.length > 0 ? (
                <>
                  {chapters.slice(0, showLandingPage && !showFullContent ? 3 : chapters.length).map((chapter, chapterIndex) => {
                    const chapterLessons = lessonsByChapter[chapter.id] || [];
                    const chapterProgressData = getChapterProgress(chapter.id);
                    const chapterExam = chapterExams[chapter.id];
                    const chapterExamAttempt = examAttempts[chapter.id];
                    const canAccessExam = canAccessChapterExam(chapter.id);

                    if (chapterLessons.length === 0) return null;

                    return (
                      <div key={chapter.id} className="bg-card border rounded-xl overflow-hidden">
                        {/* Chapter Header */}
                        <div className="flex items-center gap-3 p-4 bg-muted/50">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Layers className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold">
                              {isArabic ? `الباب ${chapterIndex + 1}: ${chapter.title_ar}` : `Chapter ${chapterIndex + 1}: ${chapter.title}`}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {chapterLessons.length} {isArabic ? 'حصة' : 'lessons'}
                              {chapterProgressData && isEnrolled && (
                                <span className="mx-2">•</span>
                              )}
                              {chapterProgressData && isEnrolled && (
                                <span>{chapterProgressData.completedLessons}/{chapterProgressData.totalLessons} {isArabic ? 'مكتملة' : 'completed'}</span>
                              )}
                            </p>
                          </div>
                          {showLandingPage && (
                            <Lock className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>

                        {/* Chapter Lessons - Only show for enrolled users */}
                        {(isEnrolled || canBypassRestrictions || course.is_free) && (
                          <div className="divide-y divide-border">
                            {chapterLessons.map((lesson, index) => {
                              const completed = isLessonCompleted(lesson.id);
                              const canAccess = canAccessLesson(lesson.id, completed);
                              const hasVideo = hasValidVideo(lesson.video_url);

                              return (
                                <div
                                  key={lesson.id}
                                  className={cn(
                                    "flex items-center gap-4 p-4 transition-all",
                                    canAccess && hasVideo ? "hover:bg-muted/50 cursor-pointer" : "opacity-60"
                                  )}
                                  onClick={() => canAccess && hasVideo && navigate(`/lesson/${lesson.short_id}`)}
                                >
                                  <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                                    completed ? "bg-green-500 text-white" : canAccess && hasVideo ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                  )}>
                                    {completed ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium truncate">{isArabic ? lesson.title_ar : lesson.title}</h4>
                                    <span className="text-sm text-muted-foreground">{lesson.duration_minutes} {isArabic ? 'دقيقة' : 'min'}</span>
                                  </div>
                                  <div className="shrink-0">
                                    {!hasVideo ? (
                                      <Badge variant="outline" className="text-xs">{isArabic ? 'قريباً' : 'Soon'}</Badge>
                                    ) : canAccess ? (
                                      <Button size="sm" variant={completed ? "secondary" : "default"}>
                                        {completed ? (isArabic ? 'مراجعة' : 'Review') : <><Play className="w-4 h-4 mr-1" />{isArabic ? 'ابدأ' : 'Start'}</>}
                                      </Button>
                                    ) : (
                                      <Lock className="w-5 h-5 text-muted-foreground" />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Chapter Exam */}
                        {chapterExam && (isEnrolled || canBypassRestrictions) && (
                          <div className="p-4 border-t">
                            <ChapterExamSection
                              chapterId={chapter.id}
                              isArabic={isArabic}
                              exam={chapterExam}
                              chapterProgress={chapterProgressData}
                              examAttempt={chapterExamAttempt}
                              canAccessExam={canAccessExam}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Show more button for landing page */}
                  {showLandingPage && chapters.length > 3 && !showFullContent && (
                    <Button 
                      variant="outline" 
                      onClick={() => setShowFullContent(true)}
                      className="w-full gap-2"
                    >
                      <ChevronDown className="w-4 h-4" />
                      {isArabic ? `عرض ${chapters.length - 3} أبواب أخرى` : `Show ${chapters.length - 3} more chapters`}
                    </Button>
                  )}
                </>
              ) : (
                <div className="text-center py-12 bg-card border rounded-xl">
                  <BookOpen className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{isArabic ? 'المحتوى قيد الإعداد' : 'Content Coming Soon'}</h3>
                  <p className="text-muted-foreground">{isArabic ? 'تابعنا للحصول على التحديثات!' : 'Follow us for updates!'}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 4: PLATFORM EXPERIENCE (Only for landing page visitors)
        ═══════════════════════════════════════════════════════════════════ */}
        {showLandingPage && (
          <section className="py-12 md:py-16 bg-primary/5">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
                {isArabic ? 'مش مجرد فيديوهات — ده نظام كامل' : 'Not just videos — a complete system'}
              </h2>
              <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-10">
                {isArabic 
                  ? 'المنصة مصممة عشان تتابعك خطوة بخطوة وتساعدك توصل لأعلى مستوى'
                  : 'The platform is designed to guide you step by step and help you reach the highest level'
                }
              </p>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
                {platformFeatures.map((feature, index) => (
                  <div key={index} className="flex flex-col items-center text-center p-5 bg-card border rounded-xl">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-sm text-foreground/90">{feature.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 5: PRICING CTA (Only for landing page visitors)
        ═══════════════════════════════════════════════════════════════════ */}
        {showLandingPage && (
          <section className="py-12 md:py-16">
            <div className="container mx-auto px-4 max-w-xl">
              <div className="bg-card border-2 border-primary/20 rounded-2xl p-6 md:p-8 text-center shadow-lg">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">
                  {isArabic ? 'ابدأ رحلتك دلوقتي' : 'Start Your Journey Now'}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {isArabic 
                    ? 'اشترك واحصل على وصول كامل لكل الحصص والامتحانات'
                    : 'Subscribe and get full access to all lessons and exams'
                  }
                </p>

                <div className="flex items-baseline justify-center gap-2 mb-6">
                  <span className="text-4xl md:text-5xl font-bold text-primary">{course.price}</span>
                  <span className="text-lg text-muted-foreground">{isArabic ? 'ج.م' : 'EGP'}</span>
                </div>

                <div className="space-y-3">
                  <Button size="lg" onClick={handleEnroll} className="w-full gap-2 text-base h-12">
                    <Zap className="w-5 h-5" />
                    {user ? (isArabic ? 'اشترك الآن' : 'Enroll Now') : (isArabic ? 'سجّل دخول واشترك' : 'Sign in & Enroll')}
                  </Button>
                  <Button size="lg" variant="outline" onClick={handleWhatsAppContact} className="w-full gap-2">
                    <MessageCircle className="w-5 h-5" />
                    {isArabic ? 'تواصل مع المدرس المساعد' : 'Contact Assistant Teacher'}
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground mt-4">
                  {isArabic ? 'اشتراكك آمن — والدعم متاح لأي استفسار' : 'Secure subscription — support available for any questions'}
                </p>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}