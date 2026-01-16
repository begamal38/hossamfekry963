import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { CourseCard } from '@/components/course/CourseCard';
import { useScrollFadeIn } from '@/hooks/useScrollFadeIn';
import { cn } from '@/lib/utils';

interface Course {
  id: string;
  title: string;
  title_ar: string;
  description: string | null;
  description_ar: string | null;
  grade: string;
  is_free: boolean;
  lessons_count: number;
  duration_hours: number;
  thumbnail_url: string | null;
  slug: string | null;
  price: number;
  enrolled_count?: number;
}

export const CoursesSection: React.FC = () => {
  const { t, language } = useLanguage();
  const isArabic = language === 'ar';
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { ref: headerRef, isVisible: headerVisible } = useScrollFadeIn(0.05);
  const { ref: cardsRef, isVisible: cardsVisible } = useScrollFadeIn(0.05);

  const fetchCourses = async () => {
    try {
      // Home should always show courses if any exist.
      // 1) Prefer primary (2026 structure)
      const primaryRes = await supabase
        .from('courses')
        .select('id, title, title_ar, description, description_ar, grade, is_free, lessons_count, duration_hours, thumbnail_url, slug, price')
        .eq('is_primary', true)
        .order('grade', { ascending: true })
        .limit(4);

      if (primaryRes.error) throw primaryRes.error;

      let coursesData = primaryRes.data || [];
      
      if (coursesData.length === 0) {
        // 2) Fallback: show any non-hidden courses (protects against misconfigured is_primary)
        const fallbackRes = await supabase
          .from('courses')
          .select('id, title, title_ar, description, description_ar, grade, is_free, lessons_count, duration_hours, thumbnail_url, slug, price')
          .eq('is_hidden', false)
          .order('created_at', { ascending: false })
          .limit(4);

        if (fallbackRes.error) throw fallbackRes.error;
        coursesData = fallbackRes.data || [];
      }

      // Fetch enrollment counts for each course
      if (coursesData.length > 0) {
        const courseIds = coursesData.map(c => c.id);
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
        coursesData = coursesData.map(course => ({
          ...course,
          enrolled_count: countMap.get(course.id) || 0
        }));
      }

      setCourses(coursesData);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();

    // Subscribe to realtime enrollment changes
    const channel = supabase
      .channel('home-enrollments-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'course_enrollments'
        },
        () => {
          // Refetch to update enrollment counts
          fetchCourses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <section className="py-20 lg:py-28 2xl:py-32 3xl:py-36 bg-muted/30 section-with-depth" style={{ contain: 'layout' }} aria-labelledby="courses-heading">
      <div className="container mx-auto px-4 2xl:px-8 3xl:px-12 relative z-10">
        {/* Header with fade-in */}
        <div 
          ref={headerRef}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 2xl:gap-6 mb-12 2xl:mb-16 3xl:mb-20"
        >
          <div>
            <h2 id="courses-heading" className="text-3xl md:text-4xl 2xl:text-5xl 3xl:text-5xl-display font-bold text-foreground mb-4 2xl:mb-6">
              {t('courses.title')}
            </h2>
            <p className="text-muted-foreground max-w-xl 2xl:max-w-2xl 2xl:text-lg 3xl:text-xl">
              {isArabic 
                ? 'كورسات الكيمياء للعام الدراسي 2026 - تانية وتالتة ثانوي عربي ولغات'
                : 'Chemistry courses for 2026 academic year - 2nd and 3rd Secondary Arabic & Languages'
              }
            </p>
            <div className="w-24 h-1 2xl:w-32 bg-gradient-to-r from-primary to-accent rounded-full mt-4 2xl:mt-6" />
          </div>
          
          <Button variant="outline" className="2xl:text-lg 2xl:px-6 2xl:py-3" asChild>
            <Link to="/courses">
              {t('courses.viewAll')}
              <ArrowRight className="w-4 h-4 2xl:w-5 2xl:h-5 ml-2" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 2xl:py-16">
            <Loader2 className="w-8 h-8 2xl:w-10 2xl:h-10 animate-spin text-primary" />
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12 2xl:py-16">
            <BookOpen className="w-16 h-16 2xl:w-20 2xl:h-20 text-muted-foreground/40 mx-auto mb-4 2xl:mb-6" />
            <h3 className="text-lg 2xl:text-xl 3xl:text-2xl font-semibold mb-2">
              {isArabic ? 'الكورسات قريباً' : 'Courses coming soon'}
            </h3>
            <p className="text-muted-foreground 2xl:text-lg">
              {isArabic ? 'سيتم إضافة كورسات 2026 قريباً' : '2026 courses will be added soon'}
            </p>
          </div>
        ) : (
          // Mobile: single column, Tablet: 2 columns, Desktop: 4 columns with fade-in
          <div 
            ref={cardsRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 2xl:gap-8 3xl:gap-10"
          >
            {courses.map((course, index) => (
              <div 
                key={course.id}
                className="transition-all duration-500"
                 style={{
                   transitionDelay: `${index * 100}ms`,
                   opacity: 1,
                   transform: 'translateY(0)'
                 }}
              >
                <CourseCard 
                  course={course} 
                  index={index}
                  variant="simple"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};