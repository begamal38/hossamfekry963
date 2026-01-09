import React, { useState, useEffect } from 'react';
import logo from '@/assets/logo.png';

interface AppLaunchAnimationProps {
  onComplete: () => void;
}

/**
 * Lightweight app launch animation for mobile.
 * CSS-only, GPU-accelerated, non-blocking.
 * Duration: ~1.2s total
 */
export const AppLaunchAnimation: React.FC<AppLaunchAnimationProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'enter' | 'exit'>('enter');

  useEffect(() => {
    // Phase 1: Enter animation (0.8s)
    const exitTimer = setTimeout(() => {
      setPhase('exit');
    }, 800);

    // Phase 2: Exit and complete (0.4s after exit starts)
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 1200);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`
        fixed inset-0 z-[9999] flex items-center justify-center
        bg-white dark:bg-[#0E1621]
        transition-opacity duration-400 ease-out
        ${phase === 'exit' ? 'opacity-0 pointer-events-none' : 'opacity-100'}
      `}
      aria-hidden="true"
    >
      {/* Subtle molecular dots background hint */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="launch-dots" />
      </div>

      {/* Logo container */}
      <div
        className={`
          relative z-10 flex items-center justify-center
          transform-gpu will-change-transform
          ${phase === 'enter' ? 'animate-launch-enter' : 'animate-launch-exit'}
        `}
      >
        <img
          src={logo}
          alt=""
          className="h-20 w-auto object-contain"
          style={{ filter: 'none' }}
        />
      </div>
    </div>
  );
};

export default AppLaunchAnimation;
