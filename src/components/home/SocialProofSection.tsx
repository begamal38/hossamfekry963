import React from 'react';
import { 
  TrendingUp, 
  Users, 
  BookOpen, 
  Brain, 
  Eye, 
  Shield
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { usePlatformStats } from '@/hooks/usePlatformStats';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SOCIAL PROOF SECTION - Single Strategic Block
// ONE dedicated section with numbers transformed into stories
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const SocialProofSection: React.FC = () => {
  const { totalStudents, totalLessons, loading } = usePlatformStats();

  // Core Metrics with narrative descriptions
  const coreMetrics = [
    {
      value: totalStudents,
      suffix: '+',
      label: 'طالب حاليًا',
      story: 'طلاب حقيقيين بيتابعوا وبيكملوا',
      icon: Users,
    },
    {
      value: totalLessons,
      suffix: '',
      label: 'حصة',
      story: 'محتوى متراكم ومترابط، مش فيديوهات منفصلة',
      icon: BookOpen,
    },
    {
      value: 95,
      suffix: '%',
      label: 'نسبة النجاح',
      story: 'نسبة مبنية على متابعة وفهم، مش حفظ',
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
      title: 'نظام تركيز حقيقي مش شكلي',
    },
    {
      icon: Shield,
      title: 'تجربة قبل الدفع (مش وعود)',
    },
  ];

  return (
    <section className="py-16 md:py-20 bg-background" dir="rtl">
      <div className="container mx-auto px-4">
        
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SINGLE SOCIAL PROOF BLOCK - Numbers as Stories
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="text-center mb-10 md:mb-14">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            أرقام حقيقية… مش وعود
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-base leading-relaxed">
            كل رقم وراه قصة، وكل قصة مبنية على نظام حقيقي.
          </p>
        </div>

        {/* Core Metrics Grid - Stories not just numbers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 mb-14 md:mb-18 max-w-4xl mx-auto">
          {coreMetrics.map((metric, idx) => (
            <Card 
              key={idx}
              className={cn(
                "p-6 md:p-7 text-center",
                "bg-card border-border/50",
                "hover:border-primary/30 hover:shadow-md transition-all duration-300",
                "group"
              )}
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                <metric.icon className="w-6 h-6 text-primary" />
              </div>
              
              {/* Number + Label */}
              <div className="mb-3">
                <span className="text-3xl md:text-4xl font-bold text-foreground">
                  {loading ? '...' : (
                    <>
                      {metric.suffix === '%' ? (
                        <>{metric.value}{metric.suffix}</>
                      ) : (
                        <><AnimatedCounter value={metric.value} />{metric.suffix}</>
                      )}
                    </>
                  )}
                </span>
                <span className="block text-base font-semibold text-primary mt-1">
                  {metric.label}
                </span>
              </div>
              
              {/* Story - Human context */}
              <p className="text-muted-foreground text-sm leading-relaxed">
                {metric.story}
              </p>
            </Card>
          ))}
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            PLATFORM DIFFERENTIATION - 3 Pillars Only
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="max-w-3xl mx-auto mb-14 md:mb-16">
          <h3 className="text-xl md:text-2xl font-bold text-foreground text-center mb-8">
            ليه منصة حسام فكري مختلفة؟
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {pillars.map((pillar, idx) => (
              <div 
                key={idx}
                className={cn(
                  "flex flex-col items-center text-center gap-3 p-5 rounded-xl",
                  "bg-muted/30 border border-border/30",
                  "hover:bg-muted/50 transition-colors"
                )}
              >
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
                  <pillar.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-foreground text-sm font-medium leading-snug">
                  {pillar.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            FINAL REASSURANCE - Subtle, no CTA
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="text-center max-w-xl mx-auto">
          <p className="text-muted-foreground text-base leading-loose">
            هنا، الطالب مش لوحده…
            <br />
            السيستم بيتابع، والمحتوى مترتب، والقرار في إيدك.
          </p>
        </div>

      </div>
    </section>
  );
};