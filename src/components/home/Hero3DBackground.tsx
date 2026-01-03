import React from 'react';

/**
 * Lightweight CSS/SVG 3D-style chemistry background animation.
 * Ball-and-stick molecular structure with orbiting electrons.
 * Purely decorative, GPU-friendly, works in dark mode.
 */
export const Hero3DBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Main SVG Molecular Structure - enhanced with ambient breathing */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.18] dark:opacity-[0.25]"
        viewBox="0 0 1000 600"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* 3D-style gradient for atoms */}
          <radialGradient id="atom3d" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="1" />
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.7" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
          </radialGradient>
          
          <radialGradient id="atom3dAccent" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="1" />
            <stop offset="50%" stopColor="hsl(var(--accent))" stopOpacity="0.7" />
            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.2" />
          </radialGradient>
          
          {/* Glow filter */}
          <filter id="atomGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Orbit path */}
          <ellipse id="orbitPath" cx="0" cy="0" rx="80" ry="30" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.5" opacity="0.3" />
        </defs>

        {/* Main Molecule Group - Slow rotation with ambient breathing */}
        <g className="animate-molecule-rotate" style={{ transformOrigin: '500px 300px', animationDuration: '45s' }}>
          
          {/* Central benzene ring structure */}
          <g transform="translate(500, 300)">
            {/* Hexagon bonds */}
            <polygon
              points="0,-70 61,-35 61,35 0,70 -61,35 -61,-35"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              opacity="0.6"
            />
            
            {/* Inner hexagon (double bonds representation) */}
            <polygon
              points="0,-45 39,-22 39,22 0,45 -39,22 -39,-22"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="1.5"
              opacity="0.4"
            />
            
            {/* Atoms at vertices - 3D style balls */}
            <circle cx="0" cy="-70" r="12" fill="url(#atom3d)" filter="url(#atomGlow)" />
            <circle cx="61" cy="-35" r="10" fill="url(#atom3dAccent)" filter="url(#atomGlow)" />
            <circle cx="61" cy="35" r="12" fill="url(#atom3d)" filter="url(#atomGlow)" />
            <circle cx="0" cy="70" r="10" fill="url(#atom3dAccent)" filter="url(#atomGlow)" />
            <circle cx="-61" cy="35" r="12" fill="url(#atom3d)" filter="url(#atomGlow)" />
            <circle cx="-61" cy="-35" r="10" fill="url(#atom3dAccent)" filter="url(#atomGlow)" />
            
            {/* Central atom */}
            <circle cx="0" cy="0" r="14" fill="url(#atom3d)" filter="url(#atomGlow)" />
            
            {/* Radial bonds from center */}
            <line x1="0" y1="0" x2="0" y2="-60" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.4" />
            <line x1="0" y1="0" x2="52" y2="-30" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.4" />
            <line x1="0" y1="0" x2="52" y2="30" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.4" />
            <line x1="0" y1="0" x2="0" y2="60" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.4" />
            <line x1="0" y1="0" x2="-52" y2="30" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.4" />
            <line x1="0" y1="0" x2="-52" y2="-30" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.4" />
          </g>

          {/* Side chain molecule - top right */}
          <g transform="translate(750, 180)">
            <line x1="0" y1="0" x2="50" y2="-30" stroke="hsl(var(--accent))" strokeWidth="1.5" opacity="0.5" />
            <line x1="50" y1="-30" x2="100" y2="0" stroke="hsl(var(--accent))" strokeWidth="1.5" opacity="0.5" />
            <circle cx="0" cy="0" r="10" fill="url(#atom3dAccent)" filter="url(#atomGlow)" />
            <circle cx="50" cy="-30" r="8" fill="url(#atom3d)" filter="url(#atomGlow)" />
            <circle cx="100" cy="0" r="10" fill="url(#atom3dAccent)" filter="url(#atomGlow)" />
          </g>

          {/* Side chain molecule - bottom left */}
          <g transform="translate(200, 420)">
            <line x1="0" y1="0" x2="40" y2="25" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.5" />
            <line x1="40" y1="25" x2="80" y2="0" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.5" />
            <line x1="80" y1="0" x2="120" y2="25" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.5" />
            <circle cx="0" cy="0" r="9" fill="url(#atom3d)" filter="url(#atomGlow)" />
            <circle cx="40" cy="25" r="7" fill="url(#atom3dAccent)" filter="url(#atomGlow)" />
            <circle cx="80" cy="0" r="9" fill="url(#atom3d)" filter="url(#atomGlow)" />
            <circle cx="120" cy="25" r="7" fill="url(#atom3dAccent)" filter="url(#atomGlow)" />
          </g>

          {/* Connecting dashed bonds between structures */}
          <line x1="561" y1="265" x2="700" y2="195" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.25" strokeDasharray="6 4" />
          <line x1="439" y1="335" x2="280" y2="405" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.25" strokeDasharray="6 4" />
        </g>

        {/* Orbiting electrons - independent animation with ambient sync */}
        <g className="animate-electron-orbit" style={{ transformOrigin: '500px 300px' }}>
          <circle cx="580" cy="300" r="4" fill="hsl(var(--primary))" opacity="0.8">
            <animate attributeName="opacity" values="0.8;0.5;0.8" dur="7.5s" repeatCount="indefinite" />
            <animate attributeName="r" values="4;5;4" dur="7.5s" repeatCount="indefinite" />
          </circle>
        </g>
        
        <g className="animate-electron-orbit-reverse" style={{ transformOrigin: '500px 300px' }}>
          <circle cx="420" cy="300" r="3" fill="hsl(var(--accent))" opacity="0.7">
            <animate attributeName="opacity" values="0.7;0.4;0.7" dur="7.5s" repeatCount="indefinite" begin="2s" />
            <animate attributeName="r" values="3;4;3" dur="7.5s" repeatCount="indefinite" begin="2s" />
          </circle>
        </g>

        {/* Floating atoms - ambient breathing drift */}
        <g className="animate-float-atom">
          <circle cx="150" cy="150" r="5" fill="hsl(var(--primary))">
            <animate attributeName="opacity" values="0.3;0.5;0.3" dur="7.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="850" cy="450" r="4" fill="hsl(var(--accent))">
            <animate attributeName="opacity" values="0.25;0.4;0.25" dur="7.5s" repeatCount="indefinite" begin="1.5s" />
          </circle>
          <circle cx="900" cy="120" r="6" fill="hsl(var(--primary))">
            <animate attributeName="opacity" values="0.3;0.45;0.3" dur="7.5s" repeatCount="indefinite" begin="3s" />
          </circle>
          <circle cx="80" cy="400" r="5" fill="hsl(var(--accent))">
            <animate attributeName="opacity" values="0.35;0.5;0.35" dur="7.5s" repeatCount="indefinite" begin="4.5s" />
          </circle>
        </g>
      </svg>

      {/* Additional floating particles via CSS */}
      <div className="absolute top-1/5 left-1/6 w-2 h-2 rounded-full bg-primary/15 animate-float-particle" />
      <div className="absolute top-2/3 right-1/5 w-3 h-3 rounded-full bg-accent/10 animate-float-particle-delayed" />
      <div className="absolute bottom-1/4 left-1/3 w-2 h-2 rounded-full bg-primary/10 animate-float-particle-slow" />
    </div>
  );
};
