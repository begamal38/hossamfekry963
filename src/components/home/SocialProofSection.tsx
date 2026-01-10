import React from 'react';
import { 
  Users, 
  BookOpen, 
  TrendingUp,
  Brain, 
  Eye, 
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlatformStats } from '@/hooks/usePlatformStats';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { useLanguage } from '@/contexts/LanguageContext';
import { useScrollFadeIn } from '@/hooks/useScrollFadeIn';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SOCIAL PROOF SECTION - Numbers to Stories with Scroll Animation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const SocialProofSection: React.FC = () => {
  const { totalStudents, totalLessons, loading } = usePlatformStats();
  const { t, isRTL } = useLanguage();
  const { ref: mainRef, isVisible: mainVisible } = useScrollFadeIn(0.2);
  const { ref: pillarsRef, isVisible: pillarsVisible } = useScrollFadeIn(0.2);

  // Secondary metrics (displayed smaller)
  const secondaryMetrics = [
    {
      value: totalLessons,
      labelKey: 'socialProof.lesson',
      icon: BookOpen,
    },
    {
      value: 95,
      suffix: '%',
      labelKey: 'socialProof.successRate',
      icon: TrendingUp,
    },
  ];

  // Platform Differentiation - 3 pillars only
  const pillars = [
    {
      icon: Brain,
      titleKey: 'socialProof.pillar1',
    },
    {
      icon: Eye,
      titleKey: 'socialProof.pillar2',
    },
    {
      icon: Shield,
      titleKey: 'socialProof.pillar3',
    },
  ];

  return (
    <section className="py-16 md:py-20 bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4">
        
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            HIGHLIGHTED METRIC - One number with human story (Fade-in)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div 
          ref={mainRef}
          className={cn(
            "text-center mb-10 md:mb-12 max-w-2xl mx-auto transition-all duration-700",
            mainVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          {/* Primary Number */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Users className="w-7 h-7 text-primary" />
            </div>
            <span className="text-4xl md:text-5xl font-bold text-foreground">
              {loading ? '...' : <><AnimatedCounter value={totalStudents} />+</>}
            </span>
            <span className="text-xl md:text-2xl font-semibold text-primary">
              {t('socialProof.subscribedStudent')}
            </span>
          </div>
          
          {/* Human Story */}
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-lg mx-auto">
            {t('socialProof.studentStory')}
          </p>
        </div>

        {/* Secondary Metrics - Smaller, supporting (Fade-in with delay) */}
        <div 
          className={cn(
            "flex items-center justify-center gap-8 md:gap-12 mb-14 md:mb-16 transition-all duration-700 delay-150",
            mainVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          {secondaryMetrics.map((metric, idx) => (
            <div key={idx} className="flex items-center gap-2 text-muted-foreground">
              <metric.icon className="w-5 h-5 text-primary/70" />
              <span className="text-lg md:text-xl font-semibold text-foreground">
                {loading ? '...' : (
                  metric.suffix ? `${metric.value}${metric.suffix}` : <AnimatedCounter value={metric.value} />
                )}
              </span>
              <span className="text-sm">{t(metric.labelKey)}</span>
            </div>
          ))}
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            PLATFORM DIFFERENTIATION - Why Different? (Fade-in)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div 
          ref={pillarsRef}
          className={cn(
            "max-w-3xl mx-auto transition-all duration-700",
            pillarsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          <h3 className="text-lg md:text-xl font-bold text-foreground text-center mb-6">
            {t('socialProof.whyDifferent')}
          </h3>
          
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
            {pillars.map((pillar, idx) => (
              <div 
                key={idx}
                className={cn(
                  "flex items-center gap-2.5 px-4 py-2.5 rounded-full",
                  "bg-muted/40 border border-border/30",
                  "text-foreground text-sm font-medium",
                  "transition-all duration-500",
                  pillarsVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
                )}
                style={{ transitionDelay: `${idx * 100 + 200}ms` }}
              >
                <pillar.icon className="w-4 h-4 text-primary" />
                <span>{t(pillar.titleKey)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};