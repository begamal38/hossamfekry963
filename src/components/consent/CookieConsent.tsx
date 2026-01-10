import { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface CookieConsentProps {
  status: 'pending' | 'accepted' | 'declined';
  onAccept: () => void;
  onDecline: () => void;
}

export const CookieConsent = ({ status, onAccept, onDecline }: CookieConsentProps) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Show banner after a short delay if consent is pending
    if (status === 'pending') {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [status]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe"
        dir="rtl"
      >
        <div className="mx-auto max-w-lg">
          <div className="bg-card border border-border rounded-2xl shadow-lg p-5 backdrop-blur-sm">
            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <Cookie className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">
                  إحنا بنستخدم Cookies 🍪
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  علشان نحسب وقت المعاينة، نحافظ على تجربة عادلة، ونخلّي المنصة شغالة صح.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button 
                onClick={onAccept}
                className="flex-1"
                size="lg"
              >
                موافق
              </Button>
              <Button 
                variant="ghost" 
                onClick={onDecline}
                className="text-muted-foreground hover:text-foreground"
                size="lg"
              >
                مش دلوقتي
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
