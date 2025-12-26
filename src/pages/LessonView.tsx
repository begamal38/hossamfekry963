import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight,
  Play, 
  CheckCircle2, 
  BookOpen, 
  Lightbulb, 
  AlertTriangle,
  Target,
  Clock,
  ChevronRight,
  Lock
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface Lesson {
  id: string;
  title: string;
  title_ar: string;
  course_id: string;
  order_index: number;
  duration_minutes: number;
  lesson_type: string;
}

interface Course {
  id: string;
  title: string;
  title_ar: string;
  is_free: boolean;
}

interface LessonContent {
  intro: { en: string; ar: string };
  explanation: { en: string; ar: string }[];
  examples: { en: string; ar: string }[];
  commonMistake: { en: string; ar: string };
  summary: { en: string; ar: string };
  closing: { en: string; ar: string };
}

// Sample content structure - in production, this would come from the database
const getSampleContent = (lessonTitle: string): LessonContent => ({
  intro: {
    en: `In this lesson, you'll understand the core concepts of ${lessonTitle}. Let's make chemistry simple and clear!`,
    ar: `في الحصة دي، هتفهم المفاهيم الأساسية لـ ${lessonTitle}. خلينا نخلي الكيمياء سهلة وواضحة!`
  },
  explanation: [
    {
      en: "First, let's understand the fundamental concept. This is the building block for everything else we'll learn.",
      ar: "أولاً، خلينا نفهم المفهوم الأساسي. ده اللي هنبني عليه كل حاجة تانية هنتعلمها."
    },
    {
      en: "Now, let's see why this matters in your exams and real-world applications.",
      ar: "دلوقتي، خلينا نشوف ليه ده مهم في الامتحانات والتطبيقات الحقيقية."
    }
  ],
  examples: [
    {
      en: "Example 1: Let's solve a basic problem step by step. Notice how we apply what we just learned.",
      ar: "مثال 1: خلينا نحل مسألة بسيطة خطوة بخطوة. لاحظ إزاي بنطبق اللي اتعلمناه."
    },
    {
      en: "Example 2: This is an exam-style question. This pattern appears frequently in Thanaweya Amma.",
      ar: "مثال 2: ده سؤال على نمط الامتحان. النمط ده بيظهر كتير في الثانوية العامة."
    },
    {
      en: "Example 3: A slightly more challenging problem to test your understanding.",
      ar: "مثال 3: مسألة أصعب شوية عشان نختبر فهمك."
    }
  ],
  commonMistake: {
    en: "⚠️ Common Trap: Many students confuse this concept with similar ones. Make sure you understand the key difference!",
    ar: "⚠️ خطأ شائع: طلاب كتير بيخلطوا المفهوم ده مع مفاهيم شبهه. تأكد إنك فاهم الفرق الأساسي!"
  },
  summary: {
    en: "Key takeaways: Remember the core concept, practice the examples, and avoid the common mistake we discussed.",
    ar: "النقاط الأساسية: افتكر المفهوم الأساسي، تدرب على الأمثلة، وابعد عن الخطأ الشائع اللي اتكلمنا عنه."
  },
  closing: {
    en: "Great job completing this lesson! Your understanding is growing. Keep up the momentum and move to the next lesson.",
    ar: "ممتاز إنك خلصت الحصة دي! فهمك بيتحسن. كمل الزخم ده وروح للحصة الجاية."
  }
});

export default function LessonView() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { t, language, isRTL } = useLanguage();
  const { user } = useAuth();
  const isArabic = language === 'ar';

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [completed, setCompleted] = useState(false);

  const content = lesson ? getSampleContent(isArabic ? lesson.title_ar : lesson.title) : null;

  const sections = content ? [
    { id: 'intro', title: isArabic ? 'المقدمة' : 'Introduction', icon: Target },
    { id: 'explanation', title: isArabic ? 'الشرح' : 'Explanation', icon: BookOpen },
    { id: 'examples', title: isArabic ? 'الأمثلة' : 'Examples', icon: Lightbulb },
    { id: 'mistake', title: isArabic ? 'خطأ شائع' : 'Common Mistake', icon: AlertTriangle },
    { id: 'summary', title: isArabic ? 'الملخص' : 'Summary', icon: CheckCircle2 },
  ] : [];

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

        // Check if already attended
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

  const progressPercent = ((currentSection + 1) / sections.length) * 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!lesson || !content) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 pt-24 text-center">
          <h1 className="text-2xl font-bold mb-4">{isArabic ? 'الحصة غير موجودة' : 'Lesson not found'}</h1>
          <Button onClick={() => navigate('/courses')}>
            {isArabic ? 'العودة للكورسات' : 'Back to Courses'}
          </Button>
        </main>
      </div>
    );
  }

  // Check if user can access this lesson
  const canAccess = course?.is_free || isEnrolled;

  if (!canAccess && user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 pt-24 text-center">
          <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">{isArabic ? 'الحصة مقفولة' : 'Lesson Locked'}</h1>
          <p className="text-muted-foreground mb-6">
            {isArabic ? 'اشترك في الكورس للوصول لهذه الحصة' : 'Enroll in the course to access this lesson'}
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
            {isArabic ? 'سجل دخول لمشاهدة الحصة ومتابعة تقدمك' : 'Login to watch the lesson and track your progress'}
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
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

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl md:text-2xl font-bold">
                  {isArabic ? lesson.title_ar : lesson.title}
                </h1>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
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

            {/* Progress */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{sections[currentSection]?.title}</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Section Navigation */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {sections.map((section, index) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setCurrentSection(index)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all",
                    currentSection === index
                      ? "bg-primary text-primary-foreground"
                      : index < currentSection
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {section.title}
                </button>
              );
            })}
          </div>

          {/* Section Content */}
          <div className="bg-card border rounded-2xl p-6 md:p-8 mb-8">
            {currentSection === 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{isArabic ? 'ايه اللي هتفهمه النهاردة؟' : "What will you understand today?"}</h2>
                  </div>
                </div>
                <p className="text-lg leading-relaxed">
                  {isArabic ? content.intro.ar : content.intro.en}
                </p>
              </div>
            )}

            {currentSection === 1 && (
              <div className="space-y-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{isArabic ? 'الشرح الأساسي' : 'Core Explanation'}</h2>
                  </div>
                </div>
                {content.explanation.map((exp, index) => (
                  <div key={index} className="p-4 bg-muted/50 rounded-xl">
                    <p className="text-lg leading-relaxed">
                      {isArabic ? exp.ar : exp.en}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {currentSection === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                    <Lightbulb className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{isArabic ? 'أمثلة تطبيقية' : 'Practical Examples'}</h2>
                  </div>
                </div>
                {content.examples.map((example, index) => (
                  <div key={index} className="p-5 bg-muted/50 rounded-xl border-l-4 border-primary">
                    <p className="text-lg leading-relaxed">
                      {isArabic ? example.ar : example.en}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {currentSection === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{isArabic ? 'انتبه من الخطأ الشائع!' : 'Watch Out for This Trap!'}</h2>
                  </div>
                </div>
                <div className="p-5 bg-red-500/10 rounded-xl border border-red-500/30">
                  <p className="text-lg leading-relaxed">
                    {isArabic ? content.commonMistake.ar : content.commonMistake.en}
                  </p>
                </div>
              </div>
            )}

            {currentSection === 4 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{isArabic ? 'ملخص الحصة' : 'Lesson Summary'}</h2>
                  </div>
                </div>
                <div className="p-5 bg-green-500/10 rounded-xl border border-green-500/30 mb-6">
                  <p className="text-lg leading-relaxed">
                    {isArabic ? content.summary.ar : content.summary.en}
                  </p>
                </div>
                <div className="p-5 bg-primary/10 rounded-xl">
                  <p className="text-lg leading-relaxed font-medium">
                    {isArabic ? content.closing.ar : content.closing.en}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              {currentSection > 0 ? (
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentSection(currentSection - 1)}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {isArabic ? 'السابق' : 'Previous'}
                </Button>
              ) : previousLesson ? (
                <Button 
                  variant="ghost" 
                  onClick={() => navigate(`/lesson/${previousLesson.id}`)}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {isArabic ? 'الحصة السابقة' : 'Previous Lesson'}
                </Button>
              ) : null}
            </div>

            <div className="flex-1 text-center">
              {currentSection === sections.length - 1 && !completed && (
                <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {isArabic ? 'خلصت الحصة' : 'Mark Complete'}
                </Button>
              )}
            </div>

            <div className="flex-1 flex justify-end">
              {currentSection < sections.length - 1 ? (
                <Button 
                  onClick={() => setCurrentSection(currentSection + 1)}
                  className="gap-2"
                >
                  {isArabic ? 'التالي' : 'Next'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : nextLesson ? (
                <Button 
                  onClick={() => navigate(`/lesson/${nextLesson.id}`)}
                  className="gap-2"
                >
                  {isArabic ? 'الحصة التالية' : 'Next Lesson'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button 
                  onClick={() => navigate('/dashboard')}
                  className="gap-2"
                >
                  {isArabic ? 'للوحة التحكم' : 'To Dashboard'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Lesson List Sidebar */}
        <div className="fixed bottom-4 right-4 z-40">
          <Button 
            size="sm" 
            variant="secondary"
            onClick={() => navigate(`/course/${course?.id}/lessons`)}
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
