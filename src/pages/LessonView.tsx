import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight,
  Play, 
  CheckCircle2, 
  BookOpen, 
  Clock,
  ChevronRight,
  Lock,
  Youtube,
  Layers,
  LogIn,
  Gift,
  FileQuestion,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useShortId } from '@/hooks/useShortId';
import { extractYouTubeVideoId } from '@/lib/youtubeUtils';
import { hasValidVideo } from '@/lib/contentVisibility';
import { SEOHead } from '@/components/seo/SEOHead';
import { toast } from 'sonner';

const getYouTubeVideoId = extractYouTubeVideoId;

interface Lesson {
  id: string;
  short_id: number;
  title: string;
  title_ar: string;
  course_id: string;
  chapter_id: string | null;
  order_index: number;
  duration_minutes: number;
  lesson_type: string;
  video_url: string | null;
  is_free_lesson: boolean;
}

interface Course {
  id: string;
  title: string;
  title_ar: string;
  slug: string;
  is_free: boolean;
}

interface Chapter {
  id: string;
  title: string;
  title_ar: string;
  order_index: number;
}

interface LinkedExam {
  id: string;
  title: string;
  title_ar: string;
  status: string;
}

export default function LessonView() {
  const { lessonId: lessonIdParam } = useParams();
  const navigate = useNavigate();
  const { language, isRTL } = useLanguage();
  const { user } = useAuth();
  const { isAdmin, isAssistantTeacher, loading: rolesLoading } = useUserRole();
  const isArabic = language === 'ar';
  
  // Resolve short_id or UUID to actual UUID
  const { uuid: lessonId, loading: resolving } = useShortId(lessonIdParam, 'lesson');
  
  const isStaff = !rolesLoading && (isAdmin() || isAssistantTeacher());

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);
  const [linkedExam, setLinkedExam] = useState<LinkedExam | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [completionSaving, setCompletionSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyLessonLink = async () => {
    const shortUrl = `${window.location.origin}/lesson/${lesson?.short_id}`;
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      toast.success(isArabic ? 'تم نسخ الرابط!' : 'Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(isArabic ? 'فشل نسخ الرابط' : 'Failed to copy link');
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [lessonIdParam]);

  useEffect(() => {
    if (lessonId && !resolving) {
      fetchLesson();
    }
  }, [lessonId, user]);

  const fetchLesson = async () => {
    try {
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (lessonError) throw lessonError;
      setLesson(lessonData);

      const { data: courseData } = await supabase
        .from('courses')
        .select('id, title, title_ar, slug, is_free')
        .eq('id', lessonData.course_id)
        .single();

      setCourse(courseData);

      // Fetch chapter if exists
      if (lessonData.chapter_id) {
        const { data: chapterData } = await supabase
          .from('chapters')
          .select('id, title, title_ar, order_index')
          .eq('id', lessonData.chapter_id)
          .single();
        setChapter(chapterData);
      }

      // Fetch linked exam if exists
      if (lessonData.linked_exam_id) {
        const { data: examData } = await supabase
          .from('exams')
          .select('id, title, title_ar, status')
          .eq('id', lessonData.linked_exam_id)
          .single();
        if (examData && examData.status === 'published') {
          setLinkedExam(examData);
        }
      }

      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', lessonData.course_id)
        .order('order_index');

      setCourseLessons(lessonsData || []);

      if (user) {
        const { data: enrollment } = await supabase
          .from('course_enrollments')
          .select('id')
          .eq('user_id', user.id)
          .eq('course_id', lessonData.course_id)
          .maybeSingle();

        setIsEnrolled(!!enrollment);

        const { data: attendance } = await supabase
          .from('lesson_attendance')
          .select('id')
          .eq('user_id', user.id)
          .eq('lesson_id', lessonId)
          .maybeSingle();

        setCompleted(!!attendance);
      }
    } catch (error) {
      console.error('Error fetching lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!user || !lesson || completionSaving) return;

    setCompletionSaving(true);
    try {
      // System-driven completion: Write real record to database
      // Source: manual_confirm - student explicitly clicked "خلصت الحصة"
      const { error: completionError } = await supabase
        .from('lesson_completions')
        .upsert({
          user_id: user.id,
          lesson_id: lesson.id,
          completed_at: new Date().toISOString()
        }, { onConflict: 'user_id,lesson_id' });
      
      if (completionError) throw completionError;

      // Also record attendance
      await supabase
        .from('lesson_attendance')
        .upsert({
          user_id: user.id,
          lesson_id: lesson.id,
          attendance_type: 'online'
        }, { onConflict: 'user_id,lesson_id' });

      setCompleted(true);
      toast.success(isArabic ? '✔️ تم تسجيل إكمال الحصة بنجاح' : '✔️ Lesson completed successfully');
    } catch (error) {
      console.error('Error marking lesson complete:', error);
      toast.error(isArabic ? 'حدث خطأ، حاول مرة أخرى' : 'An error occurred, please try again');
    } finally {
      setCompletionSaving(false);
    }
  };

  const currentLessonIndex = courseLessons.findIndex(l => l.id === lessonId);
  const previousLesson = currentLessonIndex > 0 ? courseLessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex < courseLessons.length - 1 ? courseLessons[currentLessonIndex + 1] : null;

  // Generate SEO metadata
  const seoTitle = isArabic 
    ? `${lesson?.title_ar || ''} | ${course?.title_ar || ''} | منصة حسام فكري`
    : `${lesson?.title || lesson?.title_ar || ''} | ${course?.title || course?.title_ar || ''} | Hossam Fekry`;
  
  const seoDescription = isArabic
    ? `شرح مبسط وواضح لـ ${lesson?.title_ar || ''} من كورس ${course?.title_ar || ''} للثانوية العامة مع تطبيق عملي واختبارات ذكية.`
    : `Understand ${lesson?.title || lesson?.title_ar || ''} clearly with practical explanation for Thanaweya Amma students.`;

  if (loading || resolving) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 pt-24 text-center">
          <h1 className="text-2xl font-bold mb-4">{isArabic ? 'الحصة غير موجودة' : 'Session not found'}</h1>
          <Button onClick={() => navigate('/courses')}>
            {isArabic ? 'العودة للكورسات' : 'Back to Courses'}
          </Button>
        </main>
      </div>
    );
  }

  // Access logic: staff always has access, free lessons accessible to all, enrolled users have access
  const isFreeLesson = lesson.is_free_lesson;
  const canAccess = isStaff || isFreeLesson || course?.is_free || isEnrolled;

  // Show locked state for paid content when not enrolled
  if (!canAccess && user) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead 
          title={seoTitle}
          titleAr={seoTitle}
          description={seoDescription}
          descriptionAr={seoDescription}
          noIndex={true}
        />
        <Navbar />
        <main className="container mx-auto px-4 py-8 pt-24">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-3">{isArabic ? 'الحصة مقفولة' : 'Lesson Locked'}</h1>
            <p className="text-muted-foreground mb-6">
              {isArabic 
                ? 'اشترك في الكورس للوصول لكل الحصص والمحتوى الحصري' 
                : 'Subscribe to the course to access all lessons and exclusive content'}
            </p>
            <div className="bg-card border rounded-xl p-6 mb-6">
              <h3 className="font-semibold mb-2">{isArabic ? course?.title_ar : course?.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {isArabic ? 'محتوى متكامل مع متابعة واختبارات' : 'Complete content with tracking and exams'}
              </p>
              <Button 
                size="lg" 
                className="w-full"
                onClick={() => navigate(`/payment/${course?.id}`)}
              >
                {isArabic ? 'اشترك الآن' : 'Subscribe Now'}
              </Button>
            </div>
            <Button variant="ghost" onClick={() => navigate(`/course/${course?.slug || course?.id}`)}>
              {isArabic ? 'تصفح الكورس' : 'Browse Course'}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Show login prompt for non-authenticated users (but still show free lesson content)
  if (!user && !isFreeLesson) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead 
          title={seoTitle}
          titleAr={seoTitle}
          description={seoDescription}
          descriptionAr={seoDescription}
        />
        <Navbar />
        <main className="container mx-auto px-4 py-8 pt-24">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <LogIn className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-3">{isArabic ? 'سجل دخول للمتابعة' : 'Login to Continue'}</h1>
            <p className="text-muted-foreground mb-6">
              {isArabic 
                ? 'سجل دخول لمشاهدة الحصص ومتابعة تقدمك وحل الاختبارات' 
                : 'Login to watch lessons, track progress, and take exams'}
            </p>
            <div className="flex flex-col gap-3">
              <Button size="lg" onClick={() => navigate('/auth')}>
                <LogIn className="w-4 h-4 mr-2" />
                {isArabic ? 'تسجيل الدخول' : 'Login'}
              </Button>
              <Button variant="ghost" onClick={() => navigate('/free-lessons')}>
                {isArabic ? 'شاهد الحصص المجانية' : 'Watch Free Lessons'}
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <SEOHead 
        title={seoTitle}
        titleAr={seoTitle}
        description={seoDescription}
        descriptionAr={seoDescription}
        canonical={`${window.location.origin}/lesson/${lesson?.short_id || lessonId}`}
      />
      <Navbar />

      <main className="pt-20">
        {/* Header with hierarchy */}
        <header className="bg-card border-b">
          <div className="container mx-auto px-4 py-4 md:py-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4" aria-label="Breadcrumb">
              <Link to="/courses" className="hover:text-primary transition-colors">
                {isArabic ? 'الكورسات' : 'Courses'}
              </Link>
              <ChevronRight className="w-4 h-4" />
              <Link to={`/course/${course?.slug || course?.id}`} className="hover:text-primary transition-colors">
                {isArabic ? course?.title_ar : course?.title}
              </Link>
              {chapter && (
                <>
                  <ChevronRight className="w-4 h-4" />
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    {isArabic ? chapter.title_ar : chapter.title}
                  </span>
                </>
              )}
            </nav>

            {/* Lesson Title & Meta */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-3">
                  {isArabic ? lesson.title_ar : lesson.title}
                </h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {lesson.duration_minutes} {isArabic ? 'دقيقة' : 'min'}
                  </span>
                  {isFreeLesson && (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                      <Gift className="w-3 h-3 mr-1" />
                      {isArabic ? 'مجانية' : 'Free'}
                    </Badge>
                  )}
                  {completed && (
                    <Badge className="bg-green-600 text-white">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {isArabic ? 'مكتملة' : 'Completed'}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Chapter Info */}
              {chapter && (
                <div className="bg-muted/50 rounded-lg px-4 py-2 text-sm">
                  <span className="text-muted-foreground">{isArabic ? 'الباب:' : 'Chapter:'}</span>
                  <span className="font-medium mr-2">{isArabic ? chapter.title_ar : chapter.title}</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="container mx-auto px-4 py-6 md:py-8 max-w-5xl">
          {/* Video Player Section */}
          <section className="mb-8" aria-labelledby="video-section-title">
            <div className="flex items-center gap-2 mb-4">
              <Youtube className="w-5 h-5 text-red-500" />
              <h2 id="video-section-title" className="font-semibold text-lg">
                {isArabic ? 'فيديو الحصة' : 'Lesson Video'}
              </h2>
            </div>
            
            {lesson.video_url && getYouTubeVideoId(lesson.video_url) ? (
              /* Video Container - fixed 16:9 aspect ratio, lazy loaded */
              <div className="relative w-full rounded-xl overflow-hidden bg-black shadow-lg" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src={`https://www.youtube.com/embed/${getYouTubeVideoId(lesson.video_url)}?rel=0&modestbranding=1`}
                  title={isArabic ? lesson.title_ar : lesson.title}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            ) : (
              /* Empty/Error State */
              <div className="relative w-full rounded-xl overflow-hidden bg-muted border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center py-16">
                <AlertCircle className="w-16 h-16 text-muted-foreground/40 mb-4" />
                <p className="text-muted-foreground font-medium text-lg">
                  {isArabic ? 'فيديو الحصة غير متاح حاليًا' : 'Lesson video not available'}
                </p>
                <p className="text-muted-foreground/60 text-sm mt-2 text-center px-4">
                  {isArabic ? 'سيتم إضافة الفيديو قريباً — يمكنك متابعة الحصص الأخرى' : 'Video will be added soon — you can continue with other lessons'}
                </p>
              </div>
            )}

            {/* Share/Copy Link Button - Inside lesson content */}
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={copyLessonLink}
                className="gap-2"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? (isArabic ? 'تم نسخ الرابط!' : 'Link Copied!') : (isArabic ? 'مشاركة الحصة' : 'Share Lesson')}
              </Button>
            </div>
          </section>

          {/* Guidance Text - System-driven completion */}
          {user && hasValidVideo(lesson.video_url) && !completed && (
            <section className="bg-muted/30 border border-muted rounded-lg p-4 mb-6 text-center">
              <p className="text-sm text-muted-foreground">
                {isArabic 
                  ? 'اضغط بعد ما تخلص مشاهدة الحصة بالكامل'
                  : 'Click after you finish watching the lesson completely'}
              </p>
            </section>
          )}

          {/* Action Buttons Section */}
          {user && hasValidVideo(lesson.video_url) && (
            <section className="bg-card border rounded-2xl p-6 md:p-8 mb-6">
              {completed ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold text-green-600">
                    {isArabic ? 'تم إكمال الحصة' : 'Lesson Completed'}
                  </h3>
                  
                  {/* Exam Button - only show if exam exists and lesson is completed */}
                  {linkedExam && (
                    <div className="w-full max-w-sm mt-2">
                      <Button 
                        size="lg"
                        onClick={() => navigate(`/exam/${linkedExam.id}`)}
                        className="w-full bg-primary hover:bg-primary/90 text-lg py-6"
                      >
                        <FileQuestion className="w-5 h-5 mr-2" />
                        {isArabic ? 'ابدأ الامتحان' : 'Start Exam'}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  {/* System-driven completion button - always enabled */}
                  <Button 
                    size="lg" 
                    onClick={handleComplete} 
                    className="bg-green-600 hover:bg-green-700 text-lg px-8 py-6 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={completionSaving}
                  >
                    {completionSaving ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                    )}
                    {isArabic ? 'خلصت الحصة' : 'Mark Complete'}
                  </Button>
                  
                  {/* Exam Button - disabled state with reason */}
                  {linkedExam && (
                    <div className="w-full max-w-sm">
                      <Button 
                        size="lg"
                        disabled
                        className="w-full opacity-50 cursor-not-allowed py-6"
                        variant="outline"
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        {isArabic ? 'أكمل الحصة لفتح الامتحان' : 'Complete lesson to unlock exam'}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Login CTA for free lessons when not logged in */}
          {!user && isFreeLesson && hasValidVideo(lesson.video_url) && (
            <section className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-8 text-center">
              <h3 className="font-semibold mb-2">
                {isArabic ? 'سجل دخول لحفظ تقدمك' : 'Login to save your progress'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {isArabic 
                  ? 'أنشئ حساب مجاني لمتابعة تقدمك وحل الاختبارات'
                  : 'Create a free account to track progress and take exams'}
              </p>
              <Button onClick={() => navigate('/auth')}>
                <LogIn className="w-4 h-4 mr-2" />
                {isArabic ? 'تسجيل الدخول' : 'Login'}
              </Button>
            </section>
          )}

          {/* Navigation */}
          <nav className="flex items-center justify-between gap-4" aria-label="Lesson navigation">
            <div className="flex-1">
              {previousLesson ? (
                <Button 
                  variant="outline" 
                  onClick={() => navigate(`/lesson/${previousLesson.short_id}`)}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">{isArabic ? 'الحصة السابقة' : 'Previous'}</span>
                </Button>
              ) : (
                <Button 
                  variant="ghost" 
                  onClick={() => navigate(`/course/${course?.slug || course?.id}`)}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">{isArabic ? 'الكورس' : 'Course'}</span>
                </Button>
              )}
            </div>

            {/* Progress indicator */}
            <div className="text-sm text-muted-foreground hidden md:block">
              {currentLessonIndex + 1} / {courseLessons.length}
            </div>

            <div className="flex-1 flex justify-end">
              {nextLesson ? (
                <Button 
                  onClick={() => navigate(`/lesson/${nextLesson.short_id}`)}
                  className="gap-2"
                >
                  <span className="hidden sm:inline">{isArabic ? 'الحصة التالية' : 'Next'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button 
                  onClick={() => navigate('/platform')}
                  className="gap-2"
                >
                  <span className="hidden sm:inline">{isArabic ? 'للمنصة' : 'Platform'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </nav>
        </div>

        {/* Floating Lesson List Button */}
        <div className="fixed bottom-4 right-4 z-40">
          <Button 
            size="sm" 
            variant="secondary"
            onClick={() => navigate(`/course/${course?.slug || course?.id}`)}
            className="shadow-lg gap-2"
          >
            <BookOpen className="w-4 h-4" />
            {courseLessons.length} {isArabic ? 'حصص' : 'lessons'}
          </Button>
        </div>
      </main>
    </div>
  );
}
