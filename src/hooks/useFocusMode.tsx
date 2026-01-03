import { useState, useEffect, useCallback, useRef } from 'react';

interface FocusSession {
  startTime: number;
  pauseTime?: number;
  totalFocusedTime: number;
  interruptions: number;
  completedSegments: number;
}

interface FocusModeState {
  isActive: boolean;
  isPaused: boolean;
  status: 'active' | 'paused' | 'resumed' | 'idle';
  session: FocusSession | null;
  currentSegmentProgress: number; // 0-100% of current 20-min segment
}

const SEGMENT_DURATION_MS = 20 * 60 * 1000; // 20 minutes

// Egyptian Arabic motivational messages
const FOCUS_MESSAGES_AR = [
  'مكمل صح 👌 ركز شوية كمان',
  'أداءك ثابت، كمل 👏',
  'إنت ماشي تمام 💪',
  'شغل جامد، استمر كده',
  'تركيزك رائع النهاردة ⭐',
  'خطوة خطوة للنجاح 🎯',
  'أنت بتتقدم، كمل!',
  'الثبات هو السر 🔥',
];

const FOCUS_MESSAGES_EN = [
  'You\'re doing great! Keep going 👌',
  'Steady progress! Continue 👏',
  'You\'re on track 💪',
  'Excellent work, stay focused',
  'Your focus is impressive ⭐',
  'Step by step to success 🎯',
  'You\'re making progress!',
  'Consistency is key 🔥',
];

const SEGMENT_COMPLETE_AR = '20 دقيقة تركيز اتحسبت 💪';
const SEGMENT_COMPLETE_EN = '20 minutes of focus completed 💪';

export const useFocusMode = (isLessonActive: boolean = false, lessonId?: string) => {
  const [state, setState] = useState<FocusModeState>({
    isActive: false,
    isPaused: false,
    status: 'idle',
    session: null,
    currentSegmentProgress: 0,
  });
  
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageIndexRef = useRef(-1);
  const sessionRef = useRef<FocusSession | null>(null);
  const segmentIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messageIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Show a message with auto-hide
  const showMessage = useCallback((message: string, duration: number = 3000) => {
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
    setCurrentMessage(message);
    messageTimeoutRef.current = setTimeout(() => {
      setCurrentMessage(null);
    }, duration);
  }, []);

  // Show random motivational message
  const showRandomMessage = useCallback((isArabic: boolean) => {
    const messages = isArabic ? FOCUS_MESSAGES_AR : FOCUS_MESSAGES_EN;
    let newIndex: number;
    
    do {
      newIndex = Math.floor(Math.random() * messages.length);
    } while (newIndex === lastMessageIndexRef.current && messages.length > 1);
    
    lastMessageIndexRef.current = newIndex;
    showMessage(messages[newIndex], 3500);
  }, [showMessage]);

  // Show segment completion message
  const showSegmentComplete = useCallback((isArabic: boolean) => {
    showMessage(isArabic ? SEGMENT_COMPLETE_AR : SEGMENT_COMPLETE_EN, 4000);
  }, [showMessage]);

  // Start focus session
  const startFocus = useCallback(() => {
    const session: FocusSession = {
      startTime: Date.now(),
      totalFocusedTime: 0,
      interruptions: 0,
      completedSegments: 0,
    };
    sessionRef.current = session;
    setState({
      isActive: true,
      isPaused: false,
      status: 'active',
      session,
      currentSegmentProgress: 0,
    });
  }, []);

  // Pause focus (tab hidden or left page)
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
      if (!sessionRef.current.pauseTime) {
        sessionRef.current.totalFocusedTime += Date.now() - sessionRef.current.startTime;
      }
      
      console.log('Focus session ended:', {
        totalMinutes: Math.round(sessionRef.current.totalFocusedTime / 60000),
        interruptions: sessionRef.current.interruptions,
        completedSegments: sessionRef.current.completedSegments,
        lessonId,
      });
    }
    
    sessionRef.current = null;
    setState({
      isActive: false,
      isPaused: false,
      status: 'idle',
      session: null,
      currentSegmentProgress: 0,
    });
  }, [lessonId]);

  // Track 20-minute segments and update progress
  useEffect(() => {
    if (state.isActive && !state.isPaused) {
      segmentIntervalRef.current = setInterval(() => {
        if (sessionRef.current && !sessionRef.current.pauseTime) {
          const currentSessionTime = Date.now() - sessionRef.current.startTime;
          const totalTime = sessionRef.current.totalFocusedTime + currentSessionTime;
          
          // Calculate progress within current segment
          const timeInCurrentSegment = totalTime % SEGMENT_DURATION_MS;
          const progress = (timeInCurrentSegment / SEGMENT_DURATION_MS) * 100;
          
          // Check if we completed a new segment
          const totalSegments = Math.floor(totalTime / SEGMENT_DURATION_MS);
          if (totalSegments > sessionRef.current.completedSegments) {
            sessionRef.current.completedSegments = totalSegments;
          }
          
          setState(prev => ({
            ...prev,
            currentSegmentProgress: progress,
            session: { ...sessionRef.current! },
          }));
        }
      }, 1000); // Update every second for smooth progress

      return () => {
        if (segmentIntervalRef.current) {
          clearInterval(segmentIntervalRef.current);
        }
      };
    }
  }, [state.isActive, state.isPaused, showSegmentComplete]);

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
      if (segmentIntervalRef.current) {
        clearInterval(segmentIntervalRef.current);
      }
      if (messageIntervalRef.current) {
        clearInterval(messageIntervalRef.current);
      }
      endFocus();
    };
  }, [endFocus]);

  // Get focus stats
  const getFocusStats = useCallback(() => {
    if (!sessionRef.current) return null;
    
    let totalTime = sessionRef.current.totalFocusedTime;
    if (!sessionRef.current.pauseTime) {
      totalTime += Date.now() - sessionRef.current.startTime;
    }
    
    return {
      totalMinutes: Math.floor(totalTime / 60000),
      completedSegments: sessionRef.current.completedSegments,
      interruptions: sessionRef.current.interruptions,
    };
  }, []);

  return {
    ...state,
    currentMessage,
    showRandomMessage,
    showSegmentComplete,
    startFocus,
    pauseFocus,
    resumeFocus,
    endFocus,
    getFocusStats,
  };
};
