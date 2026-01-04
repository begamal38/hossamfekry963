import { useState, useEffect, useRef, RefObject } from 'react';

/**
 * Hook to track if an element is visible in the viewport
 * @param threshold - Percentage of element that must be visible (0-1)
 * @returns [ref, isVisible] - Ref to attach to element and visibility state
 */
export const useViewportVisibility = (threshold: number = 0.6): [RefObject<HTMLDivElement>, boolean] => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.intersectionRatio >= threshold);
      },
      {
        threshold: [0, 0.25, 0.5, 0.6, 0.75, 1],
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  return [ref, isVisible];
};
