import React from 'react';
import { 
  Users, 
  BookOpen, 
  TrendingUp,
  Brain, 
  Eye, 
  Shield
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { usePlatformStats } from '@/hooks/usePlatformStats';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SOCIAL PROOF SECTION - Numbers to Stories
// One highlighted metric with human context, secondary metrics below
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const SocialProofSection: React.FC = () => {
  const { totalStudents, totalLessons, loading } = usePlatformStats();

  // Secondary metrics (displayed smaller)
  const secondaryMetrics = [
    {
      value: totalLessons,
      label: 'حصة',
      icon: BookOpen,
    },
    {
      value: 95,
      suffix: '%',
      label: 'نسبة النجاح',
      icon: TrendingUp,
    },
  ];

  // Platform Differentiation - 3 pillars only
  const pillars = [
    {
      icon: Brain,
      title: 'الفهم قبل الحفظ',
    },
    {
      icon: Eye,
      title: 'نظام تركيز حقيقي',
    },
    {
      icon: Shield,
      title: 'تجربة قبل الدفع',
    },
  ];

  return (
    <section className="py-16 md:py-20 bg-background" dir="rtl">
      <div className="container mx-auto px-4">
        
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            HIGHLIGHTED METRIC - One number with human story
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="text-center mb-10 md:mb-12 max-w-2xl mx-auto">
          {/* Primary Number */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Users className="w-7 h-7 text-primary" />
            </div>
            <span className="text-4xl md:text-5xl font-bold text-foreground">
              {loading ? '...' : <><AnimatedCounter value={totalStudents} />+</>}
            </span>
            <span className="text-xl md:text-2xl font-semibold text-primary">
              طالب مشترك
            </span>
          </div>
          
          {/* Human Story */}
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-lg mx-auto">
            أغلبهم بدأوا بحصة مجانية وجربوا الشرح بنفسهم.
          </p>
        </div>

        {/* Secondary Metrics - Smaller, supporting */}
        <div className="flex items-center justify-center gap-8 md:gap-12 mb-14 md:mb-16">
          {secondaryMetrics.map((metric, idx) => (
            <div key={idx} className="flex items-center gap-2 text-muted-foreground">
              <metric.icon className="w-5 h-5 text-primary/70" />
              <span className="text-lg md:text-xl font-semibold text-foreground">
                {loading ? '...' : (
                  metric.suffix ? `${metric.value}${metric.suffix}` : <AnimatedCounter value={metric.value} />
                )}
              </span>
              <span className="text-sm">{metric.label}</span>
            </div>
          ))}
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            PLATFORM DIFFERENTIATION - Why Different?
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="max-w-3xl mx-auto">
          <h3 className="text-lg md:text-xl font-bold text-foreground text-center mb-6">
            ليه مختلفة؟
          </h3>
          
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
            {pillars.map((pillar, idx) => (
              <div 
                key={idx}
                className={cn(
                  "flex items-center gap-2.5 px-4 py-2.5 rounded-full",
                  "bg-muted/40 border border-border/30",
                  "text-foreground text-sm font-medium"
                )}
              >
                <pillar.icon className="w-4 h-4 text-primary" />
                <span>{pillar.title}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};