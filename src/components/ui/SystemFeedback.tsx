import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, Loader2, Sparkles } from 'lucide-react';

interface SystemFeedbackProps {
  message: string;
  type?: 'success' | 'info' | 'progress';
  duration?: number;
  onComplete?: () => void;
}

export const SystemFeedback: React.FC<SystemFeedbackProps> = ({
  message,
  type = 'info',
  duration = 2000,
  onComplete,
}) => {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setExiting(true);
    }, duration - 300);

    const hideTimer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(hideTimer);
    };
  }, [duration, onComplete]);

  if (!visible) return null;

  const Icon = type === 'success' ? CheckCircle : type === 'progress' ? Loader2 : Sparkles;

  return (
    <div
      className={cn(
        "fixed bottom-24 left-1/2 -translate-x-1/2 z-50",
        "flex items-center gap-2 px-4 py-2 rounded-full",
        "bg-card/95 backdrop-blur-sm border shadow-lg",
        "text-sm font-medium text-foreground",
        "transition-all duration-300 ease-out",
        exiting ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0 animate-fade-in-up"
      )}
    >
      <Icon className={cn(
        "w-4 h-4",
        type === 'success' && "text-green-500",
        type === 'progress' && "text-primary animate-spin",
        type === 'info' && "text-primary"
      )} />
      <span>{message}</span>
    </div>
  );
};

// Hook for showing system feedback
let feedbackQueue: { message: string; type: 'success' | 'info' | 'progress' }[] = [];
let setFeedbackState: React.Dispatch<React.SetStateAction<{ message: string; type: 'success' | 'info' | 'progress' } | null>> | null = null;

export const showSystemFeedback = (message: string, type: 'success' | 'info' | 'progress' = 'info') => {
  if (setFeedbackState) {
    setFeedbackState({ message, type });
  } else {
    feedbackQueue.push({ message, type });
  }
};

export const SystemFeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'info' | 'progress' } | null>(null);

  useEffect(() => {
    setFeedbackState = setFeedback;
    
    // Process queued feedbacks
    if (feedbackQueue.length > 0) {
      const first = feedbackQueue.shift();
      if (first) setFeedback(first);
    }

    return () => {
      setFeedbackState = null;
    };
  }, []);

  return (
    <>
      {children}
      {feedback && (
        <SystemFeedback
          message={feedback.message}
          type={feedback.type}
          onComplete={() => setFeedback(null)}
        />
      )}
    </>
  );
};
