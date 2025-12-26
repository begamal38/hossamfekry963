import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { GraduationCap, Award, Users, BookOpen, Tv, Calendar, Heart, Rocket, Newspaper, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import teacherImage from '@/assets/teacher.jpg';

interface PressArticle {
  id: number;
  newspaper: string;
  title: string;
  preview: string;
  embedUrl: string;
}

const About = () => {
  const { t, isRTL } = useLanguage();
  const [selectedArticle, setSelectedArticle] = useState<PressArticle | null>(null);

  const stats = [
    {
      icon: Calendar,
      value: '25',
      label: t('about.stats.experience'),
    },
    {
      icon: Users,
      value: '+10,000',
      label: t('about.stats.students'),
    },
    {
      icon: Tv,
      value: '2020',
      label: t('about.stats.channelStart'),
    },
    {
      icon: Award,
      value: isRTL ? 'موجه' : 'Supervisor',
      label: t('about.stats.role'),
    },
  ];

  const pressArticles: PressArticle[] = [
    {
      id: 1,
      newspaper: isRTL ? 'اليوم السابع' : 'Youm7',
      title: isRTL ? 'نصائح ذهبية لطلاب الثانوية العامة في مادة الكيمياء' : 'Golden Tips for High School Students in Chemistry',
      preview: isRTL ? 'حسام فكري يكشف أسرار التفوق في الكيمياء' : 'Hossam Fekry reveals secrets to excel in Chemistry',
      embedUrl: 'https://www.youm7.com/embed/article1',
    },
    {
      id: 2,
      newspaper: isRTL ? 'الوطن' : 'Al-Watan',
      title: isRTL ? 'موجه الكيمياء يشرح منهج التعليم الجديد' : 'Chemistry Supervisor Explains New Curriculum',
      preview: isRTL ? 'نظام تعليمي مبتكر لفهم الكيمياء بدون حفظ' : 'Innovative teaching system to understand Chemistry without memorization',
      embedUrl: 'https://www.elwatannews.com/embed/article2',
    },
    {
      id: 3,
      newspaper: isRTL ? 'المصري اليوم' : 'Al-Masry Al-Youm',
      title: isRTL ? 'كيف تذاكر الكيمياء صح؟' : 'How to Study Chemistry Right?',
      preview: isRTL ? 'خطة مذاكرة عملية من خبير 25 سنة' : 'Practical study plan from a 25-year expert',
      embedUrl: 'https://www.almasryalyoum.com/embed/article3',
    },
    {
      id: 4,
      newspaper: isRTL ? 'صدى البلد' : 'Sada El-Balad',
      title: isRTL ? 'حسام فكري: الفهم أهم من الحفظ' : 'Hossam Fekry: Understanding is More Important than Memorization',
      preview: isRTL ? 'فلسفة تدريسية غيرت حياة آلاف الطلاب' : 'A teaching philosophy that changed thousands of students lives',
      embedUrl: 'https://www.sadaelbalad.com/embed/article4',
    },
    {
      id: 5,
      newspaper: isRTL ? 'الأهرام' : 'Al-Ahram',
      title: isRTL ? 'تجربة التعليم عن بعد في زمن كورونا' : 'Remote Learning Experience During COVID',
      preview: isRTL ? 'قصة نجاح منصة تعليمية مصرية' : 'Success story of an Egyptian educational platform',
      embedUrl: 'https://www.ahram.org.eg/embed/article5',
    },
  ];

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          
          {/* Hero Section */}
          <section className="mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className={`${isRTL ? 'order-2 lg:order-1' : 'order-2 lg:order-1'}`}>
                <span className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                  {t('about.badge')}
                </span>
                
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
                  {t('about.title')}
                </h1>
                
                <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                  {t('about.intro')}
                </p>
                
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {t('about.description1')}
                </p>
                
                <p className="text-muted-foreground leading-relaxed">
                  {t('about.description2')}
                </p>
              </div>
              
              <div className={`${isRTL ? 'order-1 lg:order-2' : 'order-1 lg:order-2'} flex justify-center`}>
                <div className="relative">
                  <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-xl"></div>
                  <img 
                    src={teacherImage} 
                    alt="حسام فكري"
                    className="relative w-80 h-80 md:w-96 md:h-96 object-cover rounded-3xl shadow-2xl"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="mb-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div 
                  key={index}
                  className="bg-card border border-border rounded-2xl p-6 text-center hover:shadow-lg transition-shadow"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-3xl font-bold text-primary mb-2">{stat.value}</p>
                  <p className="text-muted-foreground text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Experience Section */}
          <section className="mb-20">
            <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <GraduationCap className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  {t('about.trust.title')}
                </h2>
              </div>
              
              <div className="space-y-6 text-muted-foreground leading-relaxed">
                <p>{t('about.trust.p1')}</p>
                <p>{t('about.trust.p2')}</p>
                <p>{t('about.trust.p3')}</p>
                
                <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
                  <p className="text-foreground font-medium">
                    {t('about.trust.highlight')}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Press Articles Section */}
          <section className="mb-20">
            <div className="text-center mb-12">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Newspaper className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                {t('about.press.title')}
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                {t('about.press.subtitle')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pressArticles.map((article) => (
                <div 
                  key={article.id}
                  className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all hover:-translate-y-1 group"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full">
                      {article.newspaper}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {article.title}
                  </h3>
                  
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-1">
                    {article.preview}
                  </p>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    onClick={() => setSelectedArticle(article)}
                  >
                    <ExternalLink className="w-4 h-4" />
                    {t('about.press.readArticle')}
                  </Button>
                </div>
              ))}
            </div>
          </section>

          {/* Turning Point Section */}
          <section className="mb-20">
            <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 rounded-3xl p-8 md:p-12">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center">
                  <Rocket className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  {t('about.platform.title')}
                </h2>
              </div>
              
              <div className="space-y-6 text-muted-foreground leading-relaxed">
                <p>{t('about.platform.p1')}</p>
                <p>{t('about.platform.p2')}</p>
                <p>{t('about.platform.p3')}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div className="bg-background/50 rounded-2xl p-6 border border-border">
                    <BookOpen className="w-8 h-8 text-primary mb-4" />
                    <h3 className="font-bold text-foreground mb-2">{t('about.platform.lessons.title')}</h3>
                    <p className="text-sm">{t('about.platform.lessons.desc')}</p>
                  </div>
                  
                  <div className="bg-background/50 rounded-2xl p-6 border border-border">
                    <Users className="w-8 h-8 text-primary mb-4" />
                    <h3 className="font-bold text-foreground mb-2">{t('about.platform.tracking.title')}</h3>
                    <p className="text-sm">{t('about.platform.tracking.desc')}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Closing Message */}
          <section>
            <div className="bg-card border border-border rounded-3xl p-8 md:p-12 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-primary" />
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
                {t('about.message.title')}
              </h2>
              
              <div className="max-w-2xl mx-auto space-y-4 text-muted-foreground leading-relaxed">
                <p>{t('about.message.p1')}</p>
                <p>{t('about.message.p2')}</p>
                <p>{t('about.message.p3')}</p>
                <p className="text-foreground font-bold text-lg pt-4">
                  {t('about.message.cta')}
                </p>
              </div>
              
              <div className="mt-8">
                <Button size="lg" asChild className="px-8">
                  <Link to="/auth?mode=signup">
                    {t('nav.signUp')}
                  </Link>
                </Button>
              </div>
            </div>
          </section>
          
        </div>
      </main>

      {/* Article Modal */}
      <Dialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
        <DialogContent className="max-w-4xl h-[80vh] p-0 overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full">
                {selectedArticle?.newspaper}
              </span>
            </div>
            <DialogTitle className="text-xl font-bold text-foreground">
              {selectedArticle?.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 p-6 pt-4 overflow-hidden">
            <div className="w-full h-full bg-muted rounded-xl flex items-center justify-center">
              {selectedArticle && (
                <iframe
                  src={selectedArticle.embedUrl}
                  className="w-full h-full rounded-xl border-0"
                  title={selectedArticle.title}
                  loading="lazy"
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default About;