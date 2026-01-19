import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, Search, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CourseCard } from '@/components/course/CourseCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { canAccessContent, parseAcademicPath, combineAcademicPath } from '@/lib/academicValidation';
import { filterCoursesForStudents, isCoursePreview } from '@/lib/contentVisibility';
import { SEOHead } from '@/components/seo/SEOHead';
import { useEngagementSafe } from '@/components/consent';
import { cn } from '@/lib/utils';
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
  is_primary: boolean;
  lessons_count: number;
  duration_hours: number;
  slug: string | null;
  is_hidden?: boolean;
  enrolled_count?: number;
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
  const engagement = useEngagementSafe();

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

  const fetchData = async () => {
    try {
      // Fetch courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (coursesError) throw coursesError;
      
      let courses = coursesData || [];

      // Fetch enrollment counts for all courses
      if (courses.length > 0) {
        const courseIds = courses.map(c => c.id);
        const { data: enrollmentCounts } = await supabase
          .from('course_enrollments')
          .select('course_id')
          .in('course_id', courseIds);
        
        // Count enrollments per course
        const countMap = new Map<string, number>();
        (enrollmentCounts || []).forEach(e => {
          countMap.set(e.course_id, (countMap.get(e.course_id) || 0) + 1);
        });
        
        // Add enrolled_count to each course
        courses = courses.map(course => ({
          ...course,
          enrolled_count: countMap.get(course.id) || 0
        }));
      }
      
      setCourses(courses);

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

  // Fetch user profile and courses with realtime updates
  useEffect(() => {
    fetchData();

    // Subscribe to realtime enrollment changes
    const channel = supabase
      .channel('courses-enrollments-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'course_enrollments'
        },
        () => {
          // Refetch to update enrollment counts
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleCourseAction = (courseId: string, isFree: boolean, price: number, courseGrade: string, slug: string | null) => {
    // Use slug for navigation, fallback to ID
    const courseUrl = slug || courseId;
    
    // Assistant teachers and admins go directly to course management
    if (canBypassAcademicRestrictions) {
      navigate(`/course/${courseUrl}`);
      return;
    }

    // Check if course is in preview mode (not enrollable)
    if (isCoursePreview(courseGrade)) {
      navigate(`/course/${courseUrl}`);
      return;
    }

    // UNIFIED FLOW: All course interactions lead to Course Content Page
    // Payment/enrollment actions happen INSIDE the course page
    navigate(`/course/${courseUrl}`);
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
        // Trigger engagement for smart prompts
        engagement?.recordEngagement('enrollment');
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

  // Filter hidden courses for non-enrolled users (visibility control)
  // Hidden courses are only visible to:
  // 1. Admins/Assistant Teachers (canBypassAcademicRestrictions)
  // 2. Students who are already enrolled in them
  const visibleCourses = scopedCourses.filter(course => {
    // Staff can see all courses
    if (canBypassAcademicRestrictions) return true;
    
    // If course is not hidden, show it
    if (!course.is_hidden) return true;
    
    // If course is hidden, only show if user is enrolled
    if (user && isEnrolled(course.id)) return true;
    
    // Hidden course and not enrolled - don't show
    return false;
  });

  // Filter and sort courses (free courses first for marketing)
  const filteredCourses = visibleCourses
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

  return (
    <div className="min-h-screen bg-background pb-mobile-nav">
      <SEOHead 
        title="Chemistry Courses – Hossam Fekry Platform"
        titleAr="كورسات الكيمياء – منصة حسام فكري"
        description="Browse our comprehensive Chemistry courses for Thanaweya Amma. 2nd and 3rd Secondary - Arabic and Languages tracks."
        descriptionAr="تصفح كورسات الكيمياء الشاملة للثانوية العامة. تانية وتالتة ثانوي - عربي ولغات."
        canonical="https://hossamfekry.com/courses"
      />
      <Navbar />
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Mobile-First Header - Compact and impactful */}
          <div className="mb-6 md:mb-8 animate-fade-in-up">
            {/* Stats row - Quick glance info */}
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                <BookOpen className="w-3 h-3 me-1" />
                {visibleCourses.length} {isArabic ? 'كورس' : 'Courses'}
              </Badge>
              {user && enrollments.length > 0 && (
                <Badge variant="outline" className="text-muted-foreground">
                  {enrollments.length} {isArabic ? 'مشترك فيهم' : 'Enrolled'}
                </Badge>
              )}
            </div>
            
            <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-2">
              {t('courses.title')}
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
              {isArabic 
                ? 'كورسات كيمياء شاملة للثانوية العامة'
                : 'Comprehensive Chemistry courses for Thanaweya Amma'
              }
            </p>
          </div>

          {/* Mobile-First Filters - Horizontal scrollable chips */}
          <div className="mb-6 animate-fade-in-up animation-delay-100">
            {/* Search - Full width on mobile */}
            <div className="relative mb-4">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                placeholder={isArabic ? 'ابحث عن كورس...' : 'Search courses...'} 
                className="ps-10 h-12 text-base rounded-xl border-border/50 bg-card"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Filter chips - Horizontal scroll on mobile */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
              {/* Grade filter chips */}
              <button
                onClick={() => setSelectedGrade('all')}
                className={cn(
                  "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                  selectedGrade === 'all' 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "bg-card border border-border text-foreground hover:border-primary/30"
                )}
              >
                {isArabic ? 'الكل' : 'All'}
              </button>
              
              {Object.entries(GRADE_OPTIONS).map(([value, labels]) => (
                <button
                  key={value}
                  onClick={() => setSelectedGrade(value)}
                  className={cn(
                    "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap",
                    selectedGrade === value 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "bg-card border border-border text-foreground hover:border-primary/30"
                  )}
                >
                  {isArabic ? labels.ar.split(' ').slice(0, 2).join(' ') : labels.en.split(' - ')[0]}
                </button>
              ))}
              
              {/* Free filter chip with glow */}
              <div className="relative group flex-shrink-0">
                {showFreeOnly && (
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-sm opacity-60 animate-pulse" />
                )}
                <button
                  onClick={() => setShowFreeOnly(!showFreeOnly)}
                  className={cn(
                    "relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5",
                    showFreeOnly 
                      ? "bg-green-600 text-white shadow-md" 
                      : "bg-card border border-border text-foreground hover:border-green-500/30"
                  )}
                >
                  <Filter className="w-3.5 h-3.5" />
                  {isArabic ? 'مجاني' : 'Free'}
                </button>
              </div>
            </div>
          </div>

          {/* User's Grade Courses - Priority Section */}
          {userGrade && userGradeCourses.length > 0 && selectedGrade === 'all' && (
            <div className="mb-8 md:mb-12 animate-fade-in-up animation-delay-200">
              {/* Section header with glow */}
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <div className="relative">
                  <div className="absolute -inset-1 bg-primary/20 rounded-full blur-md" />
                  <div className="relative w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-foreground">
                    {isArabic ? 'كورساتك' : 'Your Courses'}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {isArabic ? GRADE_OPTIONS[userGrade]?.ar : GRADE_OPTIONS[userGrade]?.en}
                  </p>
                </div>
              </div>
              
              {/* Mobile: single column, Desktop: 2-3 columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {userGradeCourses.map((course, index) => (
                  <CourseCard 
                    key={course.id}
                    course={course}
                    isArabic={isArabic}
                    isEnrolled={isEnrolled(course.id)}
                    enrollingId={enrollingId}
                    onAction={handleCourseAction}
                    index={index}
                    isAssistantOrAdmin={canBypassAcademicRestrictions}
                    isPreview={isCoursePreview(course.grade)}
                    userGrade={userGrade}
                    variant="full"
                  />
                ))}
              </div>
            </div>
          )}

          {/* All/Other Courses */}
          <div className="animate-fade-in-up animation-delay-300">
            {userGrade && userGradeCourses.length > 0 && selectedGrade === 'all' && otherCourses.length > 0 && (
              <h2 className="text-lg md:text-xl font-bold text-foreground mb-4 md:mb-6 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-muted-foreground/30 rounded-full" />
                {isArabic ? 'كورسات أخرى' : 'Other Courses'}
              </h2>
            )}
            
            {/* Empty state */}
            {(selectedGrade !== 'all' || !userGrade || userGradeCourses.length === 0) && filteredCourses.length === 0 && (
              <div className="text-center py-12 md:py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {isArabic ? 'لا توجد كورسات' : 'No courses found'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {isArabic ? 'جرب تغيير فلاتر البحث' : 'Try changing your search filters'}
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedGrade('all');
                    setShowFreeOnly(false);
                    setSearchQuery('');
                  }}
                >
                  {isArabic ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
                </Button>
              </div>
            )}
            
            {/* Course grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {(selectedGrade === 'all' && userGrade ? otherCourses : filteredCourses).map((course, index) => (
                <CourseCard 
                  key={course.id}
                  course={course}
                  isArabic={isArabic}
                  isEnrolled={isEnrolled(course.id)}
                  enrollingId={enrollingId}
                  onAction={handleCourseAction}
                  index={index}
                  isAssistantOrAdmin={canBypassAcademicRestrictions}
                  isPreview={isCoursePreview(course.grade)}
                  userGrade={userGrade}
                  variant="full"
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

export default Courses;