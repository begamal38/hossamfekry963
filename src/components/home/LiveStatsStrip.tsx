import React from 'react';
import { Users, BookOpen, TrendingUp } from 'lucide-react';
import { usePlatformStats } from '@/hooks/usePlatformStats';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';

interface LiveStatsStripProps {
  className?: string;
  variant?: 'default' | 'compact';
}

export const LiveStatsStrip: React.FC<LiveStatsStripProps> = ({ 
  className,
  variant = 'default' 
}) => {
  const { totalStudents, totalLessons, weeklyViews, loading } = usePlatformStats();
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  const stats = [
    {
      icon: Users,
      value: totalStudents,
      label: isArabic ? 'طالب مسجّل' : 'Enrolled Students',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: BookOpen,
      value: totalLessons,
      label: isArabic ? 'حصة متاحة' : 'Lessons Available',
      color: 'text-accent-foreground',
      bgColor: 'bg-accent/50',
    },
    {
      icon: TrendingUp,
      value: weeklyViews,
      label: isArabic ? 'جلسة تركيز هذا الأسبوع' : 'Focus Sessions This Week',
      color: 'text-green-600 dark:text-green-500',
      bgColor: 'bg-green-500/10',
    },
  ];

  if (loading) {
    return (
      <div className={cn(
        "flex items-center justify-center gap-4 md:gap-8 py-3 px-4",
        "border-y border-border/50 bg-muted/30",
        className
      )}>
        <div className="flex gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-muted" />
              <div className="space-y-1">
                <div className="h-4 w-12 bg-muted rounded" />
                <div className="h-3 w-16 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn(
        "flex items-center justify-center gap-4 flex-wrap py-2",
        className
      )}>
        {stats.map((stat, index) => (
          <div 
            key={index}
            className="flex items-center gap-1.5 text-sm"
          >
            <stat.icon className={cn("w-4 h-4", stat.color)} />
            <span className="font-semibold">
              <AnimatedCounter value={stat.value} />
            </span>
            <span className="text-muted-foreground text-xs">{stat.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center justify-center gap-6 md:gap-10 py-4 px-4",
      "border-y border-border/50 bg-muted/30 backdrop-blur-sm",
      className
    )}>
      {stats.map((stat, index) => (
        <div 
          key={index}
          className="flex items-center gap-3 group"
        >
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110",
            stat.bgColor
          )}>
            <stat.icon className={cn("w-5 h-5", stat.color)} />
          </div>
          <div className="flex flex-col">
            <span className={cn("text-lg md:text-xl font-bold", stat.color)}>
              <AnimatedCounter value={stat.value} />+
            </span>
            <span className="text-xs text-muted-foreground">
              {stat.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
