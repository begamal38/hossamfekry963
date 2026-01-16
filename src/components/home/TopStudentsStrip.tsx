import React, { useEffect, useState, useRef } from 'react';
import { Trophy, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';

interface TopStudent {
  id: string;
  student_name_ar: string;
  student_name_en: string;
  display_month: string;
  display_order: number;
}

// Arabic month names
const arabicMonths: Record<string, string> = {
  'January': 'يناير',
  'February': 'فبراير',
  'March': 'مارس',
  'April': 'أبريل',
  'May': 'مايو',
  'June': 'يونيو',
  'July': 'يوليو',
  'August': 'أغسطس',
  'September': 'سبتمبر',
  'October': 'أكتوبر',
  'November': 'نوفمبر',
  'December': 'ديسمبر',
};

// Get current month dynamically
const getCurrentMonth = (isArabic: boolean): string => {
  const now = new Date();
  const monthEn = now.toLocaleDateString('en-US', { month: 'long' });
  
  if (isArabic) {
    return arabicMonths[monthEn] || monthEn;
  }
  return monthEn;
};

export const TopStudentsStrip: React.FC = () => {
  const { language, isRTL } = useLanguage();
  const isArabic = language === 'ar';
  const isMobile = useIsMobile();
  const [students, setStudents] = useState<TopStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTopStudents = async () => {
      const { data, error } = await supabase
        .from('top_students')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (!error && data) {
        setStudents(data);
      }
      setLoading(false);
    };

    fetchTopStudents();

    // Realtime subscription
    const channel = supabase
      .channel('top-students-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'top_students' },
        () => fetchTopStudents()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Touch handlers for mobile pause
  const handleTouchStart = () => setIsPaused(true);
  const handleTouchEnd = () => setIsPaused(false);

  // Don't render if no students or loading
  if (loading || students.length === 0) return null;

  // Get dynamic current month
  const currentMonth = getCurrentMonth(isArabic);

  // Create duplicated list for seamless scrolling (3x for smooth loop)
  const duplicatedStudents = [...students, ...students, ...students];

  // Dynamic animation class based on device and direction
  const getAnimationClass = () => {
    if (isPaused) return '';
    
    if (isMobile) {
      return isRTL ? 'animate-scroll-rtl-mobile' : 'animate-scroll-ltr-mobile';
    }
    return isRTL ? 'animate-scroll-rtl' : 'animate-scroll-ltr';
  };

  return (
    <section 
      className="relative py-6 md:py-8 overflow-hidden bg-gradient-to-r from-primary/5 via-background to-primary/5 shadow-section"
      aria-label={isArabic ? 'أوائل الطلاب' : 'Top Students'}
    >
      {/* Subtle side accents for brand depth */}
      <div className="absolute inset-y-0 left-0 w-16 md:w-24 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-16 md:w-24 bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
      
      {/* Header - Dynamic Month */}
      <div className="container mx-auto px-4 mb-4 relative z-10">
        <div className="flex items-center justify-center gap-2 text-center">
          <Trophy className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <h3 className="text-sm md:text-base font-bold text-foreground whitespace-nowrap">
            {isArabic ? `أوائل الطلاب – ${currentMonth}` : `Top Students – ${currentMonth}`}
          </h3>
          <Trophy className="w-5 h-5 text-amber-500 flex-shrink-0" />
        </div>
      </div>

      {/* Scrolling Strip Container */}
      <div 
        ref={containerRef}
        className="relative w-full overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Gradient fade edges - Fixed for RTL/LTR */}
        <div 
          className={cn(
            "absolute inset-y-0 w-12 md:w-20 z-10 pointer-events-none",
            isRTL ? "right-0" : "left-0"
          )}
          style={{
            background: isRTL 
              ? 'linear-gradient(to left, hsl(var(--background)), transparent)'
              : 'linear-gradient(to right, hsl(var(--background)), transparent)'
          }}
        />
        <div 
          className={cn(
            "absolute inset-y-0 w-12 md:w-20 z-10 pointer-events-none",
            isRTL ? "left-0" : "right-0"
          )}
          style={{
            background: isRTL 
              ? 'linear-gradient(to right, hsl(var(--background)), transparent)'
              : 'linear-gradient(to left, hsl(var(--background)), transparent)'
          }}
        />

        {/* Scrolling content */}
        <div 
          className={cn(
            "flex gap-3 md:gap-5 whitespace-nowrap will-change-transform",
            getAnimationClass()
          )}
          style={{
            width: 'max-content',
            animationPlayState: isPaused ? 'paused' : 'running',
          }}
        >
          {duplicatedStudents.map((student, idx) => (
            <div
              key={`${student.id}-${idx}`}
              className={cn(
                "inline-flex items-center gap-2 px-3 md:px-4 py-2 rounded-full",
                "bg-gradient-to-r from-amber-500/10 to-primary/10",
                "border border-amber-500/20",
                "text-foreground text-xs md:text-sm font-medium",
                "transition-all duration-300",
                "hover:scale-105 hover:border-amber-500/40 hover:shadow-md"
              )}
            >
              <Star className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500 fill-amber-500/50 flex-shrink-0" />
              <span className="truncate max-w-[120px] md:max-w-none">
                {isArabic ? student.student_name_ar : (student.student_name_en || student.student_name_ar)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
