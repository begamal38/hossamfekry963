import React from 'react';
import { cn } from '@/lib/utils';

interface IndigoAccentStripProps {
  variant?: 'gradient' | 'glow' | 'wave' | 'divider';
  className?: string;
}

/**
 * Subtle indigo accent strip to add visual interest between sections
 * Inspired by premium mobile-first design (Ana Vodafone style)
 * Provides visual separation and brand color presence without overwhelming
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
        {/* Center line with glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2/3 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </div>
        {/* Glow orb */}
        <div className="absolute w-32 h-10 bg-primary/15 rounded-full blur-2xl" />
        {/* Side accent lines */}
        <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
      </div>
    );
  }

  if (variant === 'divider') {
    return (
      <div className={cn("relative py-4", className)}>
        {/* Main divider line with brand color */}
        <div className="section-divider mx-auto max-w-4xl" />
        {/* Ambient side glows for brand presence */}
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-primary/8 to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-primary/8 to-transparent pointer-events-none" />
      </div>
    );
  }

  // Default gradient variant - subtle but visible
  return (
    <div className={cn("relative py-2", className)}>
      {/* Center gradient line */}
      <div className="absolute inset-0 flex items-center">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
      </div>
      {/* Subtle shadow break */}
      <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-primary/3 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-primary/3 to-transparent pointer-events-none" />
      {/* Side accents for brand presence */}
      <div className="absolute start-0 top-1/2 -translate-y-1/2 w-40 h-20 bg-gradient-to-r from-primary/8 to-transparent blur-2xl pointer-events-none" />
      <div className="absolute end-0 top-1/2 -translate-y-1/2 w-40 h-20 bg-gradient-to-l from-primary/8 to-transparent blur-2xl pointer-events-none" />
    </div>
  );
};
