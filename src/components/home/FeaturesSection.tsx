import React from 'react';
import { Brain, BookOpen, BarChart3 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <div className="group relative p-8 2xl:p-10 3xl:p-12 bg-card rounded-2xl border border-border hover:border-primary/30 transition-colors duration-300 hover:shadow-lg">
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
    
    <div className="relative z-10">
      <div className="w-14 h-14 2xl:w-16 2xl:h-16 3xl:w-18 3xl:h-18 rounded-xl bg-primary/10 flex items-center justify-center mb-6 2xl:mb-8 group-hover:bg-primary/20 transition-colors">
        <div className="text-primary">
          {icon}
        </div>
      </div>
      
      <h3 className="text-xl 2xl:text-2xl 3xl:text-3xl font-bold text-foreground mb-3 2xl:mb-4">{title}</h3>
      <p className="text-muted-foreground leading-relaxed 2xl:text-lg 3xl:text-xl">{description}</p>
    </div>
  </div>
);

export const FeaturesSection: React.FC = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: <Brain className="w-7 h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />,
      title: t('features.understanding.title'),
      description: t('features.understanding.desc'),
      delay: 'animation-delay-100',
    },
    {
      icon: <BookOpen className="w-7 h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />,
      title: t('features.structured.title'),
      description: t('features.structured.desc'),
      delay: 'animation-delay-200',
    },
    {
      icon: <BarChart3 className="w-7 h-7 2xl:w-8 2xl:h-8 3xl:w-9 3xl:h-9" />,
      title: t('features.tracking.title'),
      description: t('features.tracking.desc'),
      delay: 'animation-delay-300',
    },
  ];

  return (
    <section className="py-12 lg:py-20 2xl:py-24 3xl:py-28 bg-background" style={{ contain: 'layout' }}>
      <div className="container mx-auto px-4 2xl:px-8 3xl:px-12">
        <div className="text-center mb-16 2xl:mb-20 3xl:mb-24">
          <h2 className="text-3xl md:text-4xl 2xl:text-5xl 3xl:text-5xl-display font-bold text-foreground mb-4 2xl:mb-6">
            {t('features.title')}
          </h2>
          <div className="w-24 h-1 2xl:w-32 bg-gradient-to-r from-primary to-accent mx-auto rounded-full" />
        </div>

        <div className="grid md:grid-cols-3 gap-8 2xl:gap-10 3xl:gap-12">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};
