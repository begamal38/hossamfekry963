import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Sparkles, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const FirstLoginWelcome = () => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [show, setShow] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  const handleClose = () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    setIsExiting(true);
    window.setTimeout(() => {
      setShow(false);
      setIsExiting(false);
    }, 300);
  };

  useEffect(() => {
    // Show ONLY on actual successful sign-in events (not on refresh / existing session).
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== 'SIGNED_IN') return;

      setShow(true);
      closeTimerRef.current = window.setTimeout(() => {
        handleClose();
      }, 3000); // Extended to 3 seconds for better readability
    });

    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
      data.subscription.unsubscribe();
    };
  }, []);


  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      <div 
        className={cn(
          "pointer-events-auto max-w-md rounded-xl border border-primary/30 bg-card/98 backdrop-blur-md shadow-2xl p-6 transition-all duration-300",
          isExiting 
            ? "opacity-0 scale-95" 
            : "opacity-100 scale-100 animate-scale-in",
          isRTL && "rtl"
        )}
      >
        <button 
          onClick={handleClose}
          className={cn(
            "absolute top-3 text-muted-foreground hover:text-foreground transition-colors",
            isRTL ? "left-3" : "right-3"
          )}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex flex-col items-center text-center gap-4">
          {/* Icon */}
          <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center animate-pulse-glow">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          
          {/* Content */}
          <div>
            {isRTL ? (
              <>
                <p className="text-lg font-bold text-primary">
                  <span dir="ltr" className="inline-block">D.M.T</span> المجال في الكيمياء – حسام فكري
                </p>
                <p className="text-base text-foreground mt-2">
                  أهلاً بيك في المنصة رقم 1 في مصر لتعليم الكيمياء للثانوية العامة
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold text-primary">
                  D.M.T — The Field in Chemistry | Hossam Fekry
                </p>
                <p className="text-base text-foreground mt-2">
                  Welcome to Egypt's #1 platform for teaching Chemistry
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirstLoginWelcome;
