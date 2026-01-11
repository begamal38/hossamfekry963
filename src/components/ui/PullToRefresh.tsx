import React, { useState, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  /** Threshold in pixels to trigger refresh */
  threshold?: number;
  /** Maximum pull distance */
  maxPull?: number;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  className,
  threshold = 80,
  maxPull = 120,
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isRefreshing) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    // Only start pull if at top of scroll
    if (container.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) {
      setIsPulling(false);
      setPullDistance(0);
      return;
    }

    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    
    if (diff > 0) {
      // Apply resistance effect
      const resistance = 0.5;
      const distance = Math.min(diff * resistance, maxPull);
      setPullDistance(distance);
    }
  }, [isPulling, isRefreshing, maxPull]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    
    setIsPulling(false);
    
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold * 0.6); // Keep indicator visible
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh error:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh]);

  const progress = Math.min(pullDistance / threshold, 1);
  const shouldTrigger = pullDistance >= threshold;

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-y-auto", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 z-50 transition-all duration-200 pointer-events-none",
          (pullDistance > 0 || isRefreshing) ? "opacity-100" : "opacity-0"
        )}
        style={{
          top: Math.max(pullDistance - 50, 8),
        }}
      >
        <div
          className={cn(
            "w-10 h-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center transition-all duration-200",
            shouldTrigger && !isRefreshing && "bg-primary/10 border-primary/30",
            isRefreshing && "bg-primary/10 border-primary/30"
          )}
          style={{
            transform: `scale(${0.8 + progress * 0.2}) rotate(${progress * 180}deg)`,
          }}
        >
          <Loader2
            className={cn(
              "w-5 h-5 transition-colors",
              shouldTrigger || isRefreshing ? "text-primary" : "text-muted-foreground",
              isRefreshing && "animate-spin"
            )}
          />
        </div>
      </div>

      {/* Content with pull transform */}
      <div
        className="transition-transform duration-200 ease-out"
        style={{
          transform: pullDistance > 0 && !isRefreshing 
            ? `translateY(${pullDistance}px)` 
            : isRefreshing 
              ? `translateY(${threshold * 0.4}px)`
              : 'translateY(0)',
        }}
      >
        {children}
      </div>
    </div>
  );
};
