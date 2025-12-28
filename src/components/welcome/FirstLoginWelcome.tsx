import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Sparkles, X } from 'lucide-react';

const LOGIN_FLASH_KEY = 'dmt_login_flash';

const FirstLoginWelcome = () => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [show, setShow] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Check if we just logged in (flag set by Auth.tsx)
    const justLoggedIn = sessionStorage.getItem(LOGIN_FLASH_KEY);
    
    if (justLoggedIn) {
      // Clear the flag immediately so refresh doesn't re-trigger
      sessionStorage.removeItem(LOGIN_FLASH_KEY);
      
      // Show the toast
      setShow(true);
      
      // Auto-dismiss after 1.5 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setShow(false);
      setIsExiting(false);
    }, 300);
  };

  if (!show) return null;

  return (
    <div 
      className={cn(
        "fixed top-4 z-[100] pointer-events-none",
        isRTL ? "right-4" : "left-4"
      )}
    >
      <div 
        className={cn(
          "pointer-events-auto max-w-sm rounded-lg border border-primary/20 bg-card/95 backdrop-blur-sm shadow-lg p-4 transition-all duration-300",
          isExiting ? "opacity-0 translate-y-[-10px]" : "opacity-100 translate-y-0 animate-fade-in",
          isRTL && "rtl"
        )}
      >
        <button 
          onClick={handleClose}
          className={cn(
            "absolute top-2 text-muted-foreground hover:text-foreground transition-colors",
            isRTL ? "left-2" : "right-2"
          )}
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
        
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            {isRTL ? (
              <>
                <p className="text-sm font-semibold text-primary">
                  <span dir="ltr" className="inline-block">D.M.T</span> المجال في الكيمياء – حسام فكري
                </p>
                <p className="text-sm text-foreground mt-1">
                  أهلاً بيك في المنصة رقم 1 في مصر لتعليم الكيمياء للثانوية العامة
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-primary">
                  D.M.T — The Field in Chemistry | Hossam Fekry
                </p>
                <p className="text-sm text-foreground mt-1">
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
