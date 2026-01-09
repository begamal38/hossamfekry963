import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Lightbulb, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface SmartNextStepProps {
  currentLessonTitle: string;
  nextLessonId?: string;
  nextLessonTitle?: string;
  nextLessonShortId?: number;
  chapterTitle?: string;
  isChapterComplete?: boolean;
  onDismiss?: () => void;
  className?: string;
}

/**
 * Smart guidance component that suggests the next logical step
 * after a lesson interaction. Uses calm Arabic tone.
 */
export const SmartNextStep: React.FC<SmartNextStepProps> = ({
  currentLessonTitle,
  nextLessonId,
  nextLessonTitle,
  nextLessonShortId,
  chapterTitle,
  isChapterComplete,
  onDismiss,
  className,
}) => {
  const navigate = useNavigate();
  const { language, isRTL } = useLanguage();
  const isArabic = language === 'ar';
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Show after a short delay for better UX
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const handleNavigate = () => {
    if (nextLessonShortId) {
      navigate(`/lesson/${nextLessonShortId}`);
    }
  };

  if (isDismissed || !isVisible || !nextLessonId) {
    return null;
  }

  // Generate guidance message based on context
  const getMessage = () => {
    if (isChapterComplete) {
      return isArabic 
        ? 'أحسنت! خلصت الباب ده. الخطوة الجاية تبدأ الباب الجديد.'
        : 'Well done! You completed this chapter. Next step: start the new chapter.';
    }
    
    if (chapterTitle) {
      return isArabic 
        ? `واضح إن "${chapterTitle}" مهم ليك. الأفضل تكمله بالترتيب.`
        : `"${chapterTitle}" seems important to you. Best to continue in order.`;
    }
    
    return isArabic 
      ? 'كمّل للحصة الجاية عشان تفضل على المسار الصح.'
      : 'Continue to the next lesson to stay on track.';
  };

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-300",
        "bg-primary/5 border-primary/20 p-4",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        className
      )}
    >
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-2 end-2 p-1 rounded-full hover:bg-muted transition-colors"
        aria-label={isArabic ? 'إغلاق' : 'Dismiss'}
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-5 h-5 text-primary" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground/90 mb-3 leading-relaxed">
            {getMessage()}
          </p>

          <Button
            onClick={handleNavigate}
            size="sm"
            className="gap-2"
          >
            <span>{nextLessonTitle || (isArabic ? 'الحصة الجاية' : 'Next Lesson')}</span>
            <ArrowIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
