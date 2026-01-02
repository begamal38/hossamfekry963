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
  const { isRTL, t } = useLanguage();
  const { user } = useAuth();
  const { isAssistantTeacher, isAdmin, loading: roleLoading } = useUserRole();

  // Determine if user is staff (assistant or admin)
  const isStaff = isAssistantTeacher() || isAdmin();

  return (
    <section className="relative min-h-[500px] lg:min-h-[600px] pt-20 lg:pt-24 pb-12 lg:pb-16 overflow-hidden bg-gradient-hero">
      {/* 3D Chemistry Background Animation - positioned behind everything */}
      <Hero3DBackground />
      
      {/* Background Glow Effects */}
      <div 
        className="absolute top-1/4 left-1/4 w-72 h-72 lg:w-96 lg:h-96 bg-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none" 
      />
      <div 
        className="absolute bottom-1/4 right-1/4 w-64 h-64 lg:w-80 lg:h-80 bg-accent/15 rounded-full blur-3xl opacity-40 pointer-events-none" 
      />
      
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Stack layout: Landscape image on top, text below */}
        <div className="flex flex-col gap-6 lg:gap-10 items-center">
          
          {/* Landscape Hero Image Slider */}
          <div className="w-full max-w-4xl xl:max-w-5xl">
            <HeroImageSlider className="w-full" />
          </div>

          {/* Content - Below image */}
          <div className="space-y-5 lg:space-y-6 w-full max-w-3xl">
            {/* Main Headline - Translated */}
            <div className="space-y-3 lg:space-y-4 text-center">
              <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-foreground leading-relaxed lg:leading-relaxed">
                {t('hero.title')}
              </h1>
              
              {/* Sub-headline - Translated */}
              <p className="text-base lg:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                {t('hero.subtitle')}
              </p>
              
              {/* Highlight - Tracks - Translated */}
              <p className="text-lg lg:text-xl font-semibold text-primary">
                {t('hero.accent')}
              </p>
            </div>

            {/* CTA Buttons - Role-aware with proper translations */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                // Logged in user - show role-appropriate buttons
                <>
                  {isStaff ? (
                    // Staff (Assistant/Admin) - show admin dashboard button
                    <Button variant="hero" size="lg" asChild>
                      <Link to="/assistant">
                        <Settings className="w-5 h-5" />
                        {t('hero.cta_admin')}
                      </Link>
                    </Button>
                  ) : (
                    // Student - show platform entry button
                    <Button variant="hero" size="lg" asChild>
                      <Link to="/platform">
                        {t('hero.cta_platform')}
                        <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                      </Link>
                    </Button>
                  )}
                  <Button variant="heroOutline" size="lg" asChild>
                    <Link to="/courses">
                      {t('hero.cta_courses')}
                    </Link>
                  </Button>
                </>
              ) : (
                // Not logged in - show clear CTAs
                <>
                  <Button variant="hero" size="lg" asChild>
                    <Link to="/auth?mode=signup">
                      <Play className="w-5 h-5" />
                      {isRTL ? 'ابدأ التعلم' : 'Start Learning'}
                    </Link>
                  </Button>
                  <Button variant="heroOutline" size="lg" asChild>
                    <Link to="/courses">
                      {isRTL ? 'تصفح الكورسات' : 'Browse Courses'}
                      <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                    </Link>
                  </Button>
                </>
              )}
            </div>

            {/* Stats - Translated with enhanced styling */}
            <div className="grid grid-cols-3 gap-4 lg:gap-8 pt-5 border-t border-border/50 max-w-lg mx-auto">
              <div className="text-center group">
                <p className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent group-hover:scale-110 transition-transform inline-block">+500</p>
                <p className="text-xs lg:text-sm text-muted-foreground">{t('hero.stats_lessons')}</p>
              </div>
              <div className="text-center group">
                <p className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent group-hover:scale-110 transition-transform inline-block">+10K</p>
                <p className="text-xs lg:text-sm text-muted-foreground">{t('hero.stats_students')}</p>
              </div>
              <div className="text-center group">
                <p className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent group-hover:scale-110 transition-transform inline-block">95%</p>
                <p className="text-xs lg:text-sm text-muted-foreground">{t('hero.stats_success')}</p>
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
