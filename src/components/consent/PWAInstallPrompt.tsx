import { useEffect, useState } from 'react';
import { Smartphone, X, Zap, Bell, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface PWAInstallPromptProps {
  show: boolean;
  onInstall: () => void;
  onDismiss: () => void;
  onShown?: () => void;
}

export const PWAInstallPrompt = ({ show, onInstall, onDismiss, onShown }: PWAInstallPromptProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      // Show after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true);
        onShown?.();
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [show, onShown]);

  if (!isVisible) return null;

  const benefits = [
    { icon: Zap, text: 'أسرع' },
    { icon: Gauge, text: 'مفيش تهنيج' },
    { icon: Bell, text: 'إشعارات فورية' },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-24 left-4 right-4 z-50 flex justify-center"
        dir="rtl"
      >
        <div className="w-full max-w-sm">
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl shadow-xl p-5 backdrop-blur-sm relative overflow-hidden">
            {/* Decorative gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
            
            {/* Close button */}
            <button
              onClick={onDismiss}
              className="absolute top-3 left-3 p-1.5 rounded-full hover:bg-muted/50 transition-colors z-10"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-start gap-3 mb-4 pe-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Smartphone className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">
                    خلّي المنصة على موبايلك 📱
                  </h3>
                </div>
              </div>

              {/* Benefits */}
              <div className="flex items-center justify-center gap-4 mb-5">
                {benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <benefit.icon className="w-4 h-4 text-primary" />
                    <span>{benefit.text}</span>
                  </div>
                ))}
              </div>

              {/* Install button */}
              <Button 
                onClick={onInstall}
                className="w-full gap-2"
                size="lg"
              >
                <Smartphone className="w-5 h-5" />
                ثبّت المنصة
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
