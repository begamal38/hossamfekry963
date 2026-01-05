import { useState, useEffect } from 'react';

export type UserType = 'visitor' | 'student' | 'enrolled';

export interface UnifiedFocusStateProps {
  userType: UserType;
  isVideoPlaying: boolean;
  isTabActive: boolean;
  isPageVisible: boolean;
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
 * 
 * NOTE: Viewport visibility is intentionally NOT checked.
 * YouTube embeds are unreliable with intersection observers,
 * and mobile scrolling causes false focus loss.
 */
export const useUnifiedFocusState = ({
  userType,
  isVideoPlaying,
  isTabActive,
  isPageVisible,
}: UnifiedFocusStateProps): UnifiedFocusState => {
  const [focusLostReason, setFocusLostReason] = useState<string | null>(null);

  // Compute focus active state (NO viewport check)
  const isFocusActive = isVideoPlaying && isTabActive && isPageVisible;

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
    }
  }, [isFocusActive, isVideoPlaying, isTabActive, isPageVisible]);

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
  // IMPORTANT: "tab active" events are unreliable on mobile + YouTube iframes.
  // We default to true, then only flip to false on real blur/pagehide events.
  const [isTabActive, setIsTabActive] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsPageVisible(visible);

      // If the page is visible again, treat it as active (fail-safe).
      if (visible) setIsTabActive(true);
    };

    const handleFocus = () => setIsTabActive(true);
    const handleBlur = () => setIsTabActive(false);

    const handlePageShow = () => {
      setIsPageVisible(true);
      setIsTabActive(true);
    };

    const handlePageHide = () => {
      setIsTabActive(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);

  return { isPageVisible, isTabActive };
};
