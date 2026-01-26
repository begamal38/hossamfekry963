import React from 'react';
import { BookOpen, FileCheck, TrendingUp, Award } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
  delay: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, color }) => (
  <div className="bg-card rounded-lg border border-border p-6 2xl:p-8 3xl:p-10 shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
    <div className={cn("w-12 h-12 2xl:w-14 2xl:h-14 rounded-lg flex items-center justify-center mb-4 2xl:mb-6", color)}>
      {icon}
    </div>
    <p className="text-3xl 2xl:text-4xl 3xl:text-5xl font-bold text-foreground mb-1 2xl:mb-2">{value}</p>
    <p className="text-muted-foreground text-sm 2xl:text-base 3xl:text-lg">{label}</p>
  </div>
);

export const ProgressPreviewSection: React.FC = () => {
  const { t, isRTL } = useLanguage();

  const stats = [
    {
      icon: <BookOpen className="w-6 h-6 2xl:w-7 2xl:h-7 text-primary" />,
      value: 18,
      label: t('dashboard.lessonsCompleted'),
      color: 'bg-primary/10',
      delay: 'animation-delay-100',
    },
    {
      icon: <BookOpen className="w-6 h-6 2xl:w-7 2xl:h-7 text-accent" />,
      value: 12,
      label: t('dashboard.lessonsRemaining'),
      color: 'bg-accent/10',
      delay: 'animation-delay-200',
    },
    {
      icon: <FileCheck className="w-6 h-6 2xl:w-7 2xl:h-7 text-green-600" />,
      value: 5,
      label: t('dashboard.examsTaken'),
      color: 'bg-green-100',
      delay: 'animation-delay-300',
    },
    {
      icon: <FileCheck className="w-6 h-6 2xl:w-7 2xl:h-7 text-orange-600" />,
      value: 3,
      label: t('dashboard.examsPending'),
      color: 'bg-orange-100',
      delay: 'animation-delay-400',
    },
  ];

  return (
    <section className="py-20 lg:py-28 2xl:py-32 3xl:py-36 bg-background section-with-depth" dir={isRTL ? 'rtl' : 'ltr'} style={{ contain: 'layout' }}>
      <div className="container mx-auto px-4 2xl:px-8 3xl:px-12 relative z-10">
        <div className="text-center mb-16 2xl:mb-20 3xl:mb-24">
          <h2 className="text-3xl md:text-4xl 2xl:text-5xl 3xl:text-5xl-display font-bold text-foreground mb-4 2xl:mb-6">
            {isRTL ? 'شوف وصلت لفين 🚀' : 'Track Your Progress 🚀'}
          </h2>
          <p className="text-muted-foreground max-w-2xl 2xl:max-w-3xl mx-auto 2xl:text-lg 3xl:text-xl leading-relaxed">
            {isRTL 
              ? 'متابعة لحظة بلحظة.. عشان تعرف إنت ماشي صح ولا لأ'
              : 'Track your learning journey with our comprehensive progress monitoring system'
            }
          </p>
          <div className="w-24 h-1 2xl:w-32 bg-gradient-to-r from-primary to-accent mx-auto rounded-full mt-6 2xl:mt-8" />
        </div>

        <div className="max-w-4xl 2xl:max-w-5xl 3xl:max-w-6xl mx-auto">
          {/* Overall Progress */}
          <div className="bg-card rounded-2xl border border-border p-8 2xl:p-10 3xl:p-12 mb-8 2xl:mb-10 shadow-card">
            <div className="flex items-center justify-between mb-4 2xl:mb-6">
              <div className="flex items-center gap-3 2xl:gap-4">
                <div className="w-12 h-12 2xl:w-14 2xl:h-14 rounded-xl bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 2xl:w-7 2xl:h-7 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground 2xl:text-lg 3xl:text-xl">{t('dashboard.overallProgress')}</h3>
                  <p className="text-sm 2xl:text-base text-muted-foreground">
                    {isRTL ? 'كورس الكيمياء العضوية' : 'Organic Chemistry Course'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 2xl:w-6 2xl:h-6 text-primary" />
                <span className="text-2xl 2xl:text-3xl 3xl:text-4xl font-bold text-primary">60%</span>
              </div>
            </div>
            
            <Progress value={60} className="h-3 2xl:h-4" aria-label={isRTL ? 'التقدم الكلي في الكورس' : 'Overall course progress'} />
            
            <div className="flex justify-between mt-3 2xl:mt-4 text-sm 2xl:text-base text-muted-foreground">
              <span>{isRTL ? '18 درس مكتمل' : '18 lessons completed'}</span>
              <span>{isRTL ? '12 درس متبقي' : '12 lessons remaining'}</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 2xl:gap-6 3xl:gap-8">
            {stats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
