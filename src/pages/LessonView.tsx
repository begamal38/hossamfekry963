import React, { useState, useEffect, useRef } from 'react';
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
  Timer
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { extractYouTubeVideoId } from '@/lib/youtubeUtils';
import { hasValidVideo } from '@/lib/contentVisibility';
import { useLessonWatchTime, formatRemainingTime } from '@/hooks/useLessonWatchTime';

// Use shared utility
const getYouTubeVideoId = extractYouTubeVideoId;

interface Lesson {
  id: string;
  title: string;
  title_ar: string;
  course_id: string;
  order_index: number;
  duration_minutes: number;
  lesson_type: string;
  video_url: string | null;
}

interface Course {
  id: string;
  title: string;
  title_ar: string;
  is_free: boolean;
}

export default function LessonView() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { language, isRTL } = useLanguage();
  const { user } = useAuth();
  const { isAdmin, isAssistantTeacher, loading: rolesLoading } = useUserRole();
  const isArabic = language === 'ar';
  
  // Staff (assistants/admins) bypass all access restrictions
  const isStaff = !rolesLoading && (isAdmin() || isAssistantTeacher());

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Watch time tracking for 20-minute requirement
  const { 
    watchTimeSeconds, 
    isCompleteButtonEnabled, 
    remainingSeconds, 
    isPlaying,
    startWatching, 
    pauseWatching 
  } = useLessonWatchTime(lessonId || '');

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [lessonId]);

  useEffect(() => {
    if (lessonId) {
      fetchLesson();
    }
  }, [lessonId, user]);

  const fetchLesson = async () => {
    try {
      // Fetch lesson
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (lessonError) throw lessonError;
      setLesson(lessonData);

      // Fetch course
      const { data: courseData } = await supabase
        .from('courses')
        .select('id, title, title_ar, is_free')
        .eq('id', lessonData.course_id)
        .single();

      setCourse(courseData);

      // Fetch all lessons in course
      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', lessonData.course_id)
        .order('order_index');

      setCourseLessons(lessonsData || []);

      // Check enrollment
      if (user) {
        const { data: enrollment } = await supabase
          .from('course_enrollments')
          .select('id')
          .eq('user_id', user.id)
          .eq('course_id', lessonData.course_id)
          .maybeSingle();

        setIsEnrolled(!!enrollment);

        // Check if already completed
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
    if (!user || !lesson) return;

    try {
      await supabase
        .from('lesson_attendance')
        .insert({
          user_id: user.id,
          lesson_id: lesson.id,
          attendance_type: 'online'
        });

      setCompleted(true);
    } catch (error) {
      console.error('Error marking lesson complete:', error);
    }
  };

  const currentLessonIndex = courseLessons.findIndex(l => l.id === lessonId);
  const previousLesson = currentLessonIndex > 0 ? courseLessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex < courseLessons.length - 1 ? courseLessons[currentLessonIndex + 1] : null;

  if (loading) {
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

  // Check if user can access this lesson
  // Staff ALWAYS has access, students need enrollment or free course
  const canAccess = isStaff || course?.is_free || isEnrolled;

  if (!canAccess && user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 pt-24 text-center">
          <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">{isArabic ? 'الحصة مقفولة' : 'Session Locked'}</h1>
          <p className="text-muted-foreground mb-6">
            {isArabic ? 'اشترك في الكورس للوصول لهذه الحصة' : 'Enroll in the course to access this session'}
          </p>
          <Button onClick={() => navigate(`/courses`)}>
            {isArabic ? 'اشترك الآن' : 'Enroll Now'}
          </Button>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 pt-24 text-center">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">{isArabic ? 'سجل دخول للمتابعة' : 'Login to Continue'}</h1>
          <p className="text-muted-foreground mb-6">
            {isArabic ? 'سجل دخول لمشاهدة الحصة ومتابعة تقدمك' : 'Login to watch the session and track your progress'}
          </p>
          <Button onClick={() => navigate('/auth')}>
            {isArabic ? 'تسجيل الدخول' : 'Login'}
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />

      <main className="pt-20">
        {/* Header */}
        <div className="bg-card border-b">
          <div className="container mx-auto px-4 py-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Link to="/courses" className="hover:text-primary">
                {isArabic ? 'الكورسات' : 'Courses'}
              </Link>
              <ChevronRight className="w-4 h-4" />
              <Link to={`/course/${course?.id}`} className="hover:text-primary">
                {isArabic ? course?.title_ar : course?.title}
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground">{isArabic ? lesson.title_ar : lesson.title}</span>
            </div>

            {/* Lesson Title & Status */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-xl md:text-2xl font-bold">
                  {isArabic ? lesson.title_ar : lesson.title}
                </h1>
                <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {lesson.duration_minutes} {isArabic ? 'دقيقة' : 'min'}
                  </span>
                  {completed && (
                    <Badge className="bg-green-600">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {isArabic ? 'مكتملة' : 'Completed'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Video Player Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Youtube className="w-5 h-5 text-red-500" />
              <h2 className="font-semibold">{isArabic ? 'فيديو الحصة' : 'Lesson Video'}</h2>
            </div>
            {lesson.video_url && getYouTubeVideoId(lesson.video_url) ? (
              <div className="space-y-4">
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-lg">
                  <iframe
                    src={`https://www.youtube.com/embed/${getYouTubeVideoId(lesson.video_url)}?rel=0&modestbranding=1&enablejsapi=1`}
                    title={isArabic ? lesson.title_ar : lesson.title}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                {/* Watch time controls */}
                {!completed && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <Button
                          variant={isPlaying ? "secondary" : "default"}
                          size="sm"
                          onClick={isPlaying ? pauseWatching : startWatching}
                        >
                          {isPlaying ? (
                            isArabic ? '⏸️ إيقاف مؤقت' : '⏸️ Pause Timer'
                          ) : (
                            isArabic ? '▶️ ابدأ المشاهدة' : '▶️ Start Watching'
                          )}
                        </Button>
                        <div className="flex items-center gap-2 text-sm">
                          <Timer className="w-4 h-4 text-primary" />
                          <span className="text-muted-foreground">
                            {isArabic ? 'وقت المشاهدة:' : 'Watch time:'}{' '}
                            <span className="font-mono font-semibold text-foreground">
                              {formatRemainingTime(watchTimeSeconds)}
                            </span>
                          </span>
                        </div>
                      </div>
                      {!isCompleteButtonEnabled && (
                        <div className="text-sm text-muted-foreground">
                          {isArabic ? 'متبقي:' : 'Remaining:'}{' '}
                          <span className="font-mono font-semibold text-primary">
                            {formatRemainingTime(remainingSeconds)}
                          </span>
                        </div>
                      )}
                    </div>
                    {!isCompleteButtonEnabled && (
                      <div className="mt-3">
                        <Progress 
                          value={(watchTimeSeconds / (20 * 60)) * 100} 
                          className="h-2"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          {isArabic 
                            ? 'شاهد 20 دقيقة على الأقل لتتمكن من تسجيل إكمال الحصة'
                            : 'Watch at least 20 minutes to mark the lesson as complete'
                          }
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center">
                <Play className="w-16 h-16 text-muted-foreground/40 mb-4" />
                <p className="text-muted-foreground font-medium text-lg">
                  {isArabic ? 'المحتوى قيد الإعداد' : 'Content Under Preparation'}
                </p>
                <p className="text-muted-foreground/60 text-sm mt-2">
                  {isArabic ? 'سيتم إضافة الفيديو قريباً' : 'Video will be added soon'}
                </p>
              </div>
            )}
          </div>

          {/* Primary Action: Mark Complete - Only show if video is available */}
          {hasValidVideo(lesson.video_url) ? (
            <div className="bg-card border rounded-2xl p-6 md:p-8 mb-8 text-center">
              {completed ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold text-green-600">
                    {isArabic ? 'أحسنت! خلصت الحصة' : 'Well done! Lesson completed'}
                  </h3>
                  <p className="text-muted-foreground">
                    {isArabic ? 'استمر للحصة التالية' : 'Continue to the next lesson'}
                  </p>
                </div>
              ) : (
              <div className="flex flex-col items-center gap-4">
                  <p className="text-lg text-muted-foreground">
                    {isCompleteButtonEnabled 
                      ? (isArabic ? 'خلصت مشاهدة الفيديو؟' : 'Finished watching the video?')
                      : (isArabic ? 'شاهد الفيديو لمدة 20 دقيقة' : 'Watch the video for 20 minutes')
                    }
                  </p>
                  <Button 
                    size="lg" 
                    onClick={handleComplete} 
                    className="bg-green-600 hover:bg-green-700 text-lg px-8 py-6 disabled:opacity-50"
                    disabled={!isCompleteButtonEnabled}
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    {isArabic ? 'خلصت الحصة' : 'Mark as Complete'}
                  </Button>
                  {!isCompleteButtonEnabled && (
                    <p className="text-sm text-muted-foreground">
                      {isArabic 
                        ? `متبقي ${formatRemainingTime(remainingSeconds)} للتمكن من إكمال الحصة`
                        : `${formatRemainingTime(remainingSeconds)} remaining to enable completion`
                      }
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : null}

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              {previousLesson ? (
                <Button 
                  variant="outline" 
                  onClick={() => navigate(`/lesson/${previousLesson.id}`)}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {isArabic ? 'الحصة السابقة' : 'Previous Lesson'}
                </Button>
              ) : (
                <Button 
                  variant="ghost" 
                  onClick={() => navigate(`/course/${course?.id}`)}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {isArabic ? 'العودة للكورس' : 'Back to Course'}
                </Button>
              )}
            </div>

            <div className="flex-1 flex justify-end">
              {nextLesson ? (
                <Button 
                  onClick={() => navigate(`/lesson/${nextLesson.id}`)}
                  className="gap-2"
                >
                  {isArabic ? 'الحصة التالية' : 'Next Lesson'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button 
                  onClick={() => navigate('/platform')}
                  className="gap-2"
                >
                  {isArabic ? 'للمنصة' : 'To Platform'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Lesson List Button */}
        <div className="fixed bottom-4 right-4 z-40">
          <Button 
            size="sm" 
            variant="secondary"
            onClick={() => navigate(`/course/${course?.id}`)}
            className="shadow-lg"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            {courseLessons.length} {isArabic ? 'حصص' : 'lessons'}
          </Button>
        </div>
      </main>
    </div>
  );
}
