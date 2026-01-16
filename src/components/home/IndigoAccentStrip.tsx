import React from 'react';
import { cn } from '@/lib/utils';

interface IndigoAccentStripProps {
  variant?: 'gradient' | 'glow' | 'wave';
  className?: string;
}

/**
 * Subtle indigo accent strip to add visual interest between sections
 * Inspired by premium mobile-first design (Ana Vodafone style)
 */
export const IndigoAccentStrip: React.FC<IndigoAccentStripProps> = ({
  variant = 'gradient',
  className
}) => {
  if (variant === 'wave') {
    return (
      <div className={cn("relative h-16 overflow-hidden", className)}>
        <svg 
          viewBox="0 0 1440 60" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
        >
          <path 
            d="M0 30C240 10 480 50 720 30C960 10 1200 50 1440 30V60H0V30Z" 
            fill="url(#wave-gradient)" 
            fillOpacity="0.15"
          />
          <defs>
            <linearGradient id="wave-gradient" x1="0" y1="0" x2="1440" y2="0">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              <stop offset="30%" stopColor="hsl(var(--primary))" stopOpacity="1" />
              <stop offset="70%" stopColor="hsl(var(--primary))" stopOpacity="1" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  if (variant === 'glow') {
    return (
      <div className={cn("relative h-12 flex items-center justify-center", className)}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1/2 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </div>
        <div className="absolute w-24 h-8 bg-primary/10 rounded-full blur-2xl" />
      </div>
    );
  }

  // Default gradient variant
  return (
    <div className={cn("relative py-1", className)}>
      <div className="absolute inset-0 flex items-center">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>
      {/* Side accents */}
      <div className="absolute start-0 top-1/2 -translate-y-1/2 w-32 h-16 bg-gradient-to-r from-primary/5 to-transparent blur-2xl pointer-events-none" />
      <div className="absolute end-0 top-1/2 -translate-y-1/2 w-32 h-16 bg-gradient-to-l from-primary/5 to-transparent blur-2xl pointer-events-none" />
    </div>
  );
};
