import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

const WELCOME_SHOWN_KEY = 'dmt_welcome_shown';

const FirstLoginWelcome = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRTL = language === 'ar';
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Check if welcome was already shown for this user
    const welcomeShown = localStorage.getItem(`${WELCOME_SHOWN_KEY}_${user.id}`);
    
    if (!welcomeShown) {
      // Show welcome message
      setShow(true);
      
      // Mark as shown
      localStorage.setItem(`${WELCOME_SHOWN_KEY}_${user.id}`, 'true');
      
      // Auto-dismiss after 3 seconds
      const timer = setTimeout(() => {
        setShow(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [user]);

  if (!show) return null;

  return (
    <Dialog open={show} onOpenChange={setShow}>
      <DialogContent 
        className={cn(
          "sm:max-w-md border-primary/20 bg-gradient-to-br from-card via-card to-primary/5",
          "[&>button]:hidden"
        )}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <div className={cn(
          "text-center py-6 space-y-4",
          isRTL && "rtl"
        )}>
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
          </div>
          
          {/* Welcome Text */}
          <div className="space-y-2">
            {isRTL ? (
              <>
                <h2 className="text-xl font-bold text-foreground leading-relaxed">
                  أهلاً بيك في المنصة رقم 1 في مصر
                  <br />
                  لتعليم الكيمياء للثانوية العامة
                </h2>
                <p className="text-lg font-semibold text-primary">
                  المجال D.M.T في الكيمياء
                </p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-foreground leading-relaxed">
                  Welcome to Egypt's #1 platform
                  <br />
                  for teaching Chemistry
                </h2>
                <p className="text-lg font-semibold text-primary">
                  D.M.T — The Field Leader in Chemistry
                </p>
              </>
            )}
          </div>
          
          {/* Progress indicator */}
          <div className="flex justify-center pt-2">
            <div className="w-24 h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary animate-[progress_3s_linear]" style={{
                animation: 'progress 3s linear forwards'
              }} />
            </div>
          </div>
        </div>
        
        <style>{`
          @keyframes progress {
            from { width: 0%; }
            to { width: 100%; }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
};

export default FirstLoginWelcome;
