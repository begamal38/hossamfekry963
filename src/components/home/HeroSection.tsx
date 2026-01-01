import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { HeroImageSlider } from './HeroImageSlider';
import { Hero3DBackground } from './Hero3DBackground';

export const HeroSection: React.FC = () => {
  const { isRTL } = useLanguage();
  const { user } = useAuth();
  const { isAssistantTeacher, isAdmin, loading: roleLoading } = useUserRole();

  // Determine if user is staff (assistant or admin)
  const isStaff = isAssistantTeacher() || isAdmin();

  return (
    <section className="relative min-h-[500px] lg:min-h-[600px] pt-20 lg:pt-24 pb-12 lg:pb-16 overflow-hidden bg-gradient-hero">
      {/* 3D Chemistry Background Animation */}
      <Hero3DBackground />
      
      {/* Background Glow Effects */}
      <div 
        className="absolute top-1/4 left-1/4 w-72 h-72 lg:w-96 lg:h-96 bg-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none" 
      />
      <div 
        className="absolute bottom-1/4 right-1/4 w-64 h-64 lg:w-80 lg:h-80 bg-accent/15 rounded-full blur-3xl opacity-40 pointer-events-none" 
      />
      
      <div className="container mx-auto px-4 lg:px-8">
        {/* Stack layout: Landscape image on top, text below */}
        <div className="flex flex-col gap-6 lg:gap-10 items-center">
          
          {/* Landscape Hero Image Slider */}
          <div className="w-full max-w-4xl xl:max-w-5xl">
            <HeroImageSlider className="w-full" />
          </div>

          {/* Content - Below image */}
          <div className="space-y-5 lg:space-y-6 w-full max-w-3xl">
            {/* Main Headline - New Copy */}
            <div className="space-y-3 lg:space-y-4 text-center">
              <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-foreground leading-relaxed lg:leading-relaxed">
                Egypt's #1 Chemistry Platform for Thanaweya Amma
              </h1>
              
              {/* Sub-headline */}
              <p className="text-base lg:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                Clear explanation • Practical application • Smart testing
              </p>
              
              {/* Highlight - Tracks */}
              <p className="text-lg lg:text-xl font-semibold text-primary">
                Arabic + Languages
              </p>
            </div>

            {/* CTA Buttons - Role-aware */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                // Logged in user - show role-appropriate buttons
                <>
                  {isStaff ? (
                    // Staff (Assistant/Admin) - show admin dashboard button
                    <Button variant="hero" size="lg" asChild>
                      <Link to="/assistant">
                        <Settings className="w-5 h-5" />
                        إدارة المنصة
                      </Link>
                    </Button>
                  ) : (
                    // Student - show platform entry button
                    <Button variant="hero" size="lg" asChild>
                      <Link to="/platform">
                        دخول المنصة
                        <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                      </Link>
                    </Button>
                  )}
                  <Button variant="heroOutline" size="lg" asChild>
                    <Link to="/courses">
                      تصفح الكورسات
                    </Link>
                  </Button>
                </>
              ) : (
                // Not logged in - show default buttons
                <>
                  <Button variant="hero" size="lg" asChild>
                    <Link to="/courses">
                      تصفح الكورسات
                      <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                    </Link>
                  </Button>
                  <Button variant="heroOutline" size="lg" asChild>
                    <Link to="/auth?mode=signup">
                      <Play className="w-5 h-5" />
                      إنشاء حساب
                    </Link>
                  </Button>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 lg:gap-8 pt-5 border-t border-border max-w-lg mx-auto">
              <div className="text-center">
                <p className="text-2xl lg:text-3xl font-bold text-primary">+500</p>
                <p className="text-xs lg:text-sm text-muted-foreground">حصة</p>
              </div>
              <div className="text-center">
                <p className="text-2xl lg:text-3xl font-bold text-primary">+10K</p>
                <p className="text-xs lg:text-sm text-muted-foreground">طالب</p>
              </div>
              <div className="text-center">
                <p className="text-2xl lg:text-3xl font-bold text-primary">95%</p>
                <p className="text-xs lg:text-sm text-muted-foreground">نسبة النجاح</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 80L60 72C120 64 240 48 360 42.7C480 37 600 43 720 48C840 53 960 59 1080 56C1200 53 1320 43 1380 37.3L1440 32V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z" fill="hsl(var(--background))" />
        </svg>
      </div>
    </section>
  );
};
