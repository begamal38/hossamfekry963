import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ExternalLink, Newspaper, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useCallback, useEffect, useState, useRef } from 'react';

interface PressArticle {
  id: number;
  newspaper: string;
  title: string;
  preview: string;
  embedUrl: string;
  isExternal: boolean;
  thumbnail?: string;
}

export const PressSection: React.FC = () => {
  const { isRTL } = useLanguage();
  
  // Autoplay plugin with 3.5 second delay
  const autoplayPlugin = useRef(
    Autoplay({ delay: 3500, stopOnInteraction: false, stopOnMouseEnter: true })
  );
  
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true, 
    align: 'start',
    direction: isRTL ? 'rtl' : 'ltr',
    slidesToScroll: 1,
  }, [autoplayPlugin.current]);
  
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

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

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  return (
    <section className="py-16 bg-muted/30 section-with-depth" dir={isRTL ? 'rtl' : 'ltr'} style={{ contain: 'layout' }}>
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Newspaper className="w-8 h-8 text-primary" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              {isRTL ? 'كلام الصحافة عن حسام فكري' : 'Press Coverage'}
            </h2>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {isRTL 
              ? 'ما قالته الصحف والمواقع الإخبارية عن الأستاذ حسام فكري ومنهجيته في التدريس'
              : 'What newspapers and news sites have said about Mr. Hossam Fekry and his teaching methodology'
            }
          </p>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Navigation Buttons */}
          <Button
            variant="outline"
            size="icon"
            className={`absolute top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm hover:bg-background ${isRTL ? '-right-4 md:-right-6' : '-left-4 md:-left-6'}`}
            onClick={isRTL ? scrollNext : scrollPrev}
            disabled={isRTL ? !canScrollNext : !canScrollPrev}
            aria-label={isRTL ? 'المقال التالي' : 'Previous article'}
          >
            {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className={`absolute top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm hover:bg-background ${isRTL ? '-left-4 md:-left-6' : '-right-4 md:-right-6'}`}
            onClick={isRTL ? scrollPrev : scrollNext}
            disabled={isRTL ? !canScrollPrev : !canScrollNext}
            aria-label={isRTL ? 'المقال السابق' : 'Next article'}
          >
            {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>

          <div className="overflow-hidden mx-8" ref={emblaRef}>
            <div className="flex gap-6">
              {pressArticles.map((article) => (
                <div
                  key={article.id}
                  className="flex-none w-full sm:w-1/2 lg:w-1/3"
                >
                  <a
                    href={article.embedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                  >
                    <div className="bg-card rounded-xl overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300 border border-border/50 h-full hover:-translate-y-1">
                      {/* Thumbnail - fixed dimensions */}
                      <div className="relative h-48 overflow-hidden bg-muted">
                        {article.thumbnail ? (
                          <img
                            src={article.thumbnail}
                            alt={article.title}
                            width={400}
                            height={192}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                            <Newspaper className="w-16 h-16 text-primary/40" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                            {article.newspaper}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <h3 className="font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                          {article.title}
                        </h3>
                        <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                          {article.preview}
                        </p>
                        <div className="flex items-center gap-2 text-primary text-sm font-medium">
                          <span>{isRTL ? 'اقرأ المقال' : 'Read Article'}</span>
                          <ExternalLink className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
