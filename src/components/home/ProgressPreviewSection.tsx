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
  <div className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg transition-shadow duration-300">
    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", color)}>
      {icon}
    </div>
    <p className="text-3xl font-bold text-foreground mb-1">{value}</p>
    <p className="text-muted-foreground text-sm">{label}</p>
  </div>
);

export const ProgressPreviewSection: React.FC = () => {
  const { t, isRTL } = useLanguage();

  const stats = [
    {
      icon: <BookOpen className="w-6 h-6 text-primary" />,
      value: 18,
      label: t('dashboard.lessonsCompleted'),
      color: 'bg-primary/10',
      delay: 'animation-delay-100',
    },
    {
      icon: <BookOpen className="w-6 h-6 text-accent" />,
      value: 12,
      label: t('dashboard.lessonsRemaining'),
      color: 'bg-accent/10',
      delay: 'animation-delay-200',
    },
    {
      icon: <FileCheck className="w-6 h-6 text-green-600" />,
      value: 5,
      label: t('dashboard.examsTaken'),
      color: 'bg-green-100',
      delay: 'animation-delay-300',
    },
    {
      icon: <FileCheck className="w-6 h-6 text-orange-600" />,
      value: 3,
      label: t('dashboard.examsPending'),
      color: 'bg-orange-100',
      delay: 'animation-delay-400',
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-background" dir={isRTL ? 'rtl' : 'ltr'} style={{ contain: 'layout' }}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {isRTL ? 'شوف وصلت لفين 🚀' : 'Track Your Progress 🚀'}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {isRTL 
              ? 'متابعة لحظة بلحظة.. عشان تعرف إنت ماشي صح ولا لأ'
              : 'Track your learning journey with our comprehensive progress monitoring system'
            }
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-primary to-accent mx-auto rounded-full mt-6" />
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Overall Progress */}
          <div className="bg-card rounded-2xl border border-border p-8 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{t('dashboard.overallProgress')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {isRTL ? 'كورس الكيمياء العضوية' : 'Organic Chemistry Course'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold text-primary">60%</span>
              </div>
            </div>
            
            <Progress value={60} className="h-3" />
            
            <div className="flex justify-between mt-3 text-sm text-muted-foreground">
              <span>{isRTL ? '18 درس مكتمل' : '18 lessons completed'}</span>
              <span>{isRTL ? '12 درس متبقي' : '12 lessons remaining'}</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
