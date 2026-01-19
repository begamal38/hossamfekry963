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
  Unlock,
  FileVideo,
  Layers
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
import { filterLessonsForStudents, hasValidVideo, calculateProgress, isCoursePreview } from '@/lib/contentVisibility';
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
  slug: string; // Always present (NOT NULL constraint)
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

export default function CourseView() {
  const { courseId } = useParams(); // Can be UUID or slug
  const navigate = useNavigate();
  const { t, language, isRTL } = useLanguage();
  const { user } = useAuth();
  const { loading: rolesLoading, isAdmin, isAssistantTeacher } = useUserRole();
  const { toast } = useToast();
  const { trackViewContent, trackSubscribe } = useFacebookPixel();
  const isArabic = language === 'ar';
  
  // Check if courseId is a UUID or slug
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseId || '');
  
  // Determine if user can bypass academic restrictions and enrollment checks
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

  // Chapter progress hook - for chapter-level exam unlocking
  const {
    chapterProgress,
    chapterExams,
    examAttempts,
    canAccessChapterExam,
    getChapterProgress,
  } = useChapterProgress(course?.id || '');

  // Filter lessons for student view (show all lessons, chapter is organizational only)
  const visibleLessons = useMemo(() => {
    // All lessons are visible now - chapter is for organization, not visibility
    return lessons;
  }, [lessons]);

  // Group lessons by chapter for organized display
  const lessonsByChapter = useMemo(() => {
    const grouped: Record<string, Lesson[]> = { uncategorized: [] };
    
    chapters.forEach(chapter => {
      grouped[chapter.id] = [];
    });
    
    visibleLessons.forEach(lesson => {
      if (lesson.chapter_id && grouped[lesson.chapter_id]) {
        grouped[lesson.chapter_id].push(lesson);
      } else {
        grouped.uncategorized.push(lesson);
      }
    });
    
  return grouped;
  }, [visibleLessons, chapters]);

  // Calculate progress based on lessons with valid videos only
  const progressData = useMemo(() => {
    const completedIds = attendances.map(a => a.lesson_id);
    return calculateProgress(visibleLessons, completedIds);
  }, [visibleLessons, attendances]);

  // Find last accessed chapter for enrolled students - MUST be before any early returns
  const lastAccessedChapter = useMemo(() => {
    if (!isEnrolled || chapters.length === 0) return null;
    
    // Find the chapter with the most recent incomplete lesson
    for (let i = chapters.length - 1; i >= 0; i--) {
      const chapterLessons = lessonsByChapter[chapters[i].id] || [];
      const hasIncomplete = chapterLessons.some(l => !attendances.some(a => a.lesson_id === l.id));
      const hasComplete = chapterLessons.some(l => attendances.some(a => a.lesson_id === l.id));
      if (hasIncomplete && hasComplete) {
        return { chapter: chapters[i], index: i };
      }
    }
    // If all complete or none started, return first incomplete chapter
    for (let i = 0; i < chapters.length; i++) {
      const chapterLessons = lessonsByChapter[chapters[i].id] || [];
      const hasIncomplete = chapterLessons.some(l => !attendances.some(a => a.lesson_id === l.id));
      if (hasIncomplete) {
        return { chapter: chapters[i], index: i };
      }
    }
    return null;
  }, [isEnrolled, chapters, lessonsByChapter, attendances]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [courseId]);

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId, user, rolesLoading]);

  // Clear access block for assistants/admins immediately
  useEffect(() => {
    if (canBypassRestrictions) {
      setAccessBlocked(null);
    }
  }, [canBypassRestrictions]);

  const fetchCourseData = async () => {
    try {
      // Fetch course by UUID or slug
      let courseData;
      let courseError;
      
      if (isUUID) {
        const result = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();
        courseData = result.data;
        courseError = result.error;
        
        // If found by UUID and has slug, redirect to slug URL (301 equivalent)
        if (courseData?.slug) {
          navigate(`/course/${courseData.slug}`, { replace: true });
          return;
        }
      } else {
        // Fetch by slug
        const result = await supabase
          .from('courses')
          .select('*')
          .eq('slug', courseId)
          .single();
        courseData = result.data;
        courseError = result.error;
      }

      if (courseError) throw courseError;
      setCourse(courseData);

      // Track ViewContent event for Facebook Pixel
      const courseName = isArabic ? courseData.title_ar : courseData.title;
      trackViewContent(courseName, courseData.id, courseData.price || 0);

      // VALIDATION: Only restrict by academic path for STUDENTS (not assistants/admins)
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('grade, academic_year, language_track')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileData) {
          setUserProfile(profileData);
        }

        // Only check academic restrictions for students
        if (profileData && !canBypassRestrictions) {
          const coursePath = parseAcademicPath(courseData.grade);
          const validation = canAccessContent(profileData, {
            grade: coursePath.grade,
            language_track: coursePath.track,
          });

          if (!validation.allowed) {
            setAccessBlocked({
              blocked: true,
              message: isArabic ? validation.messageAr : validation.message,
            });
          } else {
            setAccessBlocked(null);
          }
        } else {
          // Assistants and admins NEVER see access blocked
          setAccessBlocked(null);
        }
      }
      // Use the actual course ID (UUID) for all subsequent queries
      const actualCourseId = courseData.id;
      
      // Fetch lessons
      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', actualCourseId)
        .order('order_index');

      setLessons(lessonsData || []);

      // Fetch chapters for this course
      const { data: chaptersData } = await supabase
        .from('chapters')
        .select('*')
        .eq('course_id', actualCourseId)
        .order('order_index');

      setChapters(chaptersData || []);

      // Check enrollment and attendance
      if (user) {
        const { data: enrollment } = await supabase
          .from('course_enrollments')
          .select('id, status')
          .eq('user_id', user.id)
          .eq('course_id', actualCourseId)
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
    // Visitors: Always require login first (return to this page after)
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent(`/course/${courseId}`)}`);
      return;
    }

    // Already enrolled - just navigate to first lesson or stay on page
    if (isEnrolled) {
      // Already enrolled, no action needed
      toast({
        title: isArabic ? 'أنت مشترك بالفعل!' : 'Already Enrolled!',
        description: isArabic ? 'يمكنك البدء في مشاهدة الدروس' : 'You can start watching lessons',
      });
      return;
    }

    // VALIDATION: Block enrollment if access is blocked
    if (accessBlocked?.blocked) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'غير مسموح' : 'Not Allowed',
        description: accessBlocked.message,
      });
      return;
    }

    // Paid course - go to payment
    if (!course?.is_free && course?.price > 0) {
      navigate(`/payment/${course.id}`);
      return;
    }

    setEnrolling(true);
    try {
      // Use course.id (UUID) not courseId (could be slug)
      const { error } = await supabase
        .from('course_enrollments')
        .insert({
          user_id: user.id,
          course_id: course.id,
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
        
        // Track Subscribe event for Facebook Pixel
        trackSubscribe(course.price || 0, 'EGP');
        
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

  // Progress is now calculated via useMemo with progressData

  // Determine lesson access based on role and enrollment
  const canAccessLesson = (lessonId: string, lessonCompleted: boolean) => {
    // Assistants and admins can ALWAYS access all lessons
    if (canBypassRestrictions) return true;
    
    // Students: Block if academic path doesn't match
    if (accessBlocked?.blocked) return false;
    
    // Free courses: anyone can access
    if (course?.is_free) return true;
    
    // Paid courses: need enrollment
    if (!isEnrolled) return false;
    
    // Suspended enrollment: only completed lessons for review
    if (enrollmentStatus === 'suspended') {
      return lessonCompleted;
    }
    
    // Active enrollment: full access
    if (enrollmentStatus === 'active') return true;
    
    // Other statuses (pending, expired): no access
    return false;
  };

  if (loading) {
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
  const isPreviewCourse = isCoursePreview(course.grade);

  // Preview mode: Show informational page for students (admins/assistants bypass)
  if (isPreviewCourse && !canBypassRestrictions) {
    return (
      <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
        <Navbar />
        <main className="pt-20 pb-16">
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
                    <Badge className="bg-amber-500 text-white">
                      {isArabic ? 'قريباً' : 'Coming Soon'}
                    </Badge>
                  </div>

                  <h1 className="text-3xl md:text-4xl font-bold mb-4">
                    {isArabic ? course.title_ar : course.title}
                  </h1>
                  <p className="text-lg text-muted-foreground mb-6">
                    {isArabic ? course.description_ar : course.description}
                  </p>

                  {/* Preview Notice */}
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 mb-6">
                    <h3 className="text-lg font-semibold text-amber-700 dark:text-amber-400 mb-2">
                      {isArabic ? 'قريباً' : 'Coming Soon'}
                    </h3>
                    <p className="text-muted-foreground">
                      {isArabic 
                        ? 'هذا المحتوى قيد الإعداد وسيتم إتاحته لاحقاً. تابعنا للحصول على التحديثات!'
                        : 'This content is being prepared and will be available soon. Follow us for updates!'
                      }
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      {lessons.length} {isArabic ? 'حصة' : 'sessions'}
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      {course.duration_hours} {isArabic ? 'ساعة' : 'hours'}
                    </span>
                  </div>
                </div>

                {/* Course Image - Always show cover or fallback */}
                <div className="lg:w-80 shrink-0">
                  <img 
                    src={course.thumbnail_url || '/images/default-course-cover.svg'} 
                    alt={isArabic ? course.title_ar : course.title}
                    className={cn(
                      "w-full aspect-video object-cover rounded-2xl shadow-lg",
                      !course.thumbnail_url && "opacity-60"
                    )}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/default-course-cover.svg';
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Generate dynamic SEO for this course
  const courseTitle = isArabic ? course.title_ar : course.title;
  const courseDescription = isArabic ? course.description_ar : course.description;

  // Use slug for canonical URL (always present due to NOT NULL constraint)

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

      <main className="pt-16 pb-24">
        {/* Mobile-First Header - Back Button */}
        <div className="container mx-auto px-3 sm:px-4 py-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/courses')}
            className="gap-1.5 text-muted-foreground hover:text-foreground -mx-2"
          >
            <ArrowLeft className={cn("w-4 h-4", isRTL && "rotate-180")} />
            {isArabic ? 'الكورسات' : 'Courses'}
          </Button>
        </div>

        {/* Grade Badge - Vodafone Style */}
        <div className="container mx-auto px-3 sm:px-4 mb-3">
          <Badge variant="outline" className="text-sm px-3 py-1">
            {isArabic ? gradeInfo?.ar : gradeInfo?.en}
          </Badge>
        </div>

        {/* Course Title & Description */}
        <div className="container mx-auto px-3 sm:px-4 mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            {isArabic ? course.title_ar : course.title}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            {isArabic ? course.description_ar : course.description}
          </p>
        </div>

        {/* Course Stats Row - Compact */}
        <div className="container mx-auto px-3 sm:px-4 mb-5">
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              {lessons.length} {isArabic ? 'حصة' : 'lessons'}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {course.duration_hours} {isArabic ? 'ساعة' : 'hours'}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {isArabic ? 'ثانوية عامة' : 'Thanaweya Amma'}
            </span>
          </div>
        </div>

        {/* Access Blocked Warning */}
        {accessBlocked?.blocked && !canBypassRestrictions && (
          <div className="container mx-auto px-3 sm:px-4 mb-4">
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4">
              <p className="text-destructive font-medium text-sm">
                ⚠️ {accessBlocked.message}
              </p>
            </div>
          </div>
        )}

        {/* CTA Section - Enrollment Notice */}
        {!canBypassRestrictions && !isEnrolled && (
          <div className="container mx-auto px-3 sm:px-4 mb-5">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
              <p className="text-sm text-primary font-medium flex items-center gap-2">
                <span className="text-lg">📌</span>
                {isArabic 
                  ? 'اشترك في الكورس لفتح المحتوى والبدء في التعلم'
                  : 'Subscribe to unlock content and start learning'
                }
              </p>
            </div>
          </div>
        )}

        {/* HERO: Course Cover Image Card - Vodafone Style */}
        <div className="container mx-auto px-3 sm:px-4 mb-6">
          <div className="relative bg-gradient-to-br from-primary via-primary to-blue-700 rounded-2xl overflow-hidden shadow-lg">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
            </div>
            
            <div className="relative p-4 sm:p-5 flex gap-4">
              {/* Course Image */}
              <div className="w-28 sm:w-36 shrink-0">
                <img 
                  src={course.thumbnail_url || '/images/default-course-cover.svg'} 
                  alt={isArabic ? course.title_ar : course.title}
                  className="w-full aspect-[3/4] object-cover rounded-xl shadow-md"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/default-course-cover.svg';
                  }}
                />
              </div>
              
              {/* Course Info */}
              <div className="flex-1 flex flex-col justify-center text-white">
                <h2 className="text-lg sm:text-xl font-bold mb-1">
                  {isArabic ? 'كيمياء' : 'Chemistry'}
                </h2>
                <p className="text-white/90 text-sm mb-2">
                  {isArabic ? gradeInfo?.ar : gradeInfo?.en}
                </p>
                <p className="text-white/80 text-xs sm:text-sm font-medium mb-1">
                  {isArabic ? 'مستر حسام فكري' : 'Mr. Hossam Fekry'}
                </p>
                <p className="text-white/70 text-xs">
                  DMT {isArabic ? 'المجال في الكيمياء' : 'Chemistry Expert'}
                </p>
                
                {/* Course Type Badge */}
                <div className="mt-3">
                  <span className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
                    {course.is_free 
                      ? (isArabic ? 'كورس مجاني' : 'Free Course')
                      : (isArabic ? 'كورس كامل' : 'Full Course')
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ENROLLED STUDENT: Progress & Continue Section */}
        {isEnrolled && !canBypassRestrictions && (
          <div className="container mx-auto px-3 sm:px-4 mb-6">
            <div className="bg-card border rounded-2xl p-4 space-y-4">
              {/* Enrollment Status */}
              <div className="flex items-center gap-2">
                <Badge className="bg-green-600 text-white gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isArabic ? 'مشترك' : 'Enrolled'}
                </Badge>
                {enrollmentStatus === 'pending' && (
                  <Badge variant="secondary">
                    {isArabic ? 'في انتظار التفعيل' : 'Pending Activation'}
                  </Badge>
                )}
              </div>
              
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">{isArabic ? 'تقدمك في الكورس' : 'Your Progress'}</span>
                  <span className="font-semibold">{progressData.completed}/{progressData.total} {isArabic ? 'حصة' : 'lessons'}</span>
                </div>
                <Progress value={progressData.percent} className="h-2.5" />
              </div>
              
              {/* Continue Learning CTA */}
              {lastAccessedChapter && (
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-2">
                    {isArabic ? 'استكمل من حيث توقفت:' : 'Continue where you left off:'}
                  </p>
                  <Button 
                    className="w-full gap-2"
                    onClick={() => {
                      // Scroll to the chapter section
                      const chapterEl = document.getElementById(`chapter-${lastAccessedChapter.chapter.id}`);
                      if (chapterEl) {
                        chapterEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                  >
                    <Play className="w-4 h-4" />
                    {isArabic 
                      ? `الباب ${lastAccessedChapter.index + 1}: ${lastAccessedChapter.chapter.title_ar}`
                      : `Chapter ${lastAccessedChapter.index + 1}: ${lastAccessedChapter.chapter.title}`
                    }
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PAYMENT SECTION - For Non-Enrolled Users (Paid Courses) */}
        {!isEnrolled && !canBypassRestrictions && !course.is_free && (
          <div className="container mx-auto px-3 sm:px-4 mb-6">
            <div className="bg-card border-2 border-primary/20 rounded-2xl overflow-hidden">
              {/* Price Header */}
              <div className="bg-primary/5 p-4 flex items-center justify-between">
                <span className="text-muted-foreground font-medium">
                  {isArabic ? 'سعر الاشتراك' : 'Subscription Price'}
                </span>
                <div className="text-2xl font-bold text-primary">
                  {course.price} <span className="text-base font-medium">{isArabic ? 'ج.م' : 'EGP'}</span>
                </div>
              </div>
              
              {/* Benefits List */}
              <div className="p-4 space-y-4">
                <div>
                  <p className="text-sm font-semibold mb-3">
                    {isArabic ? 'الاشتراك يشمل:' : 'Subscription includes:'}
                  </p>
                  <ul className="space-y-2.5">
                    <li className="flex items-center gap-3 text-sm">
                      <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                      </div>
                      <span>{lessons.length} {isArabic ? 'حصة فيديو' : 'video lessons'}</span>
                    </li>
                    <li className="flex items-center gap-3 text-sm">
                      <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                      </div>
                      <span>{isArabic ? 'امتحانات على كل باب' : 'Chapter exams'}</span>
                    </li>
                    <li className="flex items-center gap-3 text-sm">
                      <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                      </div>
                      <span>{isArabic ? 'متابعة التقدم والأداء' : 'Progress tracking'}</span>
                    </li>
                    <li className="flex items-center gap-3 text-sm">
                      <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                      </div>
                      <span>{isArabic ? 'دعم مباشر عبر واتساب' : 'Direct WhatsApp support'}</span>
                    </li>
                  </ul>
                </div>
                
                {/* Payment Methods */}
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-2">
                    {isArabic ? 'طرق الدفع:' : 'Payment Methods:'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">
                      {isArabic ? 'فودافون كاش' : 'Vodafone Cash'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {isArabic ? 'إنستاباي' : 'InstaPay'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {isArabic ? 'تحويل بنكي' : 'Bank Transfer'}
                    </Badge>
                  </div>
                </div>
                
                {/* WhatsApp CTA */}
                <a
                  href={`https://wa.me/201000000000?text=${encodeURIComponent(
                    isArabic 
                      ? `مرحباً، أريد الاشتراك في كورس: ${course.title_ar}`
                      : `Hello, I want to enroll in course: ${course.title}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-xl font-medium transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  {isArabic ? 'تواصل عبر واتساب للاشتراك' : 'Contact via WhatsApp'}
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Main CTA Button - Fixed Bottom for Mobile */}
        {!isEnrolled && !canBypassRestrictions && (
          <div className="container mx-auto px-3 sm:px-4 mb-6">
            <Button 
              size="lg" 
              onClick={handleEnroll}
              disabled={enrolling || accessBlocked?.blocked}
              className="w-full h-12 text-base font-semibold"
            >
              {accessBlocked?.blocked ? (
                isArabic ? 'غير متاح لمرحلتك' : 'Not Available for Your Grade'
              ) : enrolling ? (
                isArabic ? 'جاري التحميل...' : 'Loading...'
              ) : !user ? (
                <>{isArabic ? 'سجّل حسابك وابدأ الكورس' : 'Create Account & Start'}</>
              ) : course.is_free ? (
                <>{isArabic ? 'ابدأ الكورس المجاني' : 'Start Free Course'}</>
              ) : (
                <>{isArabic ? 'اشترك الآن' : 'Subscribe Now'}</>
              )}
            </Button>
          </div>
        )}

        {/* ADMIN/ASSISTANT: Management View */}
        {canBypassRestrictions && (
          <div className="container mx-auto px-3 sm:px-4 mb-6">
            <div className="bg-secondary/50 border rounded-xl p-4 space-y-3">
              <Badge className="bg-secondary text-secondary-foreground">
                {isArabic ? 'عرض المدرس' : 'Teacher View'}
              </Badge>
              {isPreviewCourse && (
                <Badge className="bg-amber-500 text-white mx-2">
                  {isArabic ? 'معاينة' : 'Preview'}
                </Badge>
              )}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button 
                  size="sm"
                  onClick={() => navigate('/assistant/lessons')}
                  className="gap-1.5"
                >
                  <BookOpen className="w-4 h-4" />
                  {isArabic ? 'إدارة الحصص' : 'Manage Lessons'}
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/assistant/courses')}
                >
                  {isArabic ? 'إدارة الكورسات' : 'Manage Courses'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Lessons List - Course Content Section */}
        <div className="container mx-auto px-3 sm:px-4 py-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">
            {isArabic ? 'محتوى الكورس' : 'Course Content'}
          </h2>

          {/* Guidance for students */}
          {isEnrolled && visibleLessons.length > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-5">
              <p className="text-sm text-muted-foreground">
                {isArabic 
                  ? '💡 كمّل كل حصص الباب علشان يفتح الامتحان'
                  : '💡 Complete all chapter lessons to unlock the chapter exam'
                }
              </p>
            </div>
          )}

          {/* Chapter-grouped lessons with exam sections */}
          <div className="space-y-6">
            {chapters.length > 0 ? (
              <>
                {chapters.map((chapter, chapterIndex) => {
                  const chapterLessons = lessonsByChapter[chapter.id] || [];
                  const chapterProgressData = getChapterProgress(chapter.id);
                  const chapterExam = chapterExams[chapter.id];
                  const chapterExamAttempt = examAttempts[chapter.id];
                  const canAccessExam = canAccessChapterExam(chapter.id);

                  if (chapterLessons.length === 0) return null;

                  return (
                    <div key={chapter.id} id={`chapter-${chapter.id}`} className="space-y-3">
                      {/* Chapter Header */}
                      <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Layers className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold truncate">
                            {isArabic ? `الباب ${chapterIndex + 1}: ${chapter.title_ar}` : `Chapter ${chapterIndex + 1}: ${chapter.title}`}
                          </h3>
                          {chapterProgressData && (
                            <p className="text-xs text-muted-foreground">
                              {chapterProgressData.completedLessons}/{chapterProgressData.totalLessons} {isArabic ? 'حصة مكتملة' : 'completed'}
                              {chapterProgressData.isComplete && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 inline-block mx-1" />
                              )}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Chapter Lessons - Compact Mobile Style */}
                      <div className="space-y-2">
                        {chapterLessons.map((lesson, index) => {
                          const completed = isLessonCompleted(lesson.id);
                          const canAccess = canAccessLesson(lesson.id, completed);
                          const hasVideo = hasValidVideo(lesson.video_url);

                          return (
                            <div
                              key={lesson.id}
                              className={cn(
                                "flex items-center gap-3 p-3 bg-card border rounded-xl transition-all",
                                canAccess && hasVideo ? "hover:border-primary/50 cursor-pointer active:scale-[0.99]" : "opacity-60"
                              )}
                              onClick={() => canAccess && hasVideo && navigate(`/lesson/${lesson.short_id}`)}
                            >
                              {/* Lesson Number */}
                              <div className={cn(
                                "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                                completed 
                                  ? "bg-green-500 text-white" 
                                  : canAccess && hasVideo
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted text-muted-foreground"
                              )}>
                                {completed ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                              </div>

                              {/* Lesson Info */}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">
                                  {isArabic ? lesson.title_ar : lesson.title}
                                </h4>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {lesson.duration_minutes} {isArabic ? 'دقيقة' : 'min'}
                                  </span>
                                  {!hasVideo && (
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                      {isArabic ? 'قريباً' : 'Soon'}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* Action Icon */}
                              <div className="shrink-0">
                                {!hasVideo ? (
                                  <Lock className="w-4 h-4 text-muted-foreground/50" />
                                ) : canAccess ? (
                                  completed ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <Play className="w-5 h-5 text-primary" />
                                  )
                                ) : (
                                  <Lock className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Chapter Exam Section */}
                      {chapterExam && (
                        <div className="mr-6">
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

                {/* Uncategorized lessons (lessons without chapter) */}
                {lessonsByChapter.uncategorized.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold">
                      {isArabic ? 'حصص إضافية' : 'Additional Lessons'}
                    </h3>
                    <div className="space-y-3">
                      {lessonsByChapter.uncategorized.map((lesson, index) => {
                        const completed = isLessonCompleted(lesson.id);
                        const canAccess = canAccessLesson(lesson.id, completed);
                        const hasVideo = hasValidVideo(lesson.video_url);

                        return (
                          <div
                            key={lesson.id}
                            className={cn(
                              "flex items-center gap-4 p-4 bg-card border rounded-xl transition-all",
                              canAccess && hasVideo ? "hover:border-primary/50 cursor-pointer" : "opacity-60"
                            )}
                            onClick={() => canAccess && hasVideo && navigate(`/lesson/${lesson.short_id}`)}
                          >
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                              completed 
                                ? "bg-green-500 text-white" 
                                : canAccess && hasVideo
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                            )}>
                              {completed ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold truncate">
                                {isArabic ? lesson.title_ar : lesson.title}
                              </h3>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {lesson.duration_minutes} {isArabic ? 'دقيقة' : 'min'}
                                </span>
                              </div>
                            </div>
                            <div className="shrink-0">
                              {!hasVideo ? (
                                <Badge variant="outline" className="text-muted-foreground">
                                  {isArabic ? 'قريباً' : 'Soon'}
                                </Badge>
                              ) : canAccess ? (
                                <Button size="sm" variant={completed ? "secondary" : "default"}>
                                  {completed ? (isArabic ? 'مراجعة' : 'Review') : (
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
                  </div>
                )}
              </>
            ) : (
              /* Fallback: Show lessons without chapter grouping */
              <div className="space-y-3">
                {visibleLessons.map((lesson, index) => {
                  const completed = isLessonCompleted(lesson.id);
                  const canAccess = canAccessLesson(lesson.id, completed);
                  const hasVideo = hasValidVideo(lesson.video_url);

                  return (
                    <div
                      key={lesson.id}
                      className={cn(
                        "flex items-center gap-4 p-4 bg-card border rounded-xl transition-all",
                        canAccess && hasVideo ? "hover:border-primary/50 cursor-pointer" : "opacity-60"
                      )}
                      onClick={() => canAccess && hasVideo && navigate(`/lesson/${lesson.short_id}`)}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                        completed 
                          ? "bg-green-500 text-white" 
                          : canAccess && hasVideo
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {completed ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">
                          {isArabic ? lesson.title_ar : lesson.title}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {lesson.duration_minutes} {isArabic ? 'دقيقة' : 'min'}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {!hasVideo ? (
                          <Badge variant="outline" className="text-muted-foreground">
                            {isArabic ? 'قريباً' : 'Soon'}
                          </Badge>
                        ) : canAccess ? (
                          <Button size="sm" variant={completed ? "secondary" : "default"}>
                            {completed ? (isArabic ? 'مراجعة' : 'Review') : (
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
            )}
          </div>

          {lessons.length === 0 && (
            <div className="text-center py-12 bg-card border rounded-xl">
              <BookOpen className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {isArabic ? 'لم يتم إضافة حصص بعد' : 'No Lessons Added Yet'}
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {isArabic 
                  ? 'المحتوى لم يتم تفعيله بعد. تابعنا للحصول على التحديثات!'
                  : 'Content is not yet activated. Follow us for updates!'}
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
