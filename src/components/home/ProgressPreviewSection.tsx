import React from 'react';
import { BookOpen, Clock, CheckCircle2, Award, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

// Unified variant system matching Student Dashboard
type StatVariant = 'primary' | 'success' | 'warning' | 'muted';

const variantStyles: Record<StatVariant, { bg: string; icon: string }> = {
  primary: { bg: 'bg-primary/10', icon: 'text-primary' },
  success: { bg: 'bg-success/10', icon: 'text-success' },
  warning: { bg: 'bg-warning/10', icon: 'text-warning' },
  muted: { bg: 'bg-muted', icon: 'text-muted-foreground' },
};

interface StatItemProps {
  icon: React.ElementType;
  value: number;
  label: string;
  variant: StatVariant;
}

// Compact stat item matching Dashboard InfoCard structure
const StatItem: React.FC<StatItemProps> = ({ icon: Icon, value, label, variant }) => {
  const styles = variantStyles[variant];
  
  return (
    <div className="bg-card rounded-lg border border-border/50 p-4 transition-colors duration-150">
      {/* Icon Container - UNIFIED: 44x44px square with 12px radius */}
      <div className={cn(
        "w-11 h-11 rounded-[12px] flex items-center justify-center mb-3",
        styles.bg
      )}>
        <Icon className={cn("w-5 h-5", styles.icon)} strokeWidth={2} />
      </div>
      
      {/* Value - Primary visual anchor */}
      <p className="text-2xl sm:text-3xl font-bold text-foreground">{value}</p>
      
      {/* Label - Secondary, muted */}
      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-2">{label}</p>
    </div>
  );
};

export const ProgressPreviewSection: React.FC = () => {
  const { t, isRTL } = useLanguage();

  // Stats matching Dashboard structure with unified variants
  const stats: StatItemProps[] = [
    {
      icon: CheckCircle2,
      value: 18,
      label: t('dashboard.lessonsCompleted'),
      variant: 'success',
    },
    {
      icon: Clock,
      value: 12,
      label: t('dashboard.lessonsRemaining'),
      variant: 'muted',
    },
    {
      icon: Award,
      value: 5,
      label: t('dashboard.examsTaken'),
      variant: 'primary',
    },
    {
      icon: BookOpen,
      value: 3,
      label: t('dashboard.examsPending'),
      variant: 'warning',
    },
  ];

  return (
    <section 
      className="py-16 lg:py-24 bg-background" 
      dir={isRTL ? 'rtl' : 'ltr'} 
      style={{ contain: 'layout' }}
    >
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            {isRTL ? 'شوف وصلت لفين 🚀' : 'Track Your Progress 🚀'}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            {isRTL 
              ? 'متابعة لحظة بلحظة.. عشان تعرف إنت ماشي صح ولا لأ'
              : 'Track your learning journey with our comprehensive progress monitoring system'
            }
          </p>
          {/* Accent line using primary color - solid, no gradient */}
          <div className="w-16 h-1 bg-primary mx-auto rounded-full mt-5" />
        </div>

        {/* Main Progress Card */}
        <div className="bg-card rounded-lg border border-border p-5 sm:p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Icon Container - matching unified system */}
              <div className="w-11 h-11 rounded-[12px] bg-primary/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-primary" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground text-sm sm:text-base">
                  {t('dashboard.overallProgress')}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {isRTL ? 'كورس الكيمياء العضوية' : 'Organic Chemistry Course'}
                </p>
              </div>
            </div>
            
            {/* Progress percentage */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xl sm:text-2xl font-bold text-foreground">60%</span>
            </div>
          </div>
          
          {/* Progress Bar - solid primary color, no gradient */}
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: '60%' }}
            />
          </div>
          
          {/* Progress details */}
          <div className="flex justify-between mt-3 text-xs sm:text-sm text-muted-foreground">
            <span>{isRTL ? '18 حصة مكتملة' : '18 lessons completed'}</span>
            <span>{isRTL ? '12 حصة متبقية' : '12 lessons remaining'}</span>
          </div>
        </div>

        {/* Stats Grid - 2x2 matching Dashboard layout */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, index) => (
            <StatItem key={index} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
};
