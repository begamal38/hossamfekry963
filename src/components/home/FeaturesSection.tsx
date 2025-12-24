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

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, delay }) => (
  <div className={cn(
    "group relative p-8 bg-card rounded-2xl border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-in-up",
    delay
  )}>
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
    
    <div className="relative z-10">
      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
        <div className="text-primary">
          {icon}
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-foreground mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  </div>
);

export const FeaturesSection: React.FC = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: <Brain className="w-7 h-7" />,
      title: t('features.understanding.title'),
      description: t('features.understanding.desc'),
      delay: 'animation-delay-100',
    },
    {
      icon: <BookOpen className="w-7 h-7" />,
      title: t('features.structured.title'),
      description: t('features.structured.desc'),
      delay: 'animation-delay-200',
    },
    {
      icon: <BarChart3 className="w-7 h-7" />,
      title: t('features.tracking.title'),
      description: t('features.tracking.desc'),
      delay: 'animation-delay-300',
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t('features.title')}
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-primary to-accent mx-auto rounded-full" />
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};
