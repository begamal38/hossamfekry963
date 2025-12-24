import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Play } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface Lesson {
  id: string;
  title: string;
  titleAr: string;
  duration: string;
  isFree: boolean;
}

const freeLessons: Lesson[] = [
  { id: '1', title: 'Introduction to Organic Chemistry', titleAr: 'مقدمة في الكيمياء العضوية', duration: '25 min', isFree: true },
  { id: '2', title: 'Understanding Carbon Bonding', titleAr: 'فهم روابط الكربون', duration: '30 min', isFree: true },
  { id: '3', title: 'Alkanes: Structure and Properties', titleAr: 'الألكانات: التركيب والخواص', duration: '35 min', isFree: true },
  { id: '4', title: 'Introduction to Electrochemistry', titleAr: 'مقدمة في الكيمياء الكهربائية', duration: '28 min', isFree: true },
  { id: '5', title: 'Understanding Oxidation Numbers', titleAr: 'فهم أعداد التأكسد', duration: '22 min', isFree: true },
  { id: '6', title: 'Balancing Redox Reactions', titleAr: 'موازنة تفاعلات الأكسدة والاختزال', duration: '32 min', isFree: true },
  { id: '7', title: 'Acids and Bases Fundamentals', titleAr: 'أساسيات الأحماض والقواعد', duration: '28 min', isFree: true },
  { id: '8', title: 'pH Scale Explained', titleAr: 'شرح مقياس pH', duration: '20 min', isFree: true },
];

const FreeLessons: React.FC = () => {
  const { language, t } = useLanguage();
  const isArabic = language === 'ar';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in-up">
            <Badge className="mb-4 bg-primary/10 text-primary border-0">
              {t('courses.free')}
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('nav.freeLessons')}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {isArabic 
                ? 'ابدأ رحلة تعلمك مع دروس مجانية عالية الجودة'
                : 'Start your learning journey with high-quality free lessons'
              }
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-accent mx-auto rounded-full mt-6" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-12 animate-fade-in-up animation-delay-100">
            <div className="text-center p-4 bg-card rounded-xl border border-border">
              <p className="text-2xl font-bold text-primary">{freeLessons.length}</p>
              <p className="text-sm text-muted-foreground">{isArabic ? 'دروس مجانية' : 'Free Lessons'}</p>
            </div>
            <div className="text-center p-4 bg-card rounded-xl border border-border">
              <p className="text-2xl font-bold text-primary">4+</p>
              <p className="text-sm text-muted-foreground">{isArabic ? 'ساعات محتوى' : 'Hours Content'}</p>
            </div>
            <div className="text-center p-4 bg-card rounded-xl border border-border">
              <p className="text-2xl font-bold text-primary">5K+</p>
              <p className="text-sm text-muted-foreground">{isArabic ? 'طلاب' : 'Students'}</p>
            </div>
          </div>

          {/* Lessons Grid */}
          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {freeLessons.map((lesson, index) => (
              <div 
                key={lesson.id}
                className={cn(
                  "group flex items-center gap-4 p-5 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 animate-fade-in-up",
                  `animation-delay-${((index % 4) + 1) * 100}`
                )}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Play className="w-5 h-5 text-primary group-hover:text-primary-foreground" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {isArabic ? lesson.titleAr : lesson.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {lesson.duration}
                  </div>
                </div>

                <Button size="sm" variant="outline" className="shrink-0">
                  {isArabic ? 'شاهد' : 'Watch'}
                </Button>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-12 animate-fade-in-up animation-delay-400">
            <p className="text-muted-foreground mb-4">
              {isArabic 
                ? 'هل تريد المزيد؟ سجل للوصول إلى جميع الكورسات'
                : 'Want more? Sign up to access all courses'
              }
            </p>
            <Button variant="hero" size="lg">
              {t('nav.signUp')}
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FreeLessons;
