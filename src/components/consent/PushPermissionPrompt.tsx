import { useState, useEffect, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface PushPermissionPromptProps {
  show: boolean;
  onAccept: () => void;
  onDismiss: () => void;
}

export const PushPermissionPrompt = ({ show, onAccept, onDismiss }: PushPermissionPromptProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const hasShownRef = useRef(false);

  useEffect(() => {
    if (show && !hasShownRef.current) {
      // Show after a short delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
        hasShownRef.current = true;
      }, 500);
      return () => clearTimeout(timer);
    } else if (!show) {
      setIsVisible(false);
    }
  }, [show]);

  // Handle accept - close immediately
  const handleAccept = () => {
    setIsVisible(false);
    // Small delay before callback to allow exit animation
    setTimeout(() => {
      onAccept();
    }, 200);
  };

  // Handle dismiss - close immediately
  const handleDismiss = () => {
    setIsVisible(false);
    // Small delay before callback to allow exit animation
    setTimeout(() => {
      onDismiss();
    }, 200);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed top-20 left-4 right-4 z-50 flex justify-center"
        dir="rtl"
      >
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-2xl shadow-lg p-5 backdrop-blur-sm relative">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 left-3 p-1.5 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Content */}
            <div className="flex items-start gap-3 mb-4 pe-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Bell className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">
                  تحب توصلك إشعارات الحصص الجديدة؟ 🔔
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  مواعيد • حصص • امتحانات — من غير إزعاج.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleAccept}
                className="flex-1"
                size="lg"
              >
                تمام
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-foreground"
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
