import React, { useState, useEffect } from 'react';
import { X, Monitor, Eye, Clock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WatchInsideTipProps {
  isArabic: boolean;
  isEnrolled: boolean;
  className?: string;
}

const STORAGE_KEY = 'watch_inside_tip_dismissed';
const SHOW_INTERVAL_HOURS = 24; // Show again after 24 hours

export const WatchInsideTip: React.FC<WatchInsideTipProps> = ({
  isArabic,
  isEnrolled,
  className,
}) => {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Only show for enrolled students
    if (!isEnrolled) return;

    try {
      const lastDismissed = localStorage.getItem(STORAGE_KEY);
      if (lastDismissed) {
        const hours = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60);
        if (hours < SHOW_INTERVAL_HOURS) return;
      }
    } catch {
      // Storage not available
    }

    // Show after a short delay
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, [isEnrolled]);

  const handleDismiss = () => {
    setExiting(true);
    try {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    } catch {
      // Storage not available
    }
    setTimeout(() => setVisible(false), 300);
  };

  if (!visible) return null;

  return (
    <div
      className={cn(
        "bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-xl p-4",
        "transform transition-all duration-300 ease-out",
        exiting ? "opacity-0 scale-95" : "opacity-100 scale-100",
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <Monitor className="w-5 h-5 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground mb-1 flex items-center gap-2">
            {isArabic ? '📍 شاهد من داخل المنصة' : '📍 Watch Inside the Platform'}
          </h4>
          
          <p className="text-sm text-muted-foreground mb-3">
            {isArabic 
              ? 'عشان نسجل تركيزك بشكل صحيح، لازم تشاهد الحصص من داخل الموقع مش من اليوتيوب مباشرة.'
              : 'To track your focus correctly, please watch lessons inside the website, not directly on YouTube.'}
          </p>

          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Eye className="w-3.5 h-3.5 text-primary" />
              {isArabic ? 'تتبع المشاهدة الفعلية' : 'Real viewing tracking'}
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-3.5 h-3.5 text-primary" />
              {isArabic ? 'تسجيل وقت التركيز' : 'Focus time recording'}
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              {isArabic ? 'تقدم أفضل' : 'Better progress'}
            </div>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="p-1 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
          aria-label={isArabic ? 'إغلاق' : 'Close'}
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};
