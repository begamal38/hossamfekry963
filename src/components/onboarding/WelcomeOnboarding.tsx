import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Gift, ArrowLeft, CheckCircle2, BookOpen, Focus, BarChart3, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNewUserOnboarding } from '@/hooks/useNewUserOnboarding';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Welcome Onboarding for first-time students
 * 4-Step Ana Vodafone inspired flow:
 * Step 1: Welcome
 * Step 2: Value Bullets
 * Step 3: Trial Rules
 * Step 4: Start CTA
 * 
 * Arabic UX - Gen Z friendly tone
 * Mobile: Full-screen modal with safe bottom spacing (above bottom nav)
 */
export const WelcomeOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { shouldShowWelcome, markOnboardingComplete } = useNewUserOnboarding();
  
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (visible && shouldShowWelcome) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [visible, shouldShowWelcome]);

  useEffect(() => {
    if (shouldShowWelcome) {
      // Delay showing to let profile modal close completely
      const timer = setTimeout(() => {
        setVisible(true);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [shouldShowWelcome]);

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(() => {
      markOnboardingComplete();
      setVisible(false);
    }, 300);
  };

  const handleStartTrial = () => {
    markOnboardingComplete();
    navigate('/free-lessons');
  };

  const handleNextStep = () => {
    if (step < 4) {
      setStep((s) => (s + 1) as 1 | 2 | 3 | 4);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep((s) => (s - 1) as 1 | 2 | 3 | 4);
    }
  };

  if (!visible || !shouldShowWelcome) return null;

  // Value bullets for step 2
  const valueBullets = [
    { icon: BookOpen, text: 'حصص مجانية حقيقية', color: 'text-green-600 bg-green-500/10' },
    { icon: Focus, text: 'نظام تركيز ذكي', color: 'text-purple-600 bg-purple-500/10' },
    { icon: BarChart3, text: 'اختبارات وتحليل أداء', color: 'text-blue-600 bg-blue-500/10' },
    { icon: Users, text: 'متابعة فعلية مش فيديو وخلاص', color: 'text-amber-600 bg-amber-500/10' },
  ];

  return (
    <div
      className={cn(
        "fixed inset-0 z-[60] flex",
        // Mobile: full screen, Desktop: centered
        isMobile ? "items-stretch" : "items-center justify-center",
        "bg-black/50 backdrop-blur-sm",
        "transition-opacity duration-300",
        exiting ? "opacity-0" : "opacity-100"
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleDismiss();
      }}
    >
      <div
        className={cn(
          "relative flex flex-col",
          // Mobile: Full screen with bottom nav space
          isMobile 
            ? "w-full h-full bg-card" 
            : "w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl max-h-[90vh]",
          "transform transition-all duration-300 ease-out",
          exiting 
            ? isMobile 
              ? "translate-y-full opacity-0" 
              : "translate-y-4 opacity-0 scale-95"
            : "translate-y-0 opacity-100 scale-100"
        )}
        role="dialog"
        aria-label="أهلاً بيك في المنصة"
      >
        {/* Accent top bar - solid primary */}
        <div className={cn(
          "absolute top-0 left-0 right-0 h-1 bg-primary",
          !isMobile && "rounded-t-2xl"
        )} />
        
        {/* Close button - safe area aware */}
        <button
          onClick={handleDismiss}
          className={cn(
            "absolute z-10 w-10 h-10 rounded-full bg-muted/80 hover:bg-muted flex items-center justify-center transition-colors",
            isMobile ? "top-4 left-4 safe-area-top" : "top-4 left-4"
          )}
          style={isMobile ? { top: 'max(1rem, env(safe-area-inset-top))' } : undefined}
          aria-label="إغلاق"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
        
        {/* Scrollable content area */}
        <div 
          className={cn(
            "flex-1 overflow-y-auto overscroll-contain",
            isMobile ? "pt-16" : "pt-8"
          )}
          style={isMobile ? { 
            paddingTop: 'max(4rem, calc(env(safe-area-inset-top) + 3rem))'
          } : undefined}
        >
          <div className="px-6 py-4">
            {/* Progress dots */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {[1, 2, 3, 4].map((s) => (
                <span 
                  key={s}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    s === step ? "w-6 bg-primary" : s < step ? "w-2 bg-primary/60" : "w-2 bg-muted"
                  )}
                />
              ))}
            </div>

            {step === 1 && (
              /* Step 1: Welcome */
              <div className="space-y-5 animate-fade-in">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    أهلاً بيك في منصة حسام فكري 👋
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    خلّيك تشوف، تفهم، وبعدين تقرر
                  </p>
                </div>
              </div>
            )}

            {step === 2 && (
              /* Step 2: Value Bullets */
              <div className="space-y-5 animate-fade-in">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-foreground mb-1">
                    إيه اللي هتلاقيه هنا؟
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    مش كلام... ده واقع
                  </p>
                </div>
                
                <div className="space-y-3">
                  {valueBullets.map((bullet, index) => {
                    const Icon = bullet.icon;
                    return (
                      <div 
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border"
                      >
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", bullet.color.split(' ')[1])}>
                          <Icon className={cn("w-5 h-5", bullet.color.split(' ')[0])} />
                        </div>
                        <span className="font-medium text-foreground">{bullet.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 3 && (
              /* Step 3: Trial Rules */
              <div className="space-y-5 animate-fade-in">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-foreground mb-1">
                    إزاي التجربة المجانية بتشتغل؟
                  </h2>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-amber-600 font-bold text-sm">👀</span>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground mb-1">لو زائر</p>
                        <p className="text-sm text-muted-foreground">
                          هتشوف معاينة 3 دقايق من الحصة عشان تفهم الأسلوب
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-green-600 font-bold text-sm">✓</span>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground mb-1">لو مسجّل حساب</p>
                        <p className="text-sm text-muted-foreground">
                          الحصص المجانية كاملة متاحة ليك بدون أي قيود
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="text-center text-sm text-muted-foreground">
                  مفيش ضغط... خد وقتك وقرر براحتك
                </p>
              </div>
            )}

            {step === 4 && (
              /* Step 4: Start CTA */
              <div className="space-y-5 animate-fade-in">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4">
                    <Gift className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    جاهز تبدأ؟
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    شوف الحصص المجانية وقرر بنفسك
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Sticky action area - above bottom nav on mobile */}
        <div 
          className={cn(
            "flex-shrink-0 px-6 py-4 bg-card border-t border-border",
            // Safe bottom spacing for mobile bottom navigation (approx 70px)
            isMobile && "pb-24"
          )}
          style={isMobile ? {
            paddingBottom: 'max(6rem, calc(env(safe-area-inset-bottom) + 5rem))'
          } : undefined}
        >
          {step === 4 ? (
            /* Step 4 actions */
            <div className="space-y-3">
              <Button 
                size="lg" 
                onClick={handleStartTrial} 
                className="w-full gap-2 bg-green-600 hover:bg-green-700 h-12 text-base"
              >
                <CheckCircle2 className="w-5 h-5" />
                ابدأ التجربة دلوقتي
              </Button>
              
              <button
                onClick={handleDismiss}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                هكمل لوحدي
              </button>
            </div>
          ) : (
            /* Steps 1-3 navigation */
            <div className="flex items-center justify-between">
              {step > 1 ? (
                <button
                  onClick={handlePrevStep}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 py-2 px-3"
                >
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                  السابق
                </button>
              ) : (
                <button
                  onClick={handleDismiss}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2 px-3"
                >
                  تخطي
                </button>
              )}
              
              <Button size="default" onClick={handleNextStep} className="gap-2 h-11 px-6">
                التالي
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
