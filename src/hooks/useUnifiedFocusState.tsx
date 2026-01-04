import { useState, useEffect, useCallback, useRef } from 'react';

export type UserType = 'visitor' | 'student' | 'enrolled';

export interface UnifiedFocusStateProps {
  userType: UserType;
  isVideoPlaying: boolean;
  isTabActive: boolean;
  isPageVisible: boolean;
  isVideoInViewport: boolean;
}

export interface UnifiedFocusState {
  isFocusActive: boolean;
  focusLostReason: string | null;
}

/**
 * Central hook for computing focus mode state based on system conditions.
 * Focus is active ONLY when ALL conditions are true:
 * - Video is playing
 * - Browser tab is active
 * - Page is visible
 * - Video iframe is ≥60% in viewport
 */
export const useUnifiedFocusState = ({
  userType,
  isVideoPlaying,
  isTabActive,
  isPageVisible,
  isVideoInViewport,
}: UnifiedFocusStateProps): UnifiedFocusState => {
  const [focusLostReason, setFocusLostReason] = useState<string | null>(null);

  // Compute focus active state
  const isFocusActive = isVideoPlaying && isTabActive && isPageVisible && isVideoInViewport;

  // Track reason for focus loss
  useEffect(() => {
    if (isFocusActive) {
      setFocusLostReason(null);
    } else if (!isVideoPlaying) {
      setFocusLostReason('video_paused');
    } else if (!isTabActive) {
      setFocusLostReason('tab_inactive');
    } else if (!isPageVisible) {
      setFocusLostReason('page_hidden');
    } else if (!isVideoInViewport) {
      setFocusLostReason('video_not_visible');
    }
  }, [isFocusActive, isVideoPlaying, isTabActive, isPageVisible, isVideoInViewport]);

  return {
    isFocusActive,
    focusLostReason,
  };
};

/**
 * Hook to track page visibility and tab active state
 */
export const usePageVisibility = () => {
  const [isPageVisible, setIsPageVisible] = useState(!document.hidden);
  const [isTabActive, setIsTabActive] = useState(document.hasFocus());

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };

    const handleFocus = () => setIsTabActive(true);
    const handleBlur = () => setIsTabActive(false);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return { isPageVisible, isTabActive };
};
