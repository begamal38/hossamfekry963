import React from 'react';

/**
 * Lightweight CSS/SVG scientific background animation
 * Abstract hexagonal molecular pattern with slow orbital motion
 * Decorative only - does not interfere with content
 */
export const ScientificBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      {/* SVG Molecular Pattern */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.06] dark:opacity-[0.08]"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Gradient for nodes */}
          <radialGradient id="nodeGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="1" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
          </radialGradient>
          
          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Molecular structure group with slow rotation */}
        <g className="animate-molecular-orbit" filter="url(#glow)">
          {/* Central hexagon molecule */}
          <g transform="translate(400, 300)">
            {/* Hexagon bonds */}
            <polygon
              points="0,-60 52,-30 52,30 0,60 -52,30 -52,-30"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="1.5"
              className="animate-pulse-slow"
            />
            
            {/* Atomic nodes at vertices */}
            <circle cx="0" cy="-60" r="8" fill="url(#nodeGradient)" />
            <circle cx="52" cy="-30" r="6" fill="url(#nodeGradient)" />
            <circle cx="52" cy="30" r="8" fill="url(#nodeGradient)" />
            <circle cx="0" cy="60" r="6" fill="url(#nodeGradient)" />
            <circle cx="-52" cy="30" r="8" fill="url(#nodeGradient)" />
            <circle cx="-52" cy="-30" r="6" fill="url(#nodeGradient)" />
            
            {/* Center node */}
            <circle cx="0" cy="0" r="10" fill="url(#nodeGradient)" />
            
            {/* Internal bonds */}
            <line x1="0" y1="0" x2="0" y2="-60" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.5" />
            <line x1="0" y1="0" x2="52" y2="-30" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.5" />
            <line x1="0" y1="0" x2="52" y2="30" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.5" />
          </g>

          {/* Secondary molecule - top right */}
          <g transform="translate(620, 150)">
            <polygon
              points="0,-40 35,-20 35,20 0,40 -35,20 -35,-20"
              fill="none"
              stroke="hsl(var(--accent))"
              strokeWidth="1"
              opacity="0.7"
            />
            <circle cx="0" cy="-40" r="5" fill="hsl(var(--accent))" opacity="0.8" />
            <circle cx="35" cy="-20" r="4" fill="hsl(var(--accent))" opacity="0.8" />
            <circle cx="35" cy="20" r="5" fill="hsl(var(--accent))" opacity="0.8" />
            <circle cx="0" cy="40" r="4" fill="hsl(var(--accent))" opacity="0.8" />
            <circle cx="-35" cy="20" r="5" fill="hsl(var(--accent))" opacity="0.8" />
            <circle cx="-35" cy="-20" r="4" fill="hsl(var(--accent))" opacity="0.8" />
          </g>

          {/* Tertiary molecule - bottom left */}
          <g transform="translate(180, 450)">
            <polygon
              points="0,-45 39,-22 39,22 0,45 -39,22 -39,-22"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="1"
              opacity="0.6"
            />
            <circle cx="0" cy="-45" r="6" fill="hsl(var(--primary))" opacity="0.7" />
            <circle cx="39" cy="-22" r="5" fill="hsl(var(--primary))" opacity="0.7" />
            <circle cx="39" cy="22" r="6" fill="hsl(var(--primary))" opacity="0.7" />
            <circle cx="0" cy="45" r="5" fill="hsl(var(--primary))" opacity="0.7" />
            <circle cx="-39" cy="22" r="6" fill="hsl(var(--primary))" opacity="0.7" />
            <circle cx="-39" cy="-22" r="5" fill="hsl(var(--primary))" opacity="0.7" />
          </g>

          {/* Connecting bonds between molecules */}
          <line x1="452" y1="270" x2="585" y2="170" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.3" strokeDasharray="4 4" />
          <line x1="348" y1="330" x2="219" y2="428" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.3" strokeDasharray="4 4" />
        </g>

        {/* Floating atoms with independent animation */}
        <g className="animate-float-slow">
          <circle cx="120" cy="120" r="4" fill="hsl(var(--accent))" opacity="0.5" />
          <circle cx="680" cy="480" r="3" fill="hsl(var(--primary))" opacity="0.4" />
          <circle cx="750" cy="280" r="5" fill="hsl(var(--accent))" opacity="0.3" />
          <circle cx="50" cy="350" r="4" fill="hsl(var(--primary))" opacity="0.4" />
        </g>
      </svg>

      {/* Additional floating particles with CSS animation */}
      <div className="absolute top-1/4 left-1/6 w-2 h-2 rounded-full bg-primary/20 animate-float-particle" />
      <div className="absolute top-3/4 right-1/4 w-3 h-3 rounded-full bg-accent/15 animate-float-particle-delayed" />
      <div className="absolute bottom-1/3 left-1/3 w-2 h-2 rounded-full bg-primary/15 animate-float-particle-slow" />
    </div>
  );
};
