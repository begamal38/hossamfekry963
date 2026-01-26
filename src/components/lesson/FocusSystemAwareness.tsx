/**
 * Focus System Awareness
 * 
 * A subtle indicator that connects focus time to the learning system.
 * Shows when focus mode is active, explaining system memory.
 * 
 * ARCHITECTURE:
 * - No new metrics or calculations
 * - i18n for bilingual support (AR/EN)
 * - Acknowledgment only, no pressure
 */

import React from 'react';
import { Activity, Brain } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface FocusSystemAwarenessProps {
  isFocusActive: boolean;
  className?: string;
}

export function FocusSystemAwareness({
  isFocusActive,
  className,
}: FocusSystemAwarenessProps) {
  const { language, isRTL } = useLanguage();
  const isArabic = language === 'ar';

  // Only show when focus is active
  if (!isFocusActive) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2",
        className
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="flex items-center gap-1.5">
        <Activity className="w-3.5 h-3.5 text-green-500 animate-subtle-pulse" />
        <span className="text-green-600 font-medium">
          {isArabic ? 'تركيز نشط' : 'Focus Active'}
        </span>
      </div>
      <span className="text-muted-foreground/70">•</span>
      <div className="flex items-center gap-1.5">
        <Brain className="w-3.5 h-3.5" />
        <span>
          {isArabic
            ? 'وقت التركيز بيتسجل في تحليلاتك'
            : 'Focus time is recorded in your analytics'}
        </span>
      </div>
    </div>
  );
}
