import { useState, useEffect, useRef, useCallback } from 'react';

export type UserType = 'visitor' | 'student' | 'enrolled';
export type FocusLostReason = 'video_paused' | 'tab_inactive' | 'page_hidden' | null;

export interface UnifiedFocusStateProps {
  userType: UserType;
  isVideoPlaying: boolean;
  isTabActive: boolean;
  isPageVisible: boolean;
}

export interface UnifiedFocusState {
  isFocusActive: boolean;
  focusLostReason: FocusLostReason;
  /** Stable ref-based active state that survives re-renders */
  isFocusActiveRef: React.RefObject<boolean>;
}

/**
 * Central hook for computing focus mode state based on system conditions.
 * Focus is active ONLY when ALL conditions are true:
 * - Video is playing
 * - Browser tab is active
 * - Page is visible
 * 
 * RE-RENDER SAFETY: Uses refs to maintain state stability across re-renders.
 * The isFocusActiveRef allows child components to check focus without causing re-renders.
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
  const [focusLostReason, setFocusLostReason] = useState<FocusLostReason>(null);
  
  // Ref-based state for re-render stability
  const isFocusActiveRef = useRef<boolean>(false);

  // Compute focus active state (NO viewport check)
  const isFocusActive = isVideoPlaying && isTabActive && isPageVisible;
  
  // Keep ref in sync (no re-render triggered)
  isFocusActiveRef.current = isFocusActive;

  // Track reason for focus loss with priority ordering
  useEffect(() => {
    if (isFocusActive) {
      setFocusLostReason(null);
    } else if (!isPageVisible) {
      // Page hidden is highest priority (user left entirely)
      setFocusLostReason('page_hidden');
    } else if (!isTabActive) {
      // Tab inactive is next (user switched tabs)
      setFocusLostReason('tab_inactive');
    } else if (!isVideoPlaying) {
      // Video paused is lowest priority (explicit user action)
      setFocusLostReason('video_paused');
    }
  }, [isFocusActive, isVideoPlaying, isTabActive, isPageVisible]);

  return {
    isFocusActive,
    focusLostReason,
    isFocusActiveRef,
  };
};

/**
 * Hook to track page visibility and tab active state
 * 
 * RE-RENDER SAFETY: Uses refs internally to avoid unnecessary re-renders.
 * State updates are batched and debounced to prevent flickering.
 * 
 * CRITICAL: This is the single source of truth for visibility state.
 * All focus-related logic MUST use this hook's output.
 */
export const usePageVisibility = () => {
  const [isPageVisible, setIsPageVisible] = useState(!document.hidden);
  // IMPORTANT: window focus/blur is unreliable with YouTube iframes (especially on mobile).
  // We treat "tab active" as "page is visible" (fail-safe) to avoid false focus loss.
  const [isTabActive, setIsTabActive] = useState(true);
  
  // Debounce ref to prevent rapid state changes
  const lastUpdateRef = useRef<number>(0);
  const DEBOUNCE_MS = 100; // Minimum 100ms between updates

  useEffect(() => {
    // NOTE: window focus/blur is noisy with YouTube iframes (especially on mobile).
    // We treat "tab active" as "document is visible" to avoid false focus loss.
    const syncFromVisibility = () => {
      const now = Date.now();
      // Debounce rapid visibility changes
      if (now - lastUpdateRef.current < DEBOUNCE_MS) return;
      lastUpdateRef.current = now;
      
      const visible = !document.hidden;
      setIsPageVisible(visible);
      setIsTabActive(visible);
    };

    const handleVisibilityChange = () => syncFromVisibility();

    const handlePageShow = () => {
      lastUpdateRef.current = Date.now();
      setIsPageVisible(true);
      setIsTabActive(true);
    };

    const handlePageHide = () => {
      lastUpdateRef.current = Date.now();
      setIsPageVisible(false);
      setIsTabActive(false);
    };

    // Initial sync
    syncFromVisibility();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);

  return { isPageVisible, isTabActive };
};
