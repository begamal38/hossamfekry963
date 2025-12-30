import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';
import { Loader2 } from 'lucide-react';

const COUNTDOWN_SECONDS = 4;

const AssistantTransition = () => {
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  useEffect(() => {
    // Countdown timer
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto-redirect after countdown
    const timeout = setTimeout(() => {
      navigate('/assistant', { replace: true });
    }, COUNTDOWN_SECONDS * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div className={cn(
      "min-h-screen bg-gradient-hero flex items-center justify-center p-4",
      isRTL && "rtl"
    )}>
      {/* Background Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-pulse-glow animation-delay-200" />
      
      <div className="relative text-center max-w-md">
        {/* Logo */}
        <img 
          src={logo} 
          alt="Hossam Fekry" 
          className="h-20 w-auto mx-auto mb-8"
        />
        
        {/* Loading spinner with countdown */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          {/* Outer ring - animated */}
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div 
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"
            style={{ animationDuration: '1s' }}
          />
          
          {/* Center countdown */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold text-primary">{countdown}</span>
          </div>
        </div>
        
        {/* Message */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-foreground">
            جاري تحويلك إلى منصة المدرس المساعد
          </h2>
          <p className="text-muted-foreground">
            خلال {countdown} ثواني...
          </p>
        </div>
        
        {/* Subtle loading bar */}
        <div className="mt-8 h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-1000 ease-linear"
            style={{ 
              width: `${((COUNTDOWN_SECONDS - countdown) / COUNTDOWN_SECONDS) * 100}%` 
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AssistantTransition;
