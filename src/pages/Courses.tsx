import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, Filter, Search, BookOpen, CheckCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ContentTypeBadge } from '@/components/course/ContentTypeBadge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { canAccessContent, parseAcademicPath, combineAcademicPath } from '@/lib/academicValidation';
import { filterCoursesForStudents, ACTIVE_SCOPE, isCoursePreview } from '@/lib/contentVisibility';

const GRADE_OPTIONS: Record<string, { ar: string; en: string }> = {
  'second_arabic': { ar: 'تانية ثانوي عربي', en: '2nd Secondary - Arabic' },
  'second_languages': { ar: 'تانية ثانوي لغات', en: '2nd Secondary - Languages' },
  'third_arabic': { ar: 'تالته ثانوي عربي', en: '3rd Secondary - Arabic' },
  'third_languages': { ar: 'تالته ثانوي لغات', en: '3rd Secondary - Languages' },
};

interface Course {
  id: string;
  title: string;
  title_ar: string;
  description: string | null;
  description_ar: string | null;
  grade: string;
  thumbnail_url: string | null;
  price: number;
  is_free: boolean;
  lessons_count: number;
  duration_hours: number;
}

interface Enrollment {
  course_id: string;
  progress: number;
}

const Courses: React.FC = () => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const { loading: rolesLoading, isAdmin, isAssistantTeacher } = useUserRole();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isArabic = language === 'ar';
  const canBypassAcademicRestrictions = !!user && !rolesLoading && (isAdmin() || isAssistantTeacher());

  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [userProfile, setUserProfile] = useState<{ grade: string | null; academic_year: string | null; language_track: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [showFreeOnly, setShowFreeOnly] = useState(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch user profile and courses
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch courses
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('*')
          .order('created_at', { ascending: false });

        if (coursesError) throw coursesError;
        setCourses(coursesData || []);

        // Fetch user profile and enrollments if logged in
        if (user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('grade, academic_year, language_track')
            .eq('user_id', user.id)
            .maybeSingle();

          if (profileData) {
            setUserProfile(profileData);
          }

          const { data: enrollmentsData } = await supabase
            .from('course_enrollments')
            .select('course_id, progress')
            .eq('user_id', user.id);

          setEnrollments(enrollmentsData || []);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleCourseAction = (courseId: string, isFree: boolean, price: number, courseGrade: string) => {
    // Assistant teachers and admins go directly to course management
    if (canBypassAcademicRestrictions) {
      navigate(`/course/${courseId}`);
      return;
    }

    // Check if course is in preview mode (not enrollable)
    if (isCoursePreview(courseGrade)) {
      navigate(`/course/${courseId}`);
      return;
    }

    // Not logged in - redirect to auth
    if (!user) {
      toast({
        title: isArabic ? 'يرجى تسجيل الدخول' : 'Please sign in',
        description: isArabic ? 'يجب تسجيل الدخول للاشتراك في الكورس' : 'You need to sign in to enroll in a course',
      });
      navigate(`/auth?redirect=${encodeURIComponent(`/course/${courseId}`)}`);
      return;
    }

    // Already enrolled - go to course
    if (isEnrolled(courseId)) {
      navigate(`/course/${courseId}`);
      return;
    }

    // VALIDATION: Check academic path restrictions for students only
    if (userProfile) {
      const coursePath = parseAcademicPath(courseGrade);
      const validation = canAccessContent(userProfile, {
        grade: coursePath.grade,
        language_track: coursePath.track,
      });

      if (!validation.allowed) {
        toast({
          variant: 'destructive',
          title: isArabic ? 'غير مسموح' : 'Not Allowed',
          description: isArabic ? validation.messageAr : validation.message,
        });
        return;
      }
    }

    // If paid course, redirect to payment page
    if (!isFree && price > 0) {
      navigate(`/payment/${courseId}`);
      return;
    }

    // Free course - enroll directly
    handleFreeEnroll(courseId);
  };

  const handleFreeEnroll = async (courseId: string) => {
    if (!user) return;
    
    setEnrollingId(courseId);
    try {
      const { error } = await supabase
        .from('course_enrollments')
        .insert({
          user_id: user.id,
          course_id: courseId,
          status: 'active', // Free courses are auto-active
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: isArabic ? 'مشترك بالفعل' : 'Already enrolled',
            description: isArabic ? 'أنت مشترك في هذا الكورس بالفعل' : 'You are already enrolled in this course',
          });
          // Navigate to course anyway
          navigate(`/course/${courseId}`);
        } else {
          throw error;
        }
      } else {
        setEnrollments([...enrollments, { course_id: courseId, progress: 0 }]);
        toast({
          title: isArabic ? 'تم الاشتراك!' : 'Enrolled!',
          description: isArabic ? 'تم الاشتراك في الكورس بنجاح' : 'Successfully enrolled in the course',
        });
        // Navigate to course after enrollment
        navigate(`/course/${courseId}`);
      }
    } catch (err) {
      console.error('Error enrolling:', err);
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'فشل في الاشتراك، حاول مرة أخرى' : 'Failed to enroll, please try again',
      });
    } finally {
      setEnrollingId(null);
    }
  };

  const isEnrolled = (courseId: string) => {
    return enrollments.some(e => e.course_id === courseId);
  };

  // Get the user's combined grade for filtering
  const userGrade = userProfile?.grade || 
    (userProfile?.academic_year && userProfile?.language_track 
      ? combineAcademicPath(userProfile.academic_year, userProfile.language_track) 
      : null);

  // Filter courses by active scope (students only see active scope courses)
  const scopedCourses = filterCoursesForStudents(courses, {
    bypassScope: canBypassAcademicRestrictions,
  });

  // Filter and sort courses (free courses first for marketing)
  const filteredCourses = scopedCourses
    .filter(course => {
      const matchesSearch = 
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.title_ar.includes(searchQuery);
      
      const matchesGrade = selectedGrade === 'all' || course.grade === selectedGrade;
      const matchesFree = !showFreeOnly || course.is_free;
      
      return matchesSearch && matchesGrade && matchesFree;
    })
    .sort((a, b) => {
      // Free courses always first
      if (a.is_free && !b.is_free) return -1;
      if (!a.is_free && b.is_free) return 1;
      return 0;
    });

  // Separate user's grade courses and others (maintaining free-first order)
  const userGradeCourses = userGrade 
    ? filteredCourses.filter(c => c.grade === userGrade)
    : [];
  const otherCourses = userGrade
    ? filteredCourses.filter(c => c.grade !== userGrade)
    : filteredCourses;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8 animate-fade-in-up">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('courses.title')}
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              {isArabic 
                ? 'اختر من مجموعة واسعة من الكورسات المصممة خصيصًا في الكيمياء عربي ولغات لطلاب الثانوية العامة'
                : 'Choose from a wide range of Chemistry courses designed specifically for Arabic and Languages track Thanaweya Amma students'
              }
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8 animate-fade-in-up animation-delay-100">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                placeholder={isArabic ? 'ابحث عن كورس...' : 'Search courses...'} 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="h-10 px-3 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">{isArabic ? 'كل المراحل' : 'All Grades'}</option>
              {Object.entries(GRADE_OPTIONS).map(([value, labels]) => (
                <option key={value} value={value}>
                  {isArabic ? labels.ar : labels.en}
                </option>
              ))}
            </select>

            <Button 
              variant={showFreeOnly ? 'default' : 'outline'} 
              className="gap-2"
              onClick={() => setShowFreeOnly(!showFreeOnly)}
            >
              <Filter className="w-4 h-4" />
              {isArabic ? 'المجانية فقط' : 'Free Only'}
            </Button>
          </div>

          {/* User's Grade Courses */}
          {userGrade && userGradeCourses.length > 0 && selectedGrade === 'all' && (
            <div className="mb-12 animate-fade-in-up animation-delay-200">
              <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                {isArabic ? 'كورسات مرحلتك الدراسية' : 'Courses for Your Grade'}
                <Badge variant="secondary" className="mr-2">
                  {isArabic ? GRADE_OPTIONS[userGrade]?.ar : GRADE_OPTIONS[userGrade]?.en}
                </Badge>
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userGradeCourses.map((course, index) => (
                  <CourseCard 
                    key={course.id}
                    course={course}
                    isArabic={isArabic}
                    isEnrolled={isEnrolled(course.id)}
                    enrollingId={enrollingId}
                    onAction={handleCourseAction}
                    index={index}
                    t={t}
                    isAssistantOrAdmin={canBypassAcademicRestrictions}
                    isPreview={isCoursePreview(course.grade)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All/Other Courses */}
          <div className="animate-fade-in-up animation-delay-300">
            {userGrade && userGradeCourses.length > 0 && selectedGrade === 'all' && otherCourses.length > 0 && (
              <h2 className="text-xl font-bold text-foreground mb-6">
                {isArabic ? 'كورسات أخرى' : 'Other Courses'}
              </h2>
            )}
            
            {(selectedGrade !== 'all' || !userGrade || userGradeCourses.length === 0) && filteredCourses.length === 0 && (
              <div className="text-center py-16">
                <BookOpen className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {isArabic ? 'لا توجد كورسات' : 'No courses found'}
                </h3>
                <p className="text-muted-foreground">
                  {isArabic ? 'جرب تغيير فلاتر البحث' : 'Try changing your search filters'}
                </p>
              </div>
            )}
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(selectedGrade === 'all' && userGrade ? otherCourses : filteredCourses).map((course, index) => (
                <CourseCard 
                  key={course.id}
                  course={course}
                  isArabic={isArabic}
                  isEnrolled={isEnrolled(course.id)}
                  enrollingId={enrollingId}
                  onAction={handleCourseAction}
                  index={index}
                  t={t}
                  isAssistantOrAdmin={canBypassAcademicRestrictions}
                  isPreview={isCoursePreview(course.grade)}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

interface CourseCardProps {
  course: Course;
  isArabic: boolean;
  isEnrolled: boolean;
  enrollingId: string | null;
  onAction: (courseId: string, isFree: boolean, price: number, courseGrade: string) => void;
  index: number;
  t: (key: string) => string;
  isAssistantOrAdmin?: boolean;
  isPreview?: boolean;
}

const CourseCard: React.FC<CourseCardProps> = ({ 
  course, 
  isArabic, 
  isEnrolled, 
  enrollingId, 
  onAction, 
  index,
  t,
  isAssistantOrAdmin = false,
  isPreview = false
}) => {
  const gradeInfo = GRADE_OPTIONS[course.grade];
  
  return (
    <div 
      className={cn(
        "group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-fade-in-up",
        `animation-delay-${((index % 3) + 1) * 100}`
      )}
    >
      {/* Image/Header */}
      <div className={cn(
        "relative h-40 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center",
        isPreview && "opacity-75"
      )}>
        <BookOpen className="w-16 h-16 text-primary/50" />
        
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent" />
        
        {/* Preview Badge - "قريباً" for upcoming courses */}
        {isPreview && !isAssistantOrAdmin && (
          <Badge className="absolute top-3 left-3 bg-amber-500 text-white gap-1">
            {isArabic ? 'قريباً' : 'Coming Soon'}
          </Badge>
        )}
        
        {/* Free/Paid Badge - only show for active courses */}
        {!isPreview && (
          <div className="absolute top-3 left-3">
            <ContentTypeBadge isFree={course.is_free} />
          </div>
        )}
        
        {/* Show enrolled badge for students only, not for assistants/admins */}
        {isEnrolled && !isAssistantOrAdmin && !isPreview && (
          <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground gap-1">
            <CheckCircle className="w-3 h-3" />
            {isArabic ? 'مشترك' : 'Enrolled'}
          </Badge>
        )}
        
        {/* Show management badge for assistants/admins */}
        {isAssistantOrAdmin && (
          <Badge className="absolute top-3 right-3 bg-secondary text-secondary-foreground gap-1">
            {isArabic ? 'مدرس' : 'Teacher'}
          </Badge>
        )}
        
        {/* Show preview indicator for assistants/admins on preview courses */}
        {isAssistantOrAdmin && isPreview && (
          <Badge className="absolute top-3 left-3 bg-amber-500 text-white gap-1">
            {isArabic ? 'معاينة' : 'Preview'}
          </Badge>
        )}
        
        {!isEnrolled && !isAssistantOrAdmin && !course.is_free && !isPreview && (
          <Badge variant="secondary" className="absolute bottom-3 left-3 text-lg font-bold">
            {course.price} {isArabic ? 'ج.م' : 'EGP'}
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <Badge variant="outline" className="mb-3 text-xs">
          {isArabic ? gradeInfo?.ar : gradeInfo?.en}
        </Badge>
        
        <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-1">
          {isArabic ? course.title_ar : course.title}
        </h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {isArabic ? course.description_ar : course.description}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {course.duration_hours} {isArabic ? 'ساعة' : 'hrs'}
          </div>
          <div className="flex items-center gap-1">
            <Play className="w-4 h-4" />
            {course.lessons_count} {isArabic ? 'حصة' : 'sessions'}
          </div>
        </div>

        {/* CTA - Different behavior based on role and preview status */}
        {isAssistantOrAdmin ? (
          // Assistant/Admin: Always show "View Course" - no enrollment needed
          <Button 
            variant="default" 
            className="w-full gap-2"
            onClick={() => onAction(course.id, course.is_free, course.price, course.grade)}
          >
            <BookOpen className="w-4 h-4" />
            {isArabic ? 'عرض الكورس' : 'View Course'}
          </Button>
        ) : isPreview ? (
          // Preview course: Show "View Details" - goes to preview page
          <Button 
            variant="secondary" 
            className="w-full gap-2"
            onClick={() => onAction(course.id, course.is_free, course.price, course.grade)}
          >
            <BookOpen className="w-4 h-4" />
            {isArabic ? 'عرض التفاصيل' : 'View Details'}
          </Button>
        ) : isEnrolled ? (
          // Enrolled student: Continue learning
          <Button variant="default" className="w-full gap-2" asChild>
            <Link to={`/course/${course.id}`}>
              <Play className="w-4 h-4" />
              {isArabic ? 'متابعة التعلم' : 'Continue Learning'}
            </Link>
          </Button>
        ) : (
          // Not enrolled student: Enroll button
          <Button 
            variant="default"
            className="w-full"
            onClick={() => onAction(course.id, course.is_free, course.price, course.grade)}
            disabled={enrollingId === course.id}
          >
            {enrollingId === course.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : course.is_free ? (
              isArabic ? 'اشترك مجاناً' : 'Enroll Free'
            ) : (
              isArabic ? 'اشترك الآن' : 'Enroll Now'
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default Courses;