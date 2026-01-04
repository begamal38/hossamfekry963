import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, Play, CheckCircle, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type MessageType = 'welcome' | 'free_lesson_intro' | 'after_completion' | 'free_trial_guidance' | 'free_trial_complete';

interface OnboardingMessagesProps {
  type: MessageType;
  /**
   * When false, the message will not mount/animate yet.
   * Used to guarantee overlays appear ONLY after YouTube playback starts.
   */
  enabled?: boolean;
  onDismiss?: () => void;
  courseId?: string;
  courseSlug?: string;
  className?: string;
}

const STORAGE_KEY_PREFIX = 'onboarding_dismissed_';

// Get or set dismissed state in session storage
const isDismissed = (type: MessageType): boolean => {
  try {
    return sessionStorage.getItem(`${STORAGE_KEY_PREFIX}${type}`) === 'true';
  } catch {
    return false;
  }
};

const setDismissed = (type: MessageType): void => {
  try {
    sessionStorage.setItem(`${STORAGE_KEY_PREFIX}${type}`, 'true');
  } catch {
    // Session storage not available
  }
};

export const OnboardingMessages: React.FC<OnboardingMessagesProps> = ({
  type,
  enabled = true,
  onDismiss,
  courseId,
  courseSlug,
  className,
}) => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Hard gate: never show before "enabled" is true
    if (!enabled) {
      setVisible(false);
      setExiting(false);
      return;
    }

    // Check if already dismissed
    if (isDismissed(type)) {
      return;
    }

    // Show message after a short delay
    const timer = setTimeout(() => {
      setVisible(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [type, enabled]);

  const handleDismiss = () => {
    setExiting(true);
    setDismissed(type);
    setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 300);
  };

  const handleCourseNavigation = () => {
    handleDismiss();
    if (courseSlug) {
      navigate(`/course/${courseSlug}`);
    } else if (courseId) {
      navigate(`/course/${courseId}`);
    }
  };

  if (!visible) return null;

  const messages = {
    welcome: {
      icon: Sparkles,
      title: 'أهلاً بيك 👋',
      subtitle: 'هنا تقدر تجرب أسلوب الشرح وطريقة المنصة قبل ما تقرر تكمل.',
      cta: null,
    },
    free_lesson_intro: {
      icon: Play,
      title: 'دي حصة مجانية',
      subtitle: 'عشان تاخد فكرة عن أسلوب الشرح. لو الشرح مناسبك، تقدر تكمل باقي المحتوى بعد الاشتراك.',
      cta: null,
    },
    after_completion: {
      icon: CheckCircle,
      title: 'حاسس إن الشرح مناسبك؟',
      subtitle: 'كمل باقي الحصص بنفس الأسلوب.',
      cta: (courseId || courseSlug) ? { label: 'عرض الكورس', action: handleCourseNavigation } : null,
    },
    // Free Trial guidance for logged-in students
    free_trial_guidance: {
      icon: BookOpen,
      title: 'دي حصة مجانية',
      subtitle: 'عشان تتعرف على أسلوب الشرح وطريقة المنصة.',
      cta: null,
    },
    // Free Trial completion for logged-in students
    free_trial_complete: {
      icon: CheckCircle,
      title: 'لو الشرح مناسبك',
      subtitle: 'تقدر تكمل باقي المحتوى بعد الاشتراك في الكورس.',
      cta: (courseId || courseSlug) ? { label: 'عرض الكورس', action: handleCourseNavigation } : null,
    },
  };

  const message = messages[type];
  const Icon = message.icon;

  return (
    <div
      className={cn(
        "fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-40",
        "bg-card border border-border rounded-xl shadow-lg p-4",
        "transform transition-all duration-300 ease-out",
        exiting ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100",
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground mb-1">{message.title}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {message.subtitle}
          </p>
          
          {message.cta && (
            <Button 
              size="sm" 
              className="mt-3"
              onClick={message.cta.action}
            >
              {message.cta.label}
            </Button>
          )}
        </div>
        
        <button
          onClick={handleDismiss}
          className="p-1 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
          aria-label="إغلاق"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};

// Utility hook for showing onboarding messages
export const useOnboardingMessage = (type: MessageType) => {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (!isDismissed(type)) {
      setShouldShow(true);
    }
  }, [type]);

  const dismiss = () => {
    setDismissed(type);
    setShouldShow(false);
  };

  return { shouldShow, dismiss };
};
