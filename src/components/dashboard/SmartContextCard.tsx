import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles, Play, Gift, TrendingUp, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CardType = 'new_user' | 'resume' | 'inactive' | 'progress' | 'trial';

interface SmartContextCardProps {
  type: CardType;
  isRTL?: boolean;
  /** For resume type: course info */
  courseName?: string;
  courseId?: string;
  lessonsCompleted?: number;
  totalLessons?: number;
  /** For progress type */
  progressPercent?: number;
  className?: string;
}

const cardConfigs: Record<CardType, {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: { ar: string; en: string };
  subtitle: { ar: string; en: string };
  cta: { ar: string; en: string };
  href: string;
  gradient: string;
}> = {
  new_user: {
    icon: Gift,
    iconBg: 'bg-green-500/10',
    iconColor: 'text-green-600',
    title: { ar: 'ابدأ التجربة المجانية', en: 'Start Free Trial' },
    subtitle: { ar: 'شوف أسلوب الشرح قبل ما تقرر', en: 'See the teaching style before you decide' },
    cta: { ar: 'ابدأ دلوقتي', en: 'Start Now' },
    href: '/free-lessons',
    gradient: 'from-green-500/5 via-transparent to-transparent',
  },
  trial: {
    icon: Sparkles,
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-600',
    title: { ar: 'التجربة المجانية متاحة', en: 'Free Trial Available' },
    subtitle: { ar: 'جرّب الحصص المجانية بدون أي قيود', en: 'Try free lessons without any limits' },
    cta: { ar: 'جرّب مجاناً', en: 'Try Free' },
    href: '/free-lessons',
    gradient: 'from-purple-500/5 via-transparent to-transparent',
  },
  resume: {
    icon: Play,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    title: { ar: 'كمّل من هنا', en: 'Continue Learning' },
    subtitle: { ar: 'استكمل درسك الأخير', en: 'Resume your last lesson' },
    cta: { ar: 'استكمل', en: 'Continue' },
    href: '/courses',
    gradient: 'from-primary/5 via-transparent to-transparent',
  },
  inactive: {
    icon: Target,
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-600',
    title: { ar: 'وحشتنا! 👋', en: 'We missed you! 👋' },
    subtitle: { ar: 'ارجع كمّل اللي بدأته', en: 'Come back and finish what you started' },
    cta: { ar: 'ارجع الآن', en: 'Return Now' },
    href: '/courses',
    gradient: 'from-amber-500/5 via-transparent to-transparent',
  },
  progress: {
    icon: TrendingUp,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-600',
    title: { ar: 'تابع تقدمك', en: 'Track Progress' },
    subtitle: { ar: 'شوف إنجازاتك وحسّن أداءك', en: 'See your achievements and improve' },
    cta: { ar: 'شوف التقدم', en: 'View Progress' },
    href: '/dashboard',
    gradient: 'from-blue-500/5 via-transparent to-transparent',
  },
};

/**
 * Smart Context Card - Ana Vodafone "Made for YOU" style
 * Shows contextual actions based on user state
 */
export const SmartContextCard: React.FC<SmartContextCardProps> = ({
  type,
  isRTL = false,
  courseName,
  courseId,
  lessonsCompleted = 0,
  totalLessons = 0,
  progressPercent,
  className,
}) => {
  const config = cardConfigs[type];
  const Icon = config.icon;
  
  // Override href for resume type with course ID
  const href = type === 'resume' && courseId ? `/course/${courseId}` : config.href;
  
  // Dynamic subtitle for resume
  const subtitle = type === 'resume' && courseName 
    ? (isRTL ? courseName : courseName)
    : (isRTL ? config.subtitle.ar : config.subtitle.en);

  return (
    <Link
      to={href}
      className={cn(
        "block relative overflow-hidden rounded-2xl border border-border bg-card",
        "hover:border-primary/30 transition-all duration-200",
        "active:scale-[0.98]",
        className
      )}
    >
      {/* Gradient overlay */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br pointer-events-none",
        config.gradient
      )} />
      
      <div className="relative p-4 sm:p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
            config.iconBg
          )}>
            <Icon className={cn("w-6 h-6", config.iconColor)} />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground mb-1 line-clamp-1">
              {isRTL ? config.title.ar : config.title.en}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {subtitle}
            </p>
            
            {/* Progress bar for resume/progress types */}
            {(type === 'resume' || type === 'progress') && totalLessons > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">
                    {isRTL ? `${lessonsCompleted} من ${totalLessons}` : `${lessonsCompleted} of ${totalLessons}`}
                  </span>
                  <span className="font-semibold text-foreground">
                    {Math.round((lessonsCompleted / totalLessons) * 100)}%
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${(lessonsCompleted / totalLessons) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Arrow */}
          <div className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center flex-shrink-0 self-center">
            {isRTL ? (
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};
