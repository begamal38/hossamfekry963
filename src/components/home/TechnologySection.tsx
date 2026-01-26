import React from 'react';
import { 
  Focus, 
  Eye, 
  UserCheck, 
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useScrollFadeIn } from '@/hooks/useScrollFadeIn';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TECHNOLOGY SECTION - System Intelligence with Scroll Animation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const TechnologySection: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { ref: headerRef, isVisible: headerVisible } = useScrollFadeIn(0.2);
  const { ref: gridRef, isVisible: gridVisible } = useScrollFadeIn(0.15);

  const systemFeatures = [
    {
      icon: Focus,
      titleKey: 'tech.focusMode',
      descKey: 'tech.focusModeDesc',
    },
    {
      icon: Eye,
      titleKey: 'tech.previewLogic',
      descKey: 'tech.previewLogicDesc',
    },
    {
      icon: UserCheck,
      titleKey: 'tech.studentAwareness',
      descKey: 'tech.studentAwarenessDesc',
    },
    {
      icon: TrendingUp,
      titleKey: 'tech.progressTracking',
      descKey: 'tech.progressTrackingDesc',
    },
  ];

  return (
    <section className="py-14 md:py-18 bg-muted/20 section-with-depth" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 relative z-10">
        
        {/* Section Header with Fade-in */}
        <div 
          ref={headerRef}
          className={cn(
            "text-center mb-10 md:mb-12 transition-all duration-700",
            headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3">
            {t('tech.title')}
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">
            {t('tech.subtitle')}
          </p>
        </div>

        {/* Features Grid with Staggered Fade-in */}
        <div 
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto"
        >
          {systemFeatures.map((feature, idx) => (
            <div 
              key={idx}
              className={cn(
                "flex flex-col gap-3 p-5 rounded-lg",
                "bg-background border border-border/50",
                "shadow-card hover:shadow-elevated hover:border-primary/20",
                "transition-all duration-300",
                gridVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              )}
              style={{ transitionDelay: `${idx * 100}ms` }}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="text-foreground font-semibold text-sm mb-1.5">
                  {t(feature.titleKey)}
                </h4>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {t(feature.descKey)}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};