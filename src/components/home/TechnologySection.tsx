import React from 'react';
import { 
  Focus, 
  Eye, 
  UserCheck, 
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TECHNOLOGY SECTION - System Intelligence (Calm, No Hype)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const TechnologySection: React.FC = () => {
  const systemFeatures = [
    {
      icon: Focus,
      title: 'Focus Mode الحقيقي',
      description: 'مش مجرد تايمر، ده نظام بيقيس تركيزك الفعلي وبيتابع تقدمك.',
    },
    {
      icon: Eye,
      title: 'Preview Logic',
      description: 'شوف قبل ما تدفع، جرب المحتوى وقرر بنفسك.',
    },
    {
      icon: UserCheck,
      title: 'Student State Awareness',
      description: 'المنصة فاهمة انت فين، وبتوجهك للخطوة الجاية.',
    },
    {
      icon: Lock,
      title: 'Assistant-controlled Access',
      description: 'المدرس المساعد بيتحكم في الاشتراكات والوصول بشكل كامل.',
    },
  ];

  return (
    <section className="py-14 md:py-18 bg-muted/20" dir="rtl">
      <div className="container mx-auto px-4">
        
        {/* Section Header */}
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3">
            المنصة مش فيديو… دي نظام ذكي
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">
            كل جزء في المنصة مصمم عشان يساعدك تفهم وتتابع.
          </p>
        </div>

        {/* Features Grid - Simple, no paragraphs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {systemFeatures.map((feature, idx) => (
            <div 
              key={idx}
              className={cn(
                "flex flex-col gap-3 p-5 rounded-xl",
                "bg-background border border-border/50",
                "hover:border-primary/20 transition-colors"
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="text-foreground font-semibold text-sm mb-1.5">
                  {feature.title}
                </h4>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};