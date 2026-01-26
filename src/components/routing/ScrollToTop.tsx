import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Smart scroll behavior that preserves scroll position on back navigation
 * but resets to top on forward navigation (new page visits).
 */
export function ScrollToTop() {
  const { pathname, key } = useLocation();
  const navigationType = useNavigationType();
  const scrollPositions = useRef<Map<string, number>>(new Map());
  const prevKey = useRef<string | null>(null);

  useEffect(() => {
    // Save scroll position before navigating away
    if (prevKey.current) {
      scrollPositions.current.set(prevKey.current, window.scrollY);
    }
    prevKey.current = key;

    // Determine scroll behavior based on navigation type
    if (navigationType === 'POP') {
      // Back/forward navigation - restore saved position
      const savedPosition = scrollPositions.current.get(key);
      if (savedPosition !== undefined) {
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          window.scrollTo(0, savedPosition);
        });
      }
    } else {
      // PUSH or REPLACE - scroll to top for new navigation
      window.scrollTo(0, 0);
    }
  }, [pathname, key, navigationType]);

  return null;
}