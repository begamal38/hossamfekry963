import React from 'react';

/**
 * Lightweight CSS/SVG 3D-style chemistry background animation.
 * Ball-and-stick molecular structure with orbiting electrons.
 * Enhanced with stars and glowing particles in dark mode.
 * Purely decorative, GPU-friendly.
 */
export const Hero3DBackground: React.FC = () => {
  // Generate random stars for dark mode
  const stars = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    cx: Math.random() * 100,
    cy: Math.random() * 100,
    r: Math.random() * 1.5 + 0.5,
    delay: Math.random() * 5,
    duration: 2 + Math.random() * 3,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Dark mode starfield layer */}
      <div className="absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-500">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
          </defs>
          
          {stars.map((star) => (
            <circle
              key={star.id}
              cx={`${star.cx}%`}
              cy={`${star.cy}%`}
              r={star.r}
              fill="white"
              opacity="0.7"
            >
              <animate
                attributeName="opacity"
                values="0.3;1;0.3"
                dur={`${star.duration}s`}
                begin={`${star.delay}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="r"
                values={`${star.r};${star.r * 1.5};${star.r}`}
                dur={`${star.duration}s`}
                begin={`${star.delay}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </svg>
        
        {/* Glowing nebula effects for dark mode */}
        <div className="absolute top-1/4 left-1/6 w-40 h-40 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/3 right-1/4 w-56 h-56 bg-accent/15 rounded-full blur-3xl animate-pulse-slow animation-delay-2000" />
        <div className="absolute top-1/2 right-1/6 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl animate-pulse-slow animation-delay-4000" />
      </div>

      {/* Main SVG Molecular Structure - enhanced with ambient breathing */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.18] dark:opacity-[0.35]"
        viewBox="0 0 1000 600"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* 3D-style gradient for atoms - brighter in dark mode */}
          <radialGradient id="atom3d" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="1" />
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
          </radialGradient>
          
          <radialGradient id="atom3dAccent" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="1" />
            <stop offset="50%" stopColor="hsl(var(--accent))" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.3" />
          </radialGradient>

          {/* Enhanced glow for dark mode */}
          <radialGradient id="atom3dGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="1" />
            <stop offset="40%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </radialGradient>
          
          {/* Glow filter - stronger */}
          <filter id="atomGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Extra strong glow for electrons */}
          <filter id="electronGlow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Main Molecule Group - Slow rotation with ambient breathing */}
        <g className="animate-molecule-rotate" style={{ transformOrigin: '500px 300px', animationDuration: '45s' }}>
          
          {/* Central benzene ring structure */}
          <g transform="translate(500, 300)">
            {/* Hexagon bonds - glowing in dark mode */}
            <polygon
              points="0,-70 61,-35 61,35 0,70 -61,35 -61,-35"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2.5"
              opacity="0.7"
              className="dark:stroke-[hsl(var(--primary))]"
            />
            
            {/* Inner hexagon (double bonds representation) */}
            <polygon
              points="0,-45 39,-22 39,22 0,45 -39,22 -39,-22"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              opacity="0.5"
            />
            
            {/* Atoms at vertices - 3D style balls with enhanced glow */}
            <circle cx="0" cy="-70" r="14" fill="url(#atom3d)" filter="url(#atomGlow)" />
            <circle cx="61" cy="-35" r="12" fill="url(#atom3dAccent)" filter="url(#atomGlow)" />
            <circle cx="61" cy="35" r="14" fill="url(#atom3d)" filter="url(#atomGlow)" />
            <circle cx="0" cy="70" r="12" fill="url(#atom3dAccent)" filter="url(#atomGlow)" />
            <circle cx="-61" cy="35" r="14" fill="url(#atom3d)" filter="url(#atomGlow)" />
            <circle cx="-61" cy="-35" r="12" fill="url(#atom3dAccent)" filter="url(#atomGlow)" />
            
            {/* Central atom - larger and brighter */}
            <circle cx="0" cy="0" r="18" fill="url(#atom3d)" filter="url(#atomGlow)" />
            
            {/* Radial bonds from center */}
            <line x1="0" y1="0" x2="0" y2="-60" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.5" />
            <line x1="0" y1="0" x2="52" y2="-30" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.5" />
            <line x1="0" y1="0" x2="52" y2="30" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.5" />
            <line x1="0" y1="0" x2="0" y2="60" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.5" />
            <line x1="0" y1="0" x2="-52" y2="30" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.5" />
            <line x1="0" y1="0" x2="-52" y2="-30" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.5" />
          </g>

          {/* Side chain molecule - top right */}
          <g transform="translate(750, 180)">
            <line x1="0" y1="0" x2="50" y2="-30" stroke="hsl(var(--accent))" strokeWidth="2" opacity="0.6" />
            <line x1="50" y1="-30" x2="100" y2="0" stroke="hsl(var(--accent))" strokeWidth="2" opacity="0.6" />
            <circle cx="0" cy="0" r="12" fill="url(#atom3dAccent)" filter="url(#atomGlow)" />
            <circle cx="50" cy="-30" r="10" fill="url(#atom3d)" filter="url(#atomGlow)" />
            <circle cx="100" cy="0" r="12" fill="url(#atom3dAccent)" filter="url(#atomGlow)" />
          </g>

          {/* Side chain molecule - bottom left */}
          <g transform="translate(200, 420)">
            <line x1="0" y1="0" x2="40" y2="25" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.6" />
            <line x1="40" y1="25" x2="80" y2="0" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.6" />
            <line x1="80" y1="0" x2="120" y2="25" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.6" />
            <circle cx="0" cy="0" r="11" fill="url(#atom3d)" filter="url(#atomGlow)" />
            <circle cx="40" cy="25" r="9" fill="url(#atom3dAccent)" filter="url(#atomGlow)" />
            <circle cx="80" cy="0" r="11" fill="url(#atom3d)" filter="url(#atomGlow)" />
            <circle cx="120" cy="25" r="9" fill="url(#atom3dAccent)" filter="url(#atomGlow)" />
          </g>

          {/* Additional floating molecule - top left */}
          <g transform="translate(120, 200)" className="animate-float-slow">
            <line x1="0" y1="0" x2="35" y2="20" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.5" />
            <circle cx="0" cy="0" r="8" fill="url(#atom3d)" filter="url(#atomGlow)" />
            <circle cx="35" cy="20" r="6" fill="url(#atom3dAccent)" filter="url(#atomGlow)" />
          </g>

          {/* Additional floating molecule - bottom right */}
          <g transform="translate(820, 380)" className="animate-float-slow-reverse">
            <line x1="0" y1="0" x2="30" y2="-18" stroke="hsl(var(--accent))" strokeWidth="1.5" opacity="0.5" />
            <circle cx="0" cy="0" r="7" fill="url(#atom3dAccent)" filter="url(#atomGlow)" />
            <circle cx="30" cy="-18" r="5" fill="url(#atom3d)" filter="url(#atomGlow)" />
          </g>

          {/* Connecting dashed bonds between structures */}
          <line x1="561" y1="265" x2="700" y2="195" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.3" strokeDasharray="6 4" />
          <line x1="439" y1="335" x2="280" y2="405" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.3" strokeDasharray="6 4" />
        </g>

        {/* Orbiting electrons - with enhanced glow */}
        <g className="animate-electron-orbit" style={{ transformOrigin: '500px 300px' }}>
          <circle cx="580" cy="300" r="5" fill="hsl(var(--primary))" filter="url(#electronGlow)" opacity="0.9">
            <animate attributeName="opacity" values="0.9;0.5;0.9" dur="7.5s" repeatCount="indefinite" />
            <animate attributeName="r" values="5;7;5" dur="7.5s" repeatCount="indefinite" />
          </circle>
        </g>
        
        <g className="animate-electron-orbit-reverse" style={{ transformOrigin: '500px 300px' }}>
          <circle cx="420" cy="300" r="4" fill="hsl(var(--accent))" filter="url(#electronGlow)" opacity="0.8">
            <animate attributeName="opacity" values="0.8;0.4;0.8" dur="7.5s" repeatCount="indefinite" begin="2s" />
            <animate attributeName="r" values="4;6;4" dur="7.5s" repeatCount="indefinite" begin="2s" />
          </circle>
        </g>

        {/* Third orbiting electron */}
        <g className="animate-electron-orbit-slow" style={{ transformOrigin: '500px 300px' }}>
          <circle cx="500" cy="220" r="4" fill="hsl(var(--primary))" filter="url(#electronGlow)" opacity="0.7">
            <animate attributeName="opacity" values="0.7;0.3;0.7" dur="9s" repeatCount="indefinite" begin="1s" />
            <animate attributeName="r" values="4;5;4" dur="9s" repeatCount="indefinite" begin="1s" />
          </circle>
        </g>

        {/* Floating atoms - enhanced with breathing */}
        <g className="animate-float-atom">
          <circle cx="150" cy="150" r="6" fill="hsl(var(--primary))" filter="url(#atomGlow)">
            <animate attributeName="opacity" values="0.4;0.7;0.4" dur="7.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="850" cy="450" r="5" fill="hsl(var(--accent))" filter="url(#atomGlow)">
            <animate attributeName="opacity" values="0.35;0.6;0.35" dur="7.5s" repeatCount="indefinite" begin="1.5s" />
          </circle>
          <circle cx="900" cy="120" r="7" fill="hsl(var(--primary))" filter="url(#atomGlow)">
            <animate attributeName="opacity" values="0.4;0.65;0.4" dur="7.5s" repeatCount="indefinite" begin="3s" />
          </circle>
          <circle cx="80" cy="400" r="6" fill="hsl(var(--accent))" filter="url(#atomGlow)">
            <animate attributeName="opacity" values="0.45;0.7;0.45" dur="7.5s" repeatCount="indefinite" begin="4.5s" />
          </circle>
          {/* Extra floating atoms */}
          <circle cx="950" cy="280" r="4" fill="hsl(var(--primary))" filter="url(#atomGlow)">
            <animate attributeName="opacity" values="0.3;0.55;0.3" dur="6s" repeatCount="indefinite" begin="2s" />
          </circle>
          <circle cx="50" cy="250" r="5" fill="hsl(var(--accent))" filter="url(#atomGlow)">
            <animate attributeName="opacity" values="0.35;0.6;0.35" dur="8s" repeatCount="indefinite" begin="3.5s" />
          </circle>
        </g>
      </svg>

      {/* Additional floating particles via CSS - enhanced */}
      <div className="absolute top-1/5 left-1/6 w-3 h-3 rounded-full bg-primary/20 dark:bg-primary/40 animate-float-particle blur-[1px]" />
      <div className="absolute top-2/3 right-1/5 w-4 h-4 rounded-full bg-accent/15 dark:bg-accent/35 animate-float-particle-delayed blur-[1px]" />
      <div className="absolute bottom-1/4 left-1/3 w-3 h-3 rounded-full bg-primary/15 dark:bg-primary/35 animate-float-particle-slow blur-[1px]" />
      <div className="absolute top-1/3 right-1/3 w-2 h-2 rounded-full bg-accent/20 dark:bg-accent/40 animate-float-particle blur-[0.5px]" />
      <div className="absolute bottom-1/3 left-1/5 w-2 h-2 rounded-full bg-primary/15 dark:bg-primary/30 animate-float-particle-delayed blur-[0.5px]" />
    </div>
  );
};
