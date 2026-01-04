import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PreviewLockOverlayProps {
  className?: string;
}

export const PreviewLockOverlay: React.FC<PreviewLockOverlayProps> = ({ className }) => {
  return (
    <div 
      className={cn(
        "absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm",
        className
      )}
    >
      {/* Lock icon */}
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Lock className="w-8 h-8 text-primary" />
      </div>
      
      {/* Arabic message */}
      <h3 className="text-xl font-bold text-foreground mb-2 text-center px-4">
        دي كانت عينة من الحصة
      </h3>
      <p className="text-muted-foreground text-center mb-6 px-4">
        كمّل باقي المحتوى بعد تسجيل حسابك
      </p>
      
      {/* CTA Button */}
      <Button size="lg" asChild className="gap-2">
        <Link to="/auth?mode=signup">
          <UserPlus className="w-5 h-5" />
          إنشاء حساب
        </Link>
      </Button>
    </div>
  );
};
