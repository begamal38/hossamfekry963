import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface PreviewLockOverlayProps {
  className?: string;
}

/**
 * Preview Lock Overlay - Shown when visitor preview ends
 * Uses centralized translation keys for consistency
 */
export const PreviewLockOverlay: React.FC<PreviewLockOverlayProps> = ({ className }) => {
  const { isRTL } = useLanguage();

  return (
    <div 
      dir={isRTL ? 'rtl' : 'ltr'}
      className={cn(
        "absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm",
        className
      )}
    >
      {/* Lock icon */}
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Lock className="w-8 h-8 text-primary" />
      </div>
      
      {/* Message - Spec: "انتهت المعاينة" + "سجّل حسابك علشان تكمل المحتوى كامل." */}
      <h3 className="text-xl font-bold text-foreground mb-2 text-center px-4">
        انتهت المعاينة
      </h3>
      <p className="text-muted-foreground text-center mb-6 px-4">
        سجّل حسابك علشان تكمل المحتوى كامل.
      </p>
      
      {/* CTA Button - Spec: "إنشاء حساب" */}
      <Button size="lg" asChild className="gap-2">
        <Link to="/auth?mode=signup">
          <UserPlus className="w-5 h-5" />
          إنشاء حساب
        </Link>
      </Button>
    </div>
  );
};