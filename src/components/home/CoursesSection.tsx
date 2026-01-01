import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Users, Play, ArrowRight, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const GRADE_LABELS: Record<string, { ar: string; en: string }> = {
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
  is_free: boolean;
  lessons_count: number;
  duration_hours: number;
  thumbnail_url: string | null;
  slug: string | null;
}

interface CourseCardProps {
  course: Course;
  index: number;
}

const CourseCard = React.memo<CourseCardProps>(({ course, index }) => {
  const { language, t } = useLanguage();
  const isArabic = language === 'ar';
  
  const title = isArabic ? course.title_ar : course.title;
  const description = isArabic ? course.description_ar : course.description;
  const gradeLabel = GRADE_LABELS[course.grade];
  // Use slug for URL, fallback to ID
  const courseUrl = `/course/${course.slug || course.id}`;

  return (
    <div className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl hover:border-primary/20 transition-all duration-300 hover:-translate-y-1">
      {/* Image - fixed height, no layout shift */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
        {course.thumbnail_url ? (
          <img 
            src={course.thumbnail_url} 
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-primary/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent" />
        
        {course.is_free && (
          <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground shadow-lg">
            {t('courses.free')}
          </Badge>
        )}
        
        {gradeLabel && (
          <Badge className="absolute top-4 right-4 bg-secondary text-secondary-foreground shadow-sm">
            {isArabic ? gradeLabel.ar : gradeLabel.en}
          </Badge>
        )}
        
        <Link 
          to={courseUrl} 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg scale-90 group-hover:scale-100"
        >
          <Play className="w-6 h-6 text-primary-foreground ml-1" />
        </Link>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {description || (isArabic ? 'كورس كيمياء شامل' : 'Comprehensive chemistry course')}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {course.duration_hours || 0} {isArabic ? 'ساعة' : 'hours'}
          </div>
          <div className="flex items-center gap-1">
            <Play className="w-4 h-4" />
            {course.lessons_count || 0} {isArabic ? 'حصة' : 'lessons'}
          </div>
        </div>

        {/* CTA */}
        <Button variant={course.is_free ? 'default' : 'outline'} className="w-full group-hover:shadow-md transition-shadow" asChild>
          <Link to={courseUrl}>
            {course.is_free ? t('courses.preview') : t('courses.enroll')}
          </Link>
        </Button>
      </div>
    </div>
  );
});

CourseCard.displayName = 'CourseCard';

export const CoursesSection: React.FC = () => {
  const { t, language } = useLanguage();
  const isArabic = language === 'ar';
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // Fetch only primary courses (2026 academic structure)
        const { data, error } = await supabase
          .from('courses')
          .select('id, title, title_ar, description, description_ar, grade, is_free, lessons_count, duration_hours, thumbnail_url, slug')
          .eq('is_primary', true)
          .order('grade', { ascending: true })
          .limit(4); // Show max 4 courses on home

        if (error) throw error;
        setCourses(data || []);
      } catch (err) {
        console.error('Error fetching courses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return (
    <section className="py-20 lg:py-28 2xl:py-32 3xl:py-36 bg-muted/30" style={{ contain: 'layout' }} aria-labelledby="courses-heading">
      <div className="container mx-auto px-4 2xl:px-8 3xl:px-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 2xl:gap-6 mb-12 2xl:mb-16 3xl:mb-20">
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
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 2xl:gap-8 3xl:gap-10">
            {courses.map((course, index) => (
              <CourseCard key={course.id} course={course} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};