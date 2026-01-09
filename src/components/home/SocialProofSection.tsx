import React from 'react';
import { 
  TrendingUp, 
  Users, 
  BookOpen, 
  Brain, 
  Clock, 
  UserCog, 
  BarChart3, 
  Shield,
  Activity
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SOCIAL PROOF SECTION - Trust-Building Narrative Structure
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const SocialProofSection: React.FC = () => {
  // Core Metrics - Long-term trust indicators
  const coreMetrics = [
    {
      value: '95%',
      label: 'نسبة النجاح',
      description: 'لأن الطالب بيفهم قبل ما يحفظ، وبيتعلم يطبق مش يكرر.',
      icon: TrendingUp,
    },
    {
      value: '+10,000',
      label: 'طالب',
      description: 'طلاب اعتمدوا على المنصة في مذاكرتهم ومكملين عليها.',
      icon: Users,
    },
    {
      value: '+500',
      label: 'حصة تعليمية',
      description: 'محتوى متدرج، مترابط، ومبني على المنهج خطوة بخطوة.',
      icon: BookOpen,
    },
  ];

  // Technology highlights - System differentiation
  const techHighlights = [
    {
      icon: Brain,
      text: 'وضع تركيز ذكي يقيس التفاعل الحقيقي',
    },
    {
      icon: Clock,
      text: 'كل وقت مذاكرة محسوب ومتابَع',
    },
    {
      icon: UserCog,
      text: 'تحكم كامل للمدرس المساعد في الاشتراكات والمحتوى',
    },
    {
      icon: BarChart3,
      text: 'بيانات حقيقية مش مجرد شكل واجهة',
    },
    {
      icon: Shield,
      text: 'تجربة آمنة للطالب والزائر بدون تعقيد',
    },
  ];

  return (
    <section className="py-16 md:py-20 2xl:py-24 bg-background" dir="rtl">
      <div className="container mx-auto px-4 2xl:px-8">
        
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SECTION 1: Core Social Proof - Primary Trust Metrics
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="text-center mb-12 2xl:mb-16">
          <h2 className="text-2xl md:text-3xl 2xl:text-4xl font-bold text-foreground mb-3">
            أرقام حقيقية… وراها سيستم شغال
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            مش مجرد كورسات، دي منظومة تعليم كاملة مبنية على الفهم والمتابعة.
          </p>
        </div>

        {/* Core Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 2xl:gap-8 mb-12 2xl:mb-16">
          {coreMetrics.map((metric, idx) => (
            <Card 
              key={idx}
              className={cn(
                "p-6 md:p-8 2xl:p-10 text-center",
                "bg-card border-border/50",
                "hover:border-primary/30 hover:shadow-lg transition-all duration-300",
                "group"
              )}
            >
              {/* Icon */}
              <div className="w-14 h-14 2xl:w-16 2xl:h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                <metric.icon className="w-7 h-7 2xl:w-8 2xl:h-8 text-primary" />
              </div>
              
              {/* Number + Label */}
              <div className="mb-3">
                <span className="text-4xl md:text-5xl 2xl:text-6xl font-bold text-foreground">
                  {metric.value}
                </span>
                <span className="block text-lg md:text-xl font-semibold text-primary mt-1">
                  {metric.label}
                </span>
              </div>
              
              {/* Description */}
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                {metric.description}
              </p>
            </Card>
          ))}
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SECTION 2: Story Transition - Why These Numbers Exist
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="max-w-3xl mx-auto text-center mb-16 2xl:mb-20">
          <div className="bg-muted/40 rounded-2xl p-6 md:p-8 border border-border/50">
            <p className="text-foreground text-lg md:text-xl leading-loose">
              الأرقام دي ما جاتش بالصدفة.
              <br className="hidden md:block" />
              وراها نظام ذكي بيراقب التفاعل، يقيس التركيز،
              <br className="hidden md:block" />
              ويخلّي كل دقيقة مذاكرة محسوبة فعلًا.
            </p>
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SECTION 3: Live Platform Activity - System Heartbeat
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="mb-16 2xl:mb-20">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Activity className="w-4 h-4 text-green-500 animate-pulse" />
            <span className="text-sm text-muted-foreground font-medium">
              المنصة شغالة دلوقتي
            </span>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {/* Live indicator 1 */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>45 طالب أونلاين حاليًا</span>
            </div>
            
            {/* Live indicator 2 */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4 text-primary/70" />
              <span>طلاب بيبدأوا حصص جديدة باستمرار</span>
            </div>
            
            {/* Live indicator 3 */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpen className="w-4 h-4 text-primary/70" />
              <span>محتوى متاح ومحدث بشكل دائم</span>
            </div>
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SECTION 4: Technology Highlight - System Differentiation
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="max-w-4xl mx-auto mb-12 2xl:mb-16">
          <h3 className="text-xl md:text-2xl font-bold text-foreground text-center mb-8">
            ليه السيستم هنا مختلف؟
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {techHighlights.map((highlight, idx) => (
              <div 
                key={idx}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl",
                  "bg-muted/30 border border-border/30",
                  "hover:bg-muted/50 transition-colors"
                )}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <highlight.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-foreground text-sm md:text-base leading-snug">
                  {highlight.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SECTION 5: Final Reassurance Message
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="text-center">
          <p className="text-muted-foreground text-base md:text-lg leading-loose max-w-2xl mx-auto">
            هنا، الطالب مش لوحده…
            <br />
            السيستم بيتابع، والمحتوى مترتب، والقرار في إيدك.
          </p>
        </div>

      </div>
    </section>
  );
};
