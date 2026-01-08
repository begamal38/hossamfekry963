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
const PARTICLE_COUNT = 25; // Lightweight count

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
  // @ts-ignore - hardwareConcurrency may not exist
  const cores = navigator.hardwareConcurrency || 4;
  // @ts-ignore - deviceMemory may not exist  
  const memory = (navigator as any).deviceMemory || 4;
  return cores < 2 || memory < 2;
};

// Generate random particles
const generateParticles = () => {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 10,
    duration: 8 + Math.random() * 6, // 8-14 seconds
    size: 2 + Math.random() * 4, // 2-6px
    opacity: 0.3 + Math.random() * 0.4, // 0.3-0.7
    drift: -20 + Math.random() * 40, // Horizontal drift
  }));
};

interface WinterAmbientEffectProps {
  isVisible?: boolean;
}

export const WinterAmbientEffect: React.FC<WinterAmbientEffectProps> = memo(({ isVisible = true }) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(true);

  const particles = useMemo(() => generateParticles(), []);

  useEffect(() => {
    // Check all conditions
    const checkShouldRender = () => {
      if (!isEffectActive()) return false;
      if (prefersReducedMotion()) return false;
      if (isLowPerformance()) return false;
      if (typeof window !== 'undefined' && window.innerWidth < 360) return false;
      return true;
    };

    setShouldRender(checkShouldRender());

    // Listen for reduced motion changes
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
      className="absolute inset-0 overflow-hidden pointer-events-none z-[1]"
      aria-hidden="true"
    >
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full winter-particle"
          style={{
            left: `${particle.left}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
            // @ts-ignore
            '--drift': `${particle.drift}px`,
          }}
        />
      ))}
      
      <style>{`
        .winter-particle {
          background: radial-gradient(circle, 
            hsl(var(--primary) / 0.8) 0%, 
            hsl(var(--primary) / 0.3) 50%, 
            transparent 70%
          );
          top: -10px;
          animation: winter-fall linear infinite;
          will-change: transform;
        }
        
        .dark .winter-particle {
          background: radial-gradient(circle, 
            hsl(210 100% 95% / 0.7) 0%, 
            hsl(200 80% 90% / 0.3) 50%, 
            transparent 70%
          );
        }
        
        @keyframes winter-fall {
          0% {
            transform: translateY(-10px) translateX(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: var(--tw-opacity, 0.5);
          }
          90% {
            opacity: var(--tw-opacity, 0.5);
          }
          100% {
            transform: translateY(calc(100vh + 20px)) translateX(var(--drift, 0px)) rotate(360deg);
            opacity: 0;
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .winter-particle {
            animation: none !important;
            display: none;
          }
        }
      `}</style>
    </div>
  );
});

WinterAmbientEffect.displayName = 'WinterAmbientEffect';
