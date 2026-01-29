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
import { SEOHead } from '@/components/seo/SEOHead';

interface PressArticle {
  id: number;
  newspaper: string;
  title: string;
  preview: string;
  embedUrl: string;
  isExternal?: boolean;
  thumbnail?: string;
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
      newspaper: isRTL ? 'اكسترا نيوز' : 'Extra News',
      title: isRTL ? 'أحدث تقنيات التعليم في الكيمياء: كيف يوظف الأستاذ حسام فكري التكنولوجيا لنجاح طلاب الثانوية العامة' : 'Latest Education Technologies in Chemistry: How Mr. Hossam Fekry Uses Technology for High School Students Success',
      preview: isRTL ? 'توظيف التكنولوجيا الحديثة في تعليم الكيمياء' : 'Using modern technology in teaching Chemistry',
      embedUrl: 'https://exteranews.com/%D8%A3%D8%AD%D8%AF%D8%AB-%D8%AA%D9%82%D9%86%D9%8A%D8%A7%D8%AA-%D8%A7%D9%84%D8%AA%D8%B9%D9%84%D9%8A%D9%85-%D9%81%D9%8A-%D8%A7%D9%84%D9%83%D9%8A%D9%85%D9%8A%D8%A7%D8%A1-%D9%83%D9%8A%D9%81-%D9%8A%D9%88/',
      isExternal: true,
      thumbnail: '/images/press/extranews-article.png',
    },
    {
      id: 2,
      newspaper: isRTL ? 'مشاهير العرب' : 'Mashaher Net',
      title: isRTL ? 'نصائح ذهبية لطلاب الثانوية العامة.. الأستاذ حسام فكري يكشف أسرار التفوق في الكيمياء' : 'Golden Tips for High School Students.. Mr. Hossam Fekry Reveals Secrets to Excel in Chemistry',
      preview: isRTL ? 'أسرار التفوق في الكيمياء من خبير 25 عاماً' : 'Secrets to excel in Chemistry from a 25-year expert',
      embedUrl: 'https://mashaher.net/?p=148644',
      isExternal: true,
      thumbnail: 'https://mashaher.net/wp-content/uploads/2025/10/548154-560x315.png',
    },
    {
      id: 3,
      newspaper: isRTL ? 'القاهرة تايمز' : 'Al Qahera Times',
      title: isRTL ? 'الأستاذ حسام فكري.. قصة نجاح 25 عاما في الكيمياء' : 'Mr. Hossam Fekry.. A 25-Year Success Story in Chemistry',
      preview: isRTL ? 'نظام متابعة فريد يضمن الدرجة النهائية لطلاب الثانوية العامة' : 'A unique follow-up system that guarantees full marks for high school students',
      embedUrl: 'https://alqaheratimes.com/288588/',
      isExternal: true,
      thumbnail: 'https://alqaheratimes.com/wp-content/uploads/2025/09/%D9%85%D8%B3%D8%AA%D8%B1-%D8%AD%D8%B3%D8%A7%D9%85-%D9%81%D9%83%D8%B1%D9%8A-560x315.png',
    },
    {
      id: 4,
      newspaper: isRTL ? 'التحرير نيوز' : 'El Tahrir News',
      title: isRTL ? 'طلاب الأوائل يشهدون: كيف ساعدهم الأستاذ حسام فكري على التفوق في الكيمياء' : 'Top Students Testify: How Mr. Hossam Fekry Helped Them Excel in Chemistry',
      preview: isRTL ? 'الكيمياء بقت أسهل مادة مع منهجية التدريس المميزة' : 'Chemistry became the easiest subject with the unique teaching methodology',
      embedUrl: 'https://eltahrirnews.com/?p=69401',
      isExternal: true,
      thumbnail: 'https://eltahrirnews.com/wp-content/uploads/2025/09/63683.png',
    },
    {
      id: 5,
      newspaper: isRTL ? 'البيان المصري' : 'El-Bayan El-Masry',
      title: isRTL ? 'الأستاذ حسام فكري: خبرة وتميّز في تدريس الكيمياء للثانوية العامة' : 'Mr. Hossam Fekry: Expertise and Excellence in Teaching Chemistry for High School',
      preview: isRTL ? 'خبرة 25 عاماً في تدريس الكيمياء' : '25 years of experience in teaching Chemistry',
      embedUrl: 'https://www.elbayanelmasry.com/%D8%B9%D8%A7%D8%AC%D9%84/%D8%A7%D9%84%D8%A3%D8%B3%D8%AA%D8%A7%D8%B0-%D8%AD%D8%B3%D8%A7%D9%85-%D9%81%D9%83%D8%B1%D9%8A-%D8%AE%D8%A8%D8%B1%D8%A9-%D9%88%D8%AA%D9%85%D9%8A%D9%91%D8%B2-%D9%81%D9%8A-%D8%AA%D8%AF%D8%B1%D9%8A%D8%B3/',
      isExternal: true,
      thumbnail: '/images/press/elbayan-article.png',
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-mobile-nav" dir={isRTL ? 'rtl' : 'ltr'}>
      <SEOHead 
        title="About Hossam Fekry – 25 Years of Chemistry Teaching Excellence"
        titleAr="عن حسام فكري – 25 عام من التميز في تدريس الكيمياء"
        description="Learn about Mr. Hossam Fekry, Chemistry supervisor with 25 years of experience teaching Thanaweya Amma students."
        descriptionAr="تعرف على الأستاذ حسام فكري، موجه كيمياء بخبرة 25 عام في تدريس طلاب الثانوية العامة."
        canonical="https://hossamfekry.com/about"
      />
      <Navbar />
      
      <main className="pt-24 pb-16 content-appear">
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
                <a 
                  key={article.id}
                  href={article.embedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 group block"
                >
                  {/* Thumbnail */}
                  {article.thumbnail ? (
                    <div className="aspect-video bg-muted overflow-hidden">
                      <img 
                        src={article.thumbnail} 
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                      <Newspaper className="w-12 h-12 text-primary/30" />
                    </div>
                  )}
                  
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full">
                        {article.newspaper}
                      </span>
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    </div>
                    
                    <h3 className="font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                    
                    <p className="text-muted-foreground text-sm line-clamp-2">
                      {article.preview}
                    </p>
                  </div>
                </a>
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
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-4xl max-h-[85vh] p-0 overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
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