import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, Filter, Search, BookOpen, CheckCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const GRADE_OPTIONS: Record<string, { ar: string; en: string }> = {
  'second_arabic': { ar: 'ثانية ثانوي عربي', en: '2nd Year - Arabic' },
  'second_languages': { ar: 'ثانية ثانوي لغات', en: '2nd Year - Languages' },
  'third_arabic': { ar: 'ثالثة ثانوي عربي', en: '3rd Year - Arabic' },
  'third_languages': { ar: 'ثالثة ثانوي لغات', en: '3rd Year - Languages' },
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
  const { toast } = useToast();
  const navigate = useNavigate();
  const isArabic = language === 'ar';

  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [userGrade, setUserGrade] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [showFreeOnly, setShowFreeOnly] = useState(false);

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
            .select('grade')
            .eq('user_id', user.id)
            .maybeSingle();

          if (profileData?.grade) {
            setUserGrade(profileData.grade);
            setSelectedGrade(profileData.grade);
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

  const handleEnroll = async (courseId: string, isFree: boolean, price: number) => {
    if (!user) {
      toast({
        title: isArabic ? 'يرجى تسجيل الدخول' : 'Please login',
        description: isArabic ? 'يجب تسجيل الدخول للاشتراك في الكورس' : 'You need to login to enroll in a course',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    // If paid course, redirect to payment page
    if (!isFree && price > 0) {
      navigate(`/payment/${courseId}`);
      return;
    }

    // Free course - enroll directly
    setEnrollingId(courseId);
    try {
      const { error } = await supabase
        .from('course_enrollments')
        .insert({
          user_id: user.id,
          course_id: courseId,
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
        setEnrollments([...enrollments, { course_id: courseId, progress: 0 }]);
        toast({
          title: isArabic ? 'تم الاشتراك!' : 'Enrolled!',
          description: isArabic ? 'تم الاشتراك في الكورس بنجاح' : 'Successfully enrolled in the course',
        });
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

  // Filter courses
  const filteredCourses = courses.filter(course => {
    const matchesSearch = 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.title_ar.includes(searchQuery);
    
    const matchesGrade = selectedGrade === 'all' || course.grade === selectedGrade;
    const matchesFree = !showFreeOnly || course.is_free;
    
    return matchesSearch && matchesGrade && matchesFree;
  });

  // Separate user's grade courses and others
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
                ? 'اختر من مجموعة واسعة من الكورسات المصممة خصيصًا لطلاب الثانوية العامة'
                : 'Choose from a wide range of courses designed specifically for Thanaweya Amma students'
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
                    onEnroll={handleEnroll}
                    index={index}
                    t={t}
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
                  onEnroll={handleEnroll}
                  index={index}
                  t={t}
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
  onEnroll: (courseId: string, isFree: boolean, price: number) => void;
  index: number;
  t: (key: string) => string;
}

const CourseCard: React.FC<CourseCardProps> = ({ 
  course, 
  isArabic, 
  isEnrolled, 
  enrollingId, 
  onEnroll, 
  index,
  t 
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
      <div className="relative h-40 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
        <BookOpen className="w-16 h-16 text-primary/50" />
        
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent" />
        
        {course.is_free && (
          <Badge className="absolute top-3 left-3 bg-green-600 text-white">
            {isArabic ? 'مجاني' : 'Free'}
          </Badge>
        )}
        
        {isEnrolled && (
          <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground gap-1">
            <CheckCircle className="w-3 h-3" />
            {isArabic ? 'مشترك' : 'Enrolled'}
          </Badge>
        )}
        
        {!isEnrolled && !course.is_free && (
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
            {course.lessons_count} {isArabic ? 'درس' : 'lessons'}
          </div>
        </div>

        {/* CTA */}
        {isEnrolled ? (
          <Button variant="default" className="w-full gap-2" asChild>
            <Link to={`/dashboard`}>
              <Play className="w-4 h-4" />
              {isArabic ? 'متابعة التعلم' : 'Continue Learning'}
            </Link>
          </Button>
        ) : (
          <Button 
            variant={course.is_free ? 'default' : 'outline'} 
            className="w-full"
            onClick={() => onEnroll(course.id, course.is_free, course.price)}
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