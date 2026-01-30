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
  Layers,
  Sparkles
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import VisitorPaymentBox from '@/components/course/VisitorPaymentBox';
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

    // Paid course - contact via WhatsApp (no separate payment page)
    if (!course?.is_free && course?.price > 0) {
      const courseName = isArabic ? course.title_ar : course.title;
      const message = encodeURIComponent(
        `مرحباً، أريد الاشتراك في كورس: ${courseName}\nالسعر: ${course.price} ج.م\nمنصة حسام فكري التعليمية`
      );
      window.open(`https://wa.me/2001225565645?text=${message}`, '_blank');
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
        
        // Send enrollment confirmation notification (non-blocking via SSOT)
        import('@/lib/notificationService').then(({ notifyEnrollmentConfirmed }) => {
          notifyEnrollmentConfirmed(user.id, course.title_ar, course.id);
        }).catch(() => {});
        
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
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'} style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
      <SEOHead 
        title={`${course.title} – Hossam Fekry Platform`}
        titleAr={`${course.title_ar} – منصة حسام فكري`}
        description={course.description || `Chemistry course for ${gradeInfo?.en || 'Thanaweya Amma'} students`}
        descriptionAr={course.description_ar || `كورس كيمياء لطلاب ${gradeInfo?.ar || 'الثانوية العامة'}`}
        canonical={`https://hossamfekry.com/course/${course.slug}`}
        ogImage={course.thumbnail_url || '/favicon.jpg'}
      />
      <Navbar />

      <main className="pt-16 pb-24 max-w-6xl mx-auto content-appear">
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

        {/* CTA Section - Enrollment Notice (ONLY if not blocked) */}
        {!canBypassRestrictions && !isEnrolled && !accessBlocked?.blocked && (
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

        {/* HERO: Course Cover Image - Landscape 16:9, constrained for desktop */}
        <div className="container mx-auto px-3 sm:px-4 mb-4 max-w-4xl">
          <div className="relative rounded-2xl overflow-hidden shadow-lg">
            <img 
              src={course.thumbnail_url || '/images/default-course-cover.svg'} 
              alt={isArabic ? course.title_ar : course.title}
              className="w-full aspect-video object-cover max-h-80 lg:max-h-96"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/default-course-cover.svg';
              }}
            />
            {/* Gradient Overlay for text readability if needed */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </div>
        </div>

        {/* Chemistry Branding Card - حسام فكري */}
        <div className="container mx-auto px-3 sm:px-4 mb-6 max-w-4xl">
          <div className="relative bg-primary rounded-2xl overflow-hidden shadow-lg">
            {/* Chemistry Pattern Background */}
            <div className="absolute inset-0 opacity-[0.08]">
              {/* Molecule shapes */}
              <svg className="absolute top-2 right-4 w-16 h-16 text-white" viewBox="0 0 100 100" fill="currentColor">
                <circle cx="50" cy="20" r="8" />
                <circle cx="30" cy="50" r="8" />
                <circle cx="70" cy="50" r="8" />
                <circle cx="50" cy="80" r="8" />
                <line x1="50" y1="28" x2="35" y2="45" stroke="currentColor" strokeWidth="3" />
                <line x1="50" y1="28" x2="65" y2="45" stroke="currentColor" strokeWidth="3" />
                <line x1="35" y1="55" x2="50" y2="72" stroke="currentColor" strokeWidth="3" />
                <line x1="65" y1="55" x2="50" y2="72" stroke="currentColor" strokeWidth="3" />
              </svg>
              <svg className="absolute bottom-3 left-6 w-12 h-12 text-white" viewBox="0 0 100 100" fill="currentColor">
                <circle cx="25" cy="50" r="10" />
                <circle cx="75" cy="50" r="10" />
                <line x1="35" y1="50" x2="65" y2="50" stroke="currentColor" strokeWidth="4" />
              </svg>
              {/* Hexagon pattern */}
              <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 text-white opacity-50" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
                <polygon points="50,5 90,25 90,65 50,85 10,65 10,25" />
                <polygon points="50,20 75,35 75,55 50,70 25,55 25,35" />
              </svg>
            </div>
            
            {/* Content */}
            <div className="relative p-4 sm:p-5">
              <div className="flex items-center gap-4">
                {/* Chemistry Icon */}
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 3h6v7l4 8a2 2 0 0 1-1.8 2.9H6.8A2 2 0 0 1 5 18l4-8V3z" />
                    <path d="M9 3h6" />
                    <circle cx="12" cy="16" r="1" fill="currentColor" />
                    <circle cx="9" cy="14" r="0.5" fill="currentColor" />
                    <circle cx="15" cy="15" r="0.5" fill="currentColor" />
                  </svg>
                </div>
                
                {/* Course Info */}
                <div className="flex-1 text-white">
                  <h2 className="text-lg sm:text-xl font-bold mb-0.5">
                    {isArabic ? 'كيمياء' : 'Chemistry'}
                  </h2>
                  <p className="text-white/90 text-sm">
                    {isArabic ? gradeInfo?.ar : gradeInfo?.en}
                  </p>
                </div>
                
                {/* Course Badge */}
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium text-white shrink-0">
                  {course.is_free 
                    ? (isArabic ? 'مجاني' : 'Free')
                    : (isArabic ? 'كورس كامل' : 'Full Course')
                  }
                </span>
              </div>
              
              {/* Teacher Info */}
              <div className="mt-3 pt-3 border-t border-white/15">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">HF</span>
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">
                      {isArabic ? 'مستر حسام فكري' : 'Mr. Hossam Fekry'}
                    </p>
                    <p className="text-white/70 text-xs">
                      DMT {isArabic ? '• خبير في الكيمياء' : '• Chemistry Expert'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ENROLLED STUDENT: Progress & Continue Section */}
        {isEnrolled && !canBypassRestrictions && (
          <div className="container mx-auto px-3 sm:px-4 mb-6 lg:max-w-3xl">
            <div className="bg-card border rounded-2xl p-4 lg:p-5 space-y-4">
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
                    className="w-full lg:w-auto lg:px-8 gap-2"
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

        {/* PAYMENT SECTION - For Non-Enrolled Users (Paid Courses) - ONLY if not blocked */}
        {!isEnrolled && !canBypassRestrictions && !course.is_free && !accessBlocked?.blocked && (
          <div className="container mx-auto px-3 sm:px-4 mb-6 lg:max-w-2xl">
            <VisitorPaymentBox 
              coursePrice={course.price || 400}
              courseTitle={course.title_ar}
              isArabic={isArabic}
            />
          </div>
        )}

        {/* Main CTA Button - ONLY if not blocked */}
        {!isEnrolled && !canBypassRestrictions && !accessBlocked?.blocked && (
          <div className="container mx-auto px-3 sm:px-4 mb-6 lg:max-w-md lg:mx-auto">
            <Button 
              size="lg" 
              onClick={handleEnroll}
              disabled={enrolling}
              className="w-full h-12 lg:h-11 text-base font-semibold"
            >
              {enrolling ? (
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

                    // Check if this is an intro/basics chapter
                    const isIntroChapter = chapter.title_ar?.includes('أساسيات') || 
                                           chapter.title?.toLowerCase().includes('basics') ||
                                           chapter.title?.toLowerCase().includes('intro');

                    return (
                    <div key={chapter.id} id={`chapter-${chapter.id}`} className="space-y-3">
                      {/* Chapter Header */}
                      <div className={cn(
                        "flex items-center gap-3 rounded-md p-3",
                        isIntroChapter 
                          ? "bg-amber-500/10 border border-amber-500/20" 
                          : "bg-muted/50"
                      )}>
                        <div className={cn(
                          "w-9 h-9 rounded-md flex items-center justify-center shrink-0",
                          isIntroChapter 
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" 
                            : "bg-primary/10 text-primary"
                        )}>
                          {isIntroChapter ? (
                            <Sparkles className="w-4 h-4" />
                          ) : (
                            <Layers className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={cn(
                            "text-base font-bold truncate",
                            isIntroChapter && "text-amber-700 dark:text-amber-300"
                          )}>
                            {(() => {
                              if (isIntroChapter) {
                                return isArabic ? chapter.title_ar : chapter.title;
                              }
                              
                              // Count only non-intro chapters before this one for proper numbering
                              const introChaptersCount = chapters
                                .slice(0, chapterIndex)
                                .filter(c => 
                                  c.title_ar?.includes('أساسيات') || 
                                  c.title?.toLowerCase().includes('basics') ||
                                  c.title?.toLowerCase().includes('intro')
                                ).length;
                              
                              const displayNumber = chapterIndex + 1 - introChaptersCount;
                              return isArabic 
                                ? `الباب ${displayNumber}: ${chapter.title_ar}` 
                                : `Chapter ${displayNumber}: ${chapter.title}`;
                            })()}
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
