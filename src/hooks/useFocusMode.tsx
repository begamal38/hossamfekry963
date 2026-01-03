import { useState, useEffect, useCallback, useRef } from 'react';

interface FocusSession {
  startTime: number;
  pauseTime?: number;
  totalFocusedTime: number;
  interruptions: number;
}

interface FocusModeState {
  isActive: boolean;
  isPaused: boolean;
  status: 'active' | 'paused' | 'resumed' | 'idle';
  session: FocusSession | null;
}

const FOCUS_MESSAGES_AR = [
  'وضع التركيز مفعّل',
  'أنت منخرط تماماً',
  'التعلم جاري',
  'استمر، أنت تبلي بلاءً حسناً',
  'تركيزك ممتاز',
];

const FOCUS_MESSAGES_EN = [
  'Focus mode active',
  'You\'re fully engaged',
  'Learning in progress',
  'Keep going, you\'re doing great',
  'Excellent focus',
];

export const useFocusMode = (isLessonActive: boolean = false) => {
  const [state, setState] = useState<FocusModeState>({
    isActive: false,
    isPaused: false,
    status: 'idle',
    session: null,
  });
  
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageIndexRef = useRef(-1);
  const sessionRef = useRef<FocusSession | null>(null);

  // Start focus session
  const startFocus = useCallback(() => {
    const session: FocusSession = {
      startTime: Date.now(),
      totalFocusedTime: 0,
      interruptions: 0,
    };
    sessionRef.current = session;
    setState({
      isActive: true,
      isPaused: false,
      status: 'active',
      session,
    });
  }, []);

  // Pause focus (tab hidden)
  const pauseFocus = useCallback(() => {
    if (sessionRef.current && !sessionRef.current.pauseTime) {
      const now = Date.now();
      sessionRef.current.totalFocusedTime += now - sessionRef.current.startTime;
      sessionRef.current.pauseTime = now;
      sessionRef.current.interruptions += 1;
      
      setState(prev => ({
        ...prev,
        isPaused: true,
        status: 'paused',
        session: { ...sessionRef.current! },
      }));
    }
  }, []);

  // Resume focus (tab visible again)
  const resumeFocus = useCallback(() => {
    if (sessionRef.current?.pauseTime) {
      sessionRef.current.startTime = Date.now();
      sessionRef.current.pauseTime = undefined;
      
      setState(prev => ({
        ...prev,
        isPaused: false,
        status: 'resumed',
        session: { ...sessionRef.current! },
      }));

      // Reset to active after brief "resumed" state
      setTimeout(() => {
        setState(prev => ({ ...prev, status: 'active' }));
      }, 2000);
    }
  }, []);

  // End focus session
  const endFocus = useCallback(() => {
    if (sessionRef.current) {
      // Calculate final time if not paused
      if (!sessionRef.current.pauseTime) {
        sessionRef.current.totalFocusedTime += Date.now() - sessionRef.current.startTime;
      }
      
      // Could store analytics here in the future
      console.log('Focus session ended:', {
        totalMinutes: Math.round(sessionRef.current.totalFocusedTime / 60000),
        interruptions: sessionRef.current.interruptions,
      });
    }
    
    sessionRef.current = null;
    setState({
      isActive: false,
      isPaused: false,
      status: 'idle',
      session: null,
    });
  }, []);

  // Show random message occasionally
  const showRandomMessage = useCallback((isArabic: boolean) => {
    const messages = isArabic ? FOCUS_MESSAGES_AR : FOCUS_MESSAGES_EN;
    let newIndex: number;
    
    // Avoid repeating the same message
    do {
      newIndex = Math.floor(Math.random() * messages.length);
    } while (newIndex === lastMessageIndexRef.current && messages.length > 1);
    
    lastMessageIndexRef.current = newIndex;
    setCurrentMessage(messages[newIndex]);
    
    // Clear message after 2 seconds
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
    messageTimeoutRef.current = setTimeout(() => {
      setCurrentMessage(null);
    }, 2500);
  }, []);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        pauseFocus();
      } else if (state.isActive) {
        resumeFocus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state.isActive, pauseFocus, resumeFocus]);

  // Auto-start when lesson becomes active
  useEffect(() => {
    if (isLessonActive && !state.isActive) {
      startFocus();
    } else if (!isLessonActive && state.isActive) {
      endFocus();
    }
  }, [isLessonActive, state.isActive, startFocus, endFocus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
      endFocus();
    };
  }, [endFocus]);

  return {
    ...state,
    currentMessage,
    showRandomMessage,
    startFocus,
    pauseFocus,
    resumeFocus,
    endFocus,
  };
};
