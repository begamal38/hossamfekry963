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
 */
export const WelcomeOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { shouldShowWelcome, markOnboardingComplete } = useNewUserOnboarding();
  
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (shouldShowWelcome) {
      // Delay showing to let page settle
      const timer = setTimeout(() => {
        setVisible(true);
      }, 1200);
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
        "fixed inset-0 z-50 flex items-end sm:items-center justify-center",
        "bg-black/40 backdrop-blur-sm",
        "transition-opacity duration-300",
        exiting ? "opacity-0" : "opacity-100"
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleDismiss();
      }}
    >
      <div
        className={cn(
          "relative w-full sm:max-w-md",
          "bg-card border-t sm:border border-border rounded-t-3xl sm:rounded-2xl shadow-2xl",
          "transform transition-all duration-300 ease-out",
          isMobile ? "max-h-[85vh]" : "max-h-[90vh]",
          exiting 
            ? "translate-y-full sm:translate-y-4 opacity-0 scale-95" 
            : "translate-y-0 opacity-100 scale-100"
        )}
        role="dialog"
        aria-label="أهلاً بيك في المنصة"
      >
        {/* Gradient accent top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/60 to-primary/30 rounded-t-3xl sm:rounded-t-2xl" />
        
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 left-4 w-8 h-8 rounded-full bg-muted/80 hover:bg-muted flex items-center justify-center transition-colors z-10"
          aria-label="إغلاق"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
        
        {/* Drag handle for mobile */}
        {isMobile && (
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-12 h-1.5 rounded-full bg-muted" />
          </div>
        )}
        
        <div className="p-6 pt-8">
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3, 4].map((s) => (
              <span 
                key={s}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  s === step ? "w-6 bg-primary" : s < step ? "bg-primary/60" : "bg-muted"
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
          )}

          {/* Navigation buttons */}
          {step < 4 && (
            <div className="flex items-center justify-between mt-8 pt-4 border-t border-border">
              {step > 1 ? (
                <button
                  onClick={handlePrevStep}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                  السابق
                </button>
              ) : (
                <button
                  onClick={handleDismiss}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  تخطي
                </button>
              )}
              
              <Button size="sm" onClick={handleNextStep} className="gap-2">
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
