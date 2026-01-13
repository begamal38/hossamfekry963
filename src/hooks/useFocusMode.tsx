import { useState, useEffect, useCallback, useRef } from 'react';

// Explicit Focus Mode States
export type FocusState = 'FOCUS_IDLE' | 'FOCUS_ACTIVE' | 'FOCUS_PAUSED' | 'FOCUS_COMPLETED';

interface FocusSession {
  startTime: number;
  totalFocusedTime: number;
  interruptions: number;
  completedSegments: number;
}

interface FocusModeState {
  focusState: FocusState;
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

// Time milestone messages
const TIME_MILESTONE_MESSAGES_AR: Record<number, string> = {
  1: 'دقيقة واحدة مركز ⏱️',
  5: '5 دقائق تركيز! أنت ماشي كويس 🎯',
  10: '10 دقائق! تركيزك ممتاز 💪',
  15: '15 دقيقة! أنت بطل 🏆',
  20: '20 دقيقة كاملة! 🔥',
  30: 'نص ساعة تركيز! أداء رائع ⭐',
  45: '45 دقيقة! شغل جامد 💎',
  60: 'ساعة كاملة! إنجاز كبير 🎉',
};

const TIME_MILESTONE_MESSAGES_EN: Record<number, string> = {
  1: '1 minute focused ⏱️',
  5: '5 minutes focused! Great start 🎯',
  10: '10 minutes! Excellent focus 💪',
  15: '15 minutes! You\'re a champion 🏆',
  20: '20 minutes complete! 🔥',
  30: '30 minutes focused! Amazing ⭐',
  45: '45 minutes! Incredible work 💎',
  60: '1 hour focused! Major achievement 🎉',
};

export const useFocusMode = (lessonId?: string) => {
  const [state, setState] = useState<FocusModeState>({
    focusState: 'FOCUS_IDLE',
    session: null,
    currentSegmentProgress: 0,
  });
  
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageIndexRef = useRef(-1);
  const sessionRef = useRef<FocusSession | null>(null);
  const segmentIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeStartTimeRef = useRef<number | null>(null);
  const isCompletedRef = useRef(false);

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

  // Show time milestone message
  const showTimeMilestone = useCallback((minutes: number, isArabic: boolean) => {
    const messages = isArabic ? TIME_MILESTONE_MESSAGES_AR : TIME_MILESTONE_MESSAGES_EN;
    if (messages[minutes]) {
      showMessage(messages[minutes], 4000);
    }
  }, [showMessage]);

  // START: When video starts playing
  const startFocus = useCallback(() => {
    // Cannot restart if already completed
    if (isCompletedRef.current) return;
    
    // If already active, do nothing
    if (state.focusState === 'FOCUS_ACTIVE') return;
    
    // If resuming from pause, just update state
    if (state.focusState === 'FOCUS_PAUSED' && sessionRef.current) {
      activeStartTimeRef.current = Date.now();
      setState(prev => ({
        ...prev,
        focusState: 'FOCUS_ACTIVE',
      }));
      return;
    }
    
    // Fresh start
    const session: FocusSession = {
      startTime: Date.now(),
      totalFocusedTime: 0,
      interruptions: 0,
      completedSegments: 0,
    };
    sessionRef.current = session;
    activeStartTimeRef.current = Date.now();
    isCompletedRef.current = false;
    
    setState({
      focusState: 'FOCUS_ACTIVE',
      session,
      currentSegmentProgress: 0,
    });
  }, [state.focusState]);

  // PAUSE: When video is paused or buffering
  const pauseFocus = useCallback(() => {
    if (state.focusState !== 'FOCUS_ACTIVE' || !sessionRef.current) return;
    
    // Accumulate time since last active start
    if (activeStartTimeRef.current) {
      sessionRef.current.totalFocusedTime += Date.now() - activeStartTimeRef.current;
      activeStartTimeRef.current = null;
    }
    sessionRef.current.interruptions += 1;
    
    setState(prev => ({
      ...prev,
      focusState: 'FOCUS_PAUSED',
      session: { ...sessionRef.current! },
    }));
  }, [state.focusState]);

  // COMPLETE: When lesson is marked complete or video ends
  const completeFocus = useCallback(() => {
    // Save final session data
    if (sessionRef.current && activeStartTimeRef.current) {
      sessionRef.current.totalFocusedTime += Date.now() - activeStartTimeRef.current;
    }
    
    const finalSession = sessionRef.current;
    
    if (finalSession) {
      console.log('Focus session completed:', {
        totalMinutes: Math.round(finalSession.totalFocusedTime / 60000),
        interruptions: finalSession.interruptions,
        completedSegments: finalSession.completedSegments,
        lessonId,
      });
    }
    
    // Mark as completed - prevents restart
    isCompletedRef.current = true;
    activeStartTimeRef.current = null;
    
    setState({
      focusState: 'FOCUS_COMPLETED',
      session: finalSession,
      currentSegmentProgress: 0,
    });
  }, [lessonId]);

  // RESET: Allow restart from beginning (e.g., replay)
  const resetFocus = useCallback(() => {
    sessionRef.current = null;
    activeStartTimeRef.current = null;
    isCompletedRef.current = false;
    
    setState({
      focusState: 'FOCUS_IDLE',
      session: null,
      currentSegmentProgress: 0,
    });
  }, []);

  // Track 20-minute segments - ONLY when FOCUS_ACTIVE
  useEffect(() => {
    if (state.focusState === 'FOCUS_ACTIVE') {
      segmentIntervalRef.current = setInterval(() => {
        if (sessionRef.current && activeStartTimeRef.current) {
          const currentActiveTime = Date.now() - activeStartTimeRef.current;
          const totalTime = sessionRef.current.totalFocusedTime + currentActiveTime;
          
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
      }, 1000);

      return () => {
        if (segmentIntervalRef.current) {
          clearInterval(segmentIntervalRef.current);
        }
      };
    } else {
      // Clear interval when not active
      if (segmentIntervalRef.current) {
        clearInterval(segmentIntervalRef.current);
        segmentIntervalRef.current = null;
      }
    }
  }, [state.focusState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
      if (segmentIntervalRef.current) {
        clearInterval(segmentIntervalRef.current);
      }
    };
  }, []);

  // Get focus stats
  const getFocusStats = useCallback(() => {
    if (!sessionRef.current) return null;
    
    let totalTime = sessionRef.current.totalFocusedTime;
    if (activeStartTimeRef.current && state.focusState === 'FOCUS_ACTIVE') {
      totalTime += Date.now() - activeStartTimeRef.current;
    }
    
    return {
      totalMinutes: Math.floor(totalTime / 60000),
      completedSegments: sessionRef.current.completedSegments,
      interruptions: sessionRef.current.interruptions,
    };
  }, [state.focusState]);

  return {
    focusState: state.focusState,
    session: state.session,
    currentSegmentProgress: state.currentSegmentProgress,
    currentMessage,
    // State checks
    isActive: state.focusState === 'FOCUS_ACTIVE',
    isPaused: state.focusState === 'FOCUS_PAUSED',
    isCompleted: state.focusState === 'FOCUS_COMPLETED',
    isIdle: state.focusState === 'FOCUS_IDLE',
    // Actions
    startFocus,
    pauseFocus,
    completeFocus,
    resetFocus,
    showRandomMessage,
    showSegmentComplete,
    showTimeMilestone,
    getFocusStats,
  };
};
