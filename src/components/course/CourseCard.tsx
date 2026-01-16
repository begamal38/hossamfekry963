import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Play, Loader2, CheckCircle, BookOpen, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { ContentTypeBadge } from '@/components/course/ContentTypeBadge';

// Default fallback image for courses without a cover
const DEFAULT_COURSE_COVER = '/images/default-course-cover.svg';

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
  slug: string | null;
  enrolled_count?: number; // Number of enrolled students
}

interface CourseCardProps {
  course: Course;
  isArabic?: boolean;
  isEnrolled?: boolean;
  enrollingId?: string | null;
  onAction?: (courseId: string, isFree: boolean, price: number, courseGrade: string, slug: string | null) => void;
  index?: number;
  isAssistantOrAdmin?: boolean;
  isPreview?: boolean;
  userGrade?: string | null;
  variant?: 'full' | 'simple'; // 'full' for Courses page, 'simple' for homepage
}

/**
 * Unified Course Card Component
 * Uses course cover image consistently across the platform
 * Mobile-first responsive design with improved touch targets
 */
export const CourseCard = React.memo<CourseCardProps>(({ 
  course, 
  isArabic: isArabicProp,
  isEnrolled = false, 
  enrollingId = null, 
  onAction, 
  index = 0,
  isAssistantOrAdmin = false,
  isPreview = false,
  userGrade = null,
  variant = 'full'
}) => {
  const { language, t } = useLanguage();
  const isArabic = isArabicProp ?? (language === 'ar');
  
  const gradeInfo = GRADE_OPTIONS[course.grade];
  const isGradeMatch = !userGrade || userGrade === course.grade;
  const canEnroll = isAssistantOrAdmin || isGradeMatch;
  const courseUrl = `/course/${course.slug || course.id}`;
  
  const title = isArabic ? course.title_ar : course.title;
  const description = isArabic ? course.description_ar : course.description;
  
  // Always prioritize the uploaded cover image
  const coverImage = course.thumbnail_url || DEFAULT_COURSE_COVER;
  const hasCustomCover = !!course.thumbnail_url;
  
  const handleAction = () => {
    if (onAction) {
      onAction(course.id, course.is_free, course.price, course.grade, course.slug);
    }
  };

  return (
    <div 
      className={cn(
        "group relative bg-card rounded-2xl border border-border overflow-hidden transition-all duration-300",
        // Enhanced shadow system for depth
        "shadow-card hover:shadow-elevated",
        // Desktop: hover effects with glow
        "md:hover:-translate-y-1 md:hover:border-primary/30",
        // Mobile: optimized spacing and touch targets
        "active:scale-[0.98] touch-manipulation",
        `animate-fade-in-up animation-delay-${((index % 3) + 1) * 100}`
      )}
    >
      {/* Glow effect on hover - Desktop only */}
      <div className={cn(
        "absolute -inset-0.5 bg-gradient-to-r from-primary/40 via-accent/30 to-primary/40 rounded-2xl opacity-0 blur-md transition-opacity duration-500",
        "hidden md:block md:group-hover:opacity-70"
      )} />
      {/* Course Cover Image - 16:9 aspect ratio on mobile, fixed height on desktop */}
      <div className={cn(
        "relative overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10",
        // Mobile: 16:9 aspect ratio for consistent marketing appearance
        "aspect-video md:aspect-auto md:h-44",
        isPreview && "opacity-75",
        "z-10" // Above glow layer
      )}>
        {/* Course Cover Image - Always show the cover or fallback */}
        <img 
          src={coverImage}
          alt={title}
          className={cn(
            "w-full h-full object-cover transition-transform duration-500",
            "group-hover:scale-105",
            // Fallback image styling
            !hasCustomCover && "opacity-60"
          )}
          loading="lazy"
          onError={(e) => {
            // Fallback to default if image fails to load
            (e.target as HTMLImageElement).src = DEFAULT_COURSE_COVER;
          }}
        />
        
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        
        {/* Status Badge - Free/Paid (top-left) */}
        <div className="absolute top-3 left-3 z-10">
          {isPreview && !isAssistantOrAdmin ? (
            <Badge className="bg-amber-500 text-white shadow-lg">
              {isArabic ? 'قريباً' : 'Coming Soon'}
            </Badge>
          ) : isAssistantOrAdmin && isPreview ? (
            <Badge className="bg-amber-500 text-white shadow-lg">
              {isArabic ? 'معاينة' : 'Preview'}
            </Badge>
          ) : (
            <ContentTypeBadge isFree={course.is_free} />
          )}
        </div>
        
        {/* Enrolled/Teacher Badge (top-right) */}
        {isEnrolled && !isAssistantOrAdmin && !isPreview && (
          <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground gap-1 shadow-lg z-10">
            <CheckCircle className="w-3 h-3" />
            {isArabic ? 'مشترك' : 'Enrolled'}
          </Badge>
        )}
        
        {isAssistantOrAdmin && (
          <Badge className="absolute top-3 right-3 bg-secondary text-secondary-foreground gap-1 shadow-lg z-10">
            {isArabic ? 'مدرس' : 'Teacher'}
          </Badge>
        )}
        
        {/* Play button on hover (desktop only) */}
        {variant === 'simple' && (
          <Link 
            to={courseUrl} 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg scale-90 group-hover:scale-100 z-10"
            aria-label={isArabic ? `شاهد كورس ${title}` : `View ${title} course`}
          >
            <Play className="w-6 h-6 text-primary-foreground ml-1" />
          </Link>
        )}
      </div>

      {/* Content - Above glow layer */}
      <div className="relative z-10 p-4 md:p-5 space-y-3 bg-card">
        {/* Grade Category Chip */}
        <Badge variant="outline" className="text-xs font-medium">
          {isArabic ? gradeInfo?.ar : gradeInfo?.en}
        </Badge>
        
        {/* Course Title - max 2 lines */}
        <h3 className="text-base md:text-lg font-bold text-foreground line-clamp-2 min-h-[2.5rem] md:min-h-0 md:line-clamp-1 group-hover:text-primary transition-colors">
          {title}
        </h3>
        
        {/* Description - hidden on mobile for cleaner cards */}
        {variant === 'simple' && (
          <p className="hidden md:block text-muted-foreground text-sm line-clamp-2">
            {description || (isArabic ? 'كورس كيمياء شامل' : 'Comprehensive chemistry course')}
          </p>
        )}

        {/* Meta info row */}
        <div className="flex items-center flex-wrap gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-primary/60" />
            <span>{course.duration_hours || 0} {isArabic ? 'ساعة' : 'hrs'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Play className="w-4 h-4 text-primary/60" />
            <span>{course.lessons_count || 0} {isArabic ? 'حصة' : 'lessons'}</span>
          </div>
          {(course.enrolled_count !== undefined && course.enrolled_count > 0) && (
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-primary/60" />
              <span>{course.enrolled_count} {isArabic ? 'طالب' : 'students'}</span>
            </div>
          )}
        </div>

        {/* CTA Button - varies based on context */}
        {variant === 'simple' ? (
          // Simple variant for homepage - just link to course
          <Button 
            variant={course.is_free ? 'default' : 'outline'} 
            className="w-full h-11 text-base font-semibold group-hover:shadow-md transition-shadow" 
            asChild
          >
            <Link to={courseUrl}>
              {course.is_free 
                ? (isArabic ? 'اشترك مجاناً' : 'Enroll Free')
                : t('courses.enroll')
              }
            </Link>
          </Button>
        ) : isAssistantOrAdmin ? (
          // Assistant/Admin: View Course
          <Button 
            variant="default" 
            className="w-full h-11 text-base font-semibold gap-2"
            onClick={handleAction}
          >
            <BookOpen className="w-4 h-4" />
            {isArabic ? 'عرض الكورس' : 'View Course'}
          </Button>
        ) : isPreview ? (
          // Preview course: View Details
          <Button 
            variant="secondary" 
            className="w-full h-11 text-base font-semibold gap-2"
            onClick={handleAction}
          >
            <BookOpen className="w-4 h-4" />
            {isArabic ? 'عرض التفاصيل' : 'View Details'}
          </Button>
        ) : isEnrolled ? (
          // Enrolled: Continue learning
          <Button variant="default" className="w-full h-11 text-base font-semibold gap-2" asChild>
            <Link to={courseUrl}>
              <Play className="w-4 h-4" />
              {isArabic ? 'متابعة التعلم' : 'Continue Learning'}
            </Link>
          </Button>
        ) : !canEnroll ? (
          // Grade mismatch
          <div className="space-y-2">
            <Button 
              variant="outline"
              className="w-full h-11 text-base opacity-50 cursor-not-allowed"
              disabled
            >
              {isArabic ? 'غير متاح لمسارك' : 'Not available'}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              {isArabic ? 'هذا الكورس مخصص لمسار دراسي آخر' : 'This course is for a different track'}
            </p>
          </div>
        ) : (
          // Not enrolled: Enroll button with price
          <Button 
            variant="default"
            className="w-full h-11 text-base font-semibold"
            onClick={handleAction}
            disabled={enrollingId === course.id}
          >
            {enrollingId === course.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : course.is_free ? (
              isArabic ? 'اشترك مجاناً' : 'Enroll Free'
            ) : (
              <>
                {course.price} {isArabic ? 'ج.م' : 'EGP'}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
});

CourseCard.displayName = 'CourseCard';

export default CourseCard;
