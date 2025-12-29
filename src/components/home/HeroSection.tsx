import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import teacherImage from '@/assets/teacher.jpg';

const MoleculeScene = lazy(() => import('@/components/3d/MoleculeScene'));

const HeroFallback: React.FC = () => (
  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/10 rounded-3xl flex items-center justify-center">
    <div className="w-32 h-32 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 animate-pulse" />
  </div>
);

export const HeroSection: React.FC = () => {
  const { isRTL } = useLanguage();
  const [showMolecule, setShowMolecule] = useState(false);

  // Defer 3D scene loading to avoid blocking critical rendering path
  useEffect(() => {
    const timer = setTimeout(() => setShowMolecule(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative min-h-[700px] lg:min-h-[850px] pt-20 overflow-hidden bg-gradient-hero">
      {/* Background Glow Effects - Static, no animations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50" style={{ transform: 'translateZ(0)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/15 rounded-full blur-3xl opacity-40" style={{ transform: 'translateZ(0)' }} />
      
      <div className="container mx-auto px-4 py-8 lg:py-16">
        {/* Mobile: Image First, Desktop: Side by Side */}
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Teacher Image with 3D Scene - FIRST on mobile */}
          <div className={`relative h-[300px] sm:h-[350px] lg:h-[500px] w-full order-1 lg:order-none ${isRTL ? 'lg:order-1' : ''}`} style={{ contain: 'layout size' }}>
            {/* 3D Background - fixed container */}
            <div className="absolute inset-0 z-0" style={{ contain: 'strict' }}>
              {showMolecule ? (
                <Suspense fallback={<HeroFallback />}>
                  <MoleculeScene />
                </Suspense>
              ) : (
                <HeroFallback />
              )}
            </div>
            
            {/* Teacher Image */}
            <div className="relative z-10 flex items-center justify-center h-full">
              <div className="relative">
                {/* Glow effect behind image - static */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-xl" style={{ transform: 'scale(1.05) translateZ(0)' }} />
                
                <img 
                  src={teacherImage} 
                  alt="Hossam Fekry - Chemistry Teacher"
                  width={400}
                  height={500}
                  className="relative rounded-2xl shadow-2xl max-h-[280px] sm:max-h-[320px] lg:max-h-[450px] w-auto object-cover border-4 border-background/50"
                  fetchPriority="high"
                  loading="eager"
                />
              </div>
            </div>
          </div>

          {/* Content - SECOND on mobile */}
          <div className={`space-y-6 lg:space-y-8 order-2 lg:order-none ${isRTL ? 'lg:order-2' : ''}`}>
            <div className="space-y-4 animate-fade-in-up text-center lg:text-right">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                كيمياء الثانوية العامة
              </div>
              
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                أهلاً بيك أيها الطالب في المنصة رقم 1 في مصر لتعليم الكيمياء للثانوية العامة
              </h1>
              
              <p className="text-base md:text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0">
                شرح واضح – تطبيق عملي – اختبارات ذكية
                <br />
                <span className="text-primary font-semibold">عربي + لغات</span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in-up animation-delay-200">
              <Button variant="hero" size="xl" asChild>
                <Link to="/courses">
                  تصفح الكورسات
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="heroOutline" size="xl" asChild>
                <Link to="/auth?mode=signup">
                  <Play className="w-5 h-5" />
                  إنشاء حساب
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 lg:gap-6 pt-6 lg:pt-8 border-t border-border animate-fade-in-up animation-delay-300">
              <div className="text-center lg:text-right">
                <p className="text-2xl lg:text-3xl font-bold text-primary">+500</p>
                <p className="text-xs lg:text-sm text-muted-foreground">فيديو تعليمي</p>
              </div>
              <div className="text-center lg:text-right">
                <p className="text-2xl lg:text-3xl font-bold text-primary">+10K</p>
                <p className="text-xs lg:text-sm text-muted-foreground">طالب</p>
              </div>
              <div className="text-center lg:text-right">
                <p className="text-2xl lg:text-3xl font-bold text-primary">95%</p>
                <p className="text-xs lg:text-sm text-muted-foreground">نسبة نجاح</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 120L48 110C96 100 192 80 288 70C384 60 480 60 576 65C672 70 768 80 864 85C960 90 1056 90 1152 85C1248 80 1344 70 1392 65L1440 60V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0Z" fill="hsl(var(--background))"/>
        </svg>
      </div>
    </section>
  );
};