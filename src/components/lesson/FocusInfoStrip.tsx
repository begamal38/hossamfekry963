import React from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { Target, Timer, Bell, BarChart3, FileCheck } from 'lucide-react';

interface FocusInfoStripProps {
  className?: string;
}

/**
 * Focus Info Strip - Visual-only informational strip
 * Shows platform features without any buttons or logic changes
 * Designed to blend seamlessly with existing UI
 */
export const FocusInfoStrip: React.FC<FocusInfoStripProps> = ({ className }) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  const features = [
    {
      icon: Target,
      label: isArabic ? 'Focus Mode ذكي' : 'Smart Focus Mode',
    },
    {
      icon: Timer,
      label: isArabic ? 'كل 20 دقيقة محسوبة' : '20-minute tracked intervals',
    },
    {
      icon: Bell,
      label: isArabic ? 'تشجيع تلقائي وانت بتذاكر' : 'Auto encouragement while studying',
    },
    {
      icon: BarChart3,
      label: isArabic ? 'متابعة أداء حقيقية' : 'Real performance tracking',
    },
    {
      icon: FileCheck,
      label: isArabic ? 'امتحانات مرتبطة بالأبواب' : 'Exams linked to chapters',
    },
  ];

  return (
    <div 
      className={cn(
        "w-full rounded-xl overflow-hidden",
        "bg-card/60 backdrop-blur-sm",
        "border border-border/50",
        "shadow-sm",
        "animate-fade-in",
        className
      )}
    >
      {/* Inner container with subtle gradient */}
      <div className="relative px-4 py-4 md:px-6 md:py-5">
        {/* Subtle ambient glow background */}
        <div 
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, hsl(var(--primary) / 0.08) 0%, transparent 70%)',
          }}
        />
        
        {/* Features grid */}
        <div className="relative flex flex-wrap items-center justify-center gap-4 md:gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className={cn(
                "flex flex-col items-center gap-2",
                "text-center",
                "min-w-[100px] md:min-w-[120px]",
                "focus-feature-item"
              )}
              style={{
                animationDelay: `${index * 0.1}s`,
              }}
            >
              {/* Icon with subtle glow */}
              <div 
                className={cn(
                  "w-10 h-10 md:w-11 md:h-11 rounded-full",
                  "bg-primary/10 border border-primary/20",
                  "flex items-center justify-center",
                  "focus-icon-breathe"
                )}
              >
                <feature.icon className="w-5 h-5 md:w-5 md:h-5 text-primary" />
              </div>
              
              {/* Label */}
              <span className="text-xs md:text-sm font-medium text-foreground/80 leading-tight">
                {feature.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

FocusInfoStrip.displayName = 'FocusInfoStrip';
