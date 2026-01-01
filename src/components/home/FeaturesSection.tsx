import React, { memo } from 'react';
import { Brain, BookOpen, BarChart3, Languages } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

const FeatureCard = memo<FeatureCardProps>(({ icon, title, description, delay }) => (
  <div 
    className={cn(
      "group relative p-6 lg:p-8 2xl:p-10 bg-card rounded-2xl border border-border",
      "hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
      "animate-fade-in-up"
    )}
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    
    <div className="relative z-10">
      <div className="w-12 h-12 lg:w-14 lg:h-14 2xl:w-16 2xl:h-16 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4 lg:mb-6 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
        <div className="text-primary group-hover:text-accent transition-colors duration-300">
          {icon}
        </div>
      </div>
      
      <h3 className="text-lg lg:text-xl 2xl:text-2xl font-bold text-foreground mb-2 lg:mb-3 group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-sm lg:text-base text-muted-foreground leading-relaxed 2xl:text-lg">{description}</p>
    </div>
  </div>
));

FeatureCard.displayName = 'FeatureCard';

export const FeaturesSection: React.FC = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: <Brain className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8" />,
      title: t('features.understanding.title'),
      description: t('features.understanding.desc'),
    },
    {
      icon: <BookOpen className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8" />,
      title: t('features.structured.title'),
      description: t('features.structured.desc'),
    },
    {
      icon: <Languages className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8" />,
      title: t('features.languages.title'),
      description: t('features.languages.desc'),
    },
    {
      icon: <BarChart3 className="w-6 h-6 lg:w-7 lg:h-7 2xl:w-8 2xl:h-8" />,
      title: t('features.tracking.title'),
      description: t('features.tracking.desc'),
    },
  ];

  return (
    <section className="py-10 lg:py-16 2xl:py-20 3xl:py-24 bg-background relative overflow-hidden" style={{ contain: 'layout' }} aria-labelledby="features-heading">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="container mx-auto px-4 2xl:px-8 3xl:px-12 relative z-10">
        <div className="text-center mb-10 lg:mb-14 2xl:mb-18">
          <h2 id="features-heading" className="text-2xl md:text-3xl lg:text-4xl 2xl:text-5xl font-bold text-foreground mb-3 lg:mb-4">
            {t('features.title')}
          </h2>
          <div className="w-20 h-1 lg:w-24 2xl:w-32 bg-gradient-to-r from-primary to-accent mx-auto rounded-full" />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 2xl:gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} delay={index * 100} />
          ))}
        </div>
      </div>
    </section>
  );
};
