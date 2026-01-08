import React, { memo, useEffect, useState, useMemo } from 'react';

/**
 * Temporary Winter Ambient Effect
 * Auto-expires after 35 days from activation date
 * Applies ONLY to hero section, respects reduced motion & performance
 */

// Configuration
const ACTIVATION_DATE = new Date('2026-01-08');
const DURATION_DAYS = 35;
const EXPIRATION_DATE = new Date(ACTIVATION_DATE.getTime() + DURATION_DAYS * 24 * 60 * 60 * 1000);
const PARTICLE_COUNT = 40; // More visible particles

// Check if effect should be active
const isEffectActive = (): boolean => {
  const now = new Date();
  return now >= ACTIVATION_DATE && now < EXPIRATION_DATE;
};

// Check for reduced motion preference
const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Check for low performance indicators
const isLowPerformance = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const cores = (navigator as any).hardwareConcurrency || 4;
  const memory = (navigator as any).deviceMemory || 4;
  return cores < 2 || memory < 2;
};

// Generate random snowflakes with varied properties
const generateSnowflakes = () => {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 8,
    duration: 6 + Math.random() * 8, // 6-14 seconds
    size: 3 + Math.random() * 6, // 3-9px - larger snowflakes
    opacity: 0.4 + Math.random() * 0.5, // 0.4-0.9 - more visible
    drift: -30 + Math.random() * 60, // Horizontal drift
    wobble: Math.random() > 0.5, // Some wobble effect
  }));
};

interface WinterAmbientEffectProps {
  isVisible?: boolean;
}

export const WinterAmbientEffect: React.FC<WinterAmbientEffectProps> = memo(({ isVisible = true }) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(true);

  const snowflakes = useMemo(() => generateSnowflakes(), []);

  useEffect(() => {
    const checkShouldRender = () => {
      if (!isEffectActive()) return false;
      if (prefersReducedMotion()) return false;
      if (isLowPerformance()) return false;
      if (typeof window !== 'undefined' && window.innerWidth < 360) return false;
      return true;
    };

    setShouldRender(checkShouldRender());

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = () => setShouldRender(checkShouldRender());
    motionQuery.addEventListener('change', handleMotionChange);

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  // Handle tab visibility
  useEffect(() => {
    const handleVisibility = () => {
      setIsTabVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Don't render if conditions not met
  if (!shouldRender || !isVisible || !isTabVisible) {
    return null;
  }

  return (
    <div 
      className="absolute inset-0 overflow-hidden pointer-events-none z-[5]"
      aria-hidden="true"
    >
      {/* Snowflakes */}
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className={`absolute snowflake ${flake.wobble ? 'snowflake-wobble' : ''}`}
          style={{
            left: `${flake.left}%`,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            opacity: flake.opacity,
            animationDelay: `${flake.delay}s`,
            animationDuration: `${flake.duration}s`,
            ['--drift' as any]: `${flake.drift}px`,
          }}
        />
      ))}
      
      {/* Frost overlay on edges */}
      <div className="frost-overlay" />
      
      {/* Animated fog at bottom */}
      <div className="winter-fog-container">
        <div className="winter-fog fog-layer-1" />
        <div className="winter-fog fog-layer-2" />
        <div className="winter-fog fog-layer-3" />
      </div>
      
      <style>{`
        /* Snowflake base style */
        .snowflake {
          background: radial-gradient(circle at 30% 30%, 
            rgba(255, 255, 255, 0.95) 0%, 
            rgba(220, 240, 255, 0.7) 40%, 
            rgba(200, 230, 255, 0.3) 70%,
            transparent 100%
          );
          border-radius: 50%;
          top: -15px;
          animation: snow-fall linear infinite;
          will-change: transform;
          filter: blur(0.3px);
          box-shadow: 
            0 0 4px rgba(255, 255, 255, 0.5),
            0 0 8px rgba(200, 230, 255, 0.3);
        }
        
        .snowflake-wobble {
          animation: snow-fall-wobble linear infinite;
        }
        
        /* Light mode - subtle but visible */
        :root .snowflake {
          background: radial-gradient(circle at 30% 30%, 
            rgba(100, 180, 255, 0.6) 0%, 
            rgba(150, 200, 255, 0.4) 40%, 
            rgba(180, 220, 255, 0.2) 70%,
            transparent 100%
          );
          box-shadow: 
            0 0 3px rgba(100, 180, 255, 0.4),
            0 0 6px rgba(150, 200, 255, 0.2);
        }
        
        /* Dark mode - bright white/ice blue */
        .dark .snowflake {
          background: radial-gradient(circle at 30% 30%, 
            rgba(255, 255, 255, 0.95) 0%, 
            rgba(220, 245, 255, 0.7) 40%, 
            rgba(200, 235, 255, 0.4) 70%,
            transparent 100%
          );
          box-shadow: 
            0 0 6px rgba(255, 255, 255, 0.6),
            0 0 12px rgba(200, 235, 255, 0.4);
        }
        
        /* Frost overlay on edges */
        .frost-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: 
            radial-gradient(ellipse at top left, rgba(200, 230, 255, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at top right, rgba(200, 230, 255, 0.1) 0%, transparent 40%),
            radial-gradient(ellipse at bottom left, rgba(180, 220, 255, 0.08) 0%, transparent 30%);
        }
        
        .dark .frost-overlay {
          background: 
            radial-gradient(ellipse at top left, rgba(220, 245, 255, 0.12) 0%, transparent 50%),
            radial-gradient(ellipse at top right, rgba(200, 235, 255, 0.08) 0%, transparent 40%),
            radial-gradient(ellipse at bottom left, rgba(180, 225, 255, 0.06) 0%, transparent 30%);
        }
        
        /* Main falling animation */
        @keyframes snow-fall {
          0% {
            transform: translateY(-15px) translateX(0) scale(0.8);
            opacity: 0;
          }
          5% {
            opacity: var(--tw-opacity, 0.7);
            transform: translateY(0) translateX(0) scale(1);
          }
          95% {
            opacity: var(--tw-opacity, 0.7);
          }
          100% {
            transform: translateY(calc(100vh + 30px)) translateX(var(--drift, 0px)) scale(0.6);
            opacity: 0;
          }
        }
        
        /* Wobble variation */
        @keyframes snow-fall-wobble {
          0% {
            transform: translateY(-15px) translateX(0) rotate(0deg) scale(0.8);
            opacity: 0;
          }
          5% {
            opacity: var(--tw-opacity, 0.7);
          }
          25% {
            transform: translateY(25vh) translateX(calc(var(--drift, 0px) * 0.3)) rotate(90deg) scale(1);
          }
          50% {
            transform: translateY(50vh) translateX(calc(var(--drift, 0px) * 0.6)) rotate(180deg) scale(0.9);
          }
          75% {
            transform: translateY(75vh) translateX(calc(var(--drift, 0px) * 0.8)) rotate(270deg) scale(0.8);
          }
          95% {
            opacity: var(--tw-opacity, 0.7);
          }
          100% {
            transform: translateY(calc(100vh + 30px)) translateX(var(--drift, 0px)) rotate(360deg) scale(0.6);
            opacity: 0;
          }
        }
        
        /* Animated Fog at Bottom */
        .winter-fog-container {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 150px;
          overflow: hidden;
          pointer-events: none;
        }
        
        .winter-fog {
          position: absolute;
          bottom: -20px;
          left: -10%;
          width: 120%;
          height: 100%;
          background: linear-gradient(to top,
            rgba(220, 240, 255, 0.35) 0%,
            rgba(200, 230, 255, 0.2) 30%,
            rgba(180, 220, 255, 0.08) 60%,
            transparent 100%
          );
          filter: blur(8px);
          will-change: transform;
        }
        
        .fog-layer-1 {
          animation: fog-drift-1 12s ease-in-out infinite;
        }
        
        .fog-layer-2 {
          animation: fog-drift-2 15s ease-in-out infinite;
          opacity: 0.7;
        }
        
        .fog-layer-3 {
          animation: fog-drift-3 18s ease-in-out infinite;
          opacity: 0.5;
        }
        
        .dark .winter-fog {
          background: linear-gradient(to top,
            rgba(200, 235, 255, 0.25) 0%,
            rgba(180, 225, 255, 0.15) 30%,
            rgba(160, 215, 255, 0.05) 60%,
            transparent 100%
          );
        }
        
        @keyframes fog-drift-1 {
          0%, 100% {
            transform: translateX(0) scaleY(1);
          }
          50% {
            transform: translateX(3%) scaleY(1.1);
          }
        }
        
        @keyframes fog-drift-2 {
          0%, 100% {
            transform: translateX(2%) scaleY(0.9);
          }
          50% {
            transform: translateX(-2%) scaleY(1.05);
          }
        }
        
        @keyframes fog-drift-3 {
          0%, 100% {
            transform: translateX(-1%) scaleY(1.05);
          }
          50% {
            transform: translateX(4%) scaleY(0.95);
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .snowflake,
          .frost-overlay,
          .winter-fog {
            animation: none !important;
            display: none !important;
          }
        }
        
        /* Reduce on very small screens */
        @media (max-width: 480px) {
          .snowflake:nth-child(n+25) {
            display: none;
          }
          .winter-fog-container {
            height: 80px;
          }
        }
      `}</style>
    </div>
  );
});

WinterAmbientEffect.displayName = 'WinterAmbientEffect';
