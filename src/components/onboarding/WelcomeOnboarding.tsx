import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Gift, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNewUserOnboarding } from '@/hooks/useNewUserOnboarding';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Welcome Onboarding for first-time students
 * Shows ONLY once after first signup
 * Non-blocking, lightweight toast/panel
 * 
 * Arabic UX - Gen Z friendly tone
 */
export const WelcomeOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { shouldShowWelcome, markOnboardingComplete } = useNewUserOnboarding();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (shouldShowWelcome) {
      // Delay showing to let page settle
      const timer = setTimeout(() => {
        setVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
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
    setStep(2);
  };

  if (!visible || !shouldShowWelcome) return null;

  return (
    <div
      className={cn(
        "fixed z-50",
        // Mobile-first positioning
        isMobile 
          ? "bottom-24 left-4 right-4" 
          : "bottom-6 left-auto right-6 max-w-md",
        "bg-card border border-primary/20 rounded-2xl shadow-xl",
        "transform transition-all duration-300 ease-out",
        exiting ? "translate-y-4 opacity-0 scale-95" : "translate-y-0 opacity-100 scale-100"
      )}
      role="dialog"
      aria-label="أهلاً بيك في المنصة"
    >
      {/* Gradient accent top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/60 to-primary/30 rounded-t-2xl" />
      
      <div className="p-5">
        {step === 1 ? (
          /* Step 1: Welcome */
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground mb-1">
                  أهلاً بيك 👋
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  خلّيك مطمّن… تقدر تجرب المنصة وتشوف أسلوب الشرح قبل ما تقرر تكمل.
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleDismiss}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                تخطي
              </button>
              <Button size="sm" onClick={handleNextStep} className="gap-2">
                التالي
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          /* Step 2: Guidance */
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <Gift className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground mb-1">
                  ابدأ بالتجربة المجانية
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  شوف الحصة التجريبية وقرر بنفسك لو الشرح مناسبك ولا لأ.
                </p>
              </div>
            </div>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-muted" />
              <span className="w-2 h-2 rounded-full bg-primary" />
            </div>
            
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleDismiss}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                لاحقاً
              </button>
              <Button size="sm" onClick={handleStartTrial} className="gap-2 bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="w-4 h-4" />
                ابدأ التجربة
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
