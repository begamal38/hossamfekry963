import React, { useEffect, useState } from 'react';
import { Trophy, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

interface TopStudent {
  id: string;
  student_name_ar: string;
  student_name_en: string;
  display_month: string;
  display_order: number;
}

export const TopStudentsStrip: React.FC = () => {
  const { language, isRTL } = useLanguage();
  const isArabic = language === 'ar';
  const [students, setStudents] = useState<TopStudent[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Don't render if no students or loading
  if (loading || students.length === 0) return null;

  // Get current month display text
  const currentMonth = students[0]?.display_month || '';

  // Create duplicated list for seamless scrolling
  const duplicatedStudents = [...students, ...students, ...students];

  return (
    <div className="relative py-6 md:py-8 overflow-hidden bg-gradient-to-r from-primary/5 via-background to-primary/5">
      {/* Header */}
      <div className="container mx-auto px-4 mb-4">
        <div className="flex items-center justify-center gap-2 text-center">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h3 className="text-sm md:text-base font-bold text-foreground">
            {isArabic ? `متميزون ${currentMonth}` : `Top Students of ${currentMonth}`}
          </h3>
          <Trophy className="w-5 h-5 text-amber-500" />
        </div>
      </div>

      {/* Scrolling Strip */}
      <div className="relative">
        {/* Gradient fade edges */}
        <div className="absolute inset-y-0 start-0 w-16 md:w-24 bg-gradient-to-e from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 end-0 w-16 md:w-24 bg-gradient-to-s from-background to-transparent z-10 pointer-events-none" />

        {/* Scrolling content */}
        <div 
          className={cn(
            "flex gap-4 md:gap-6 whitespace-nowrap",
            isRTL ? "animate-scroll-rtl" : "animate-scroll-ltr"
          )}
          style={{
            width: 'max-content',
          }}
        >
          {duplicatedStudents.map((student, idx) => (
            <div
              key={`${student.id}-${idx}`}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full",
                "bg-gradient-to-r from-amber-500/10 to-primary/10",
                "border border-amber-500/20",
                "text-foreground text-sm md:text-base font-medium",
                "transition-all hover:scale-105 hover:border-amber-500/40"
              )}
            >
              <Star className="w-4 h-4 text-amber-500 fill-amber-500/50" />
              <span>{isArabic ? student.student_name_ar : student.student_name_en}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
