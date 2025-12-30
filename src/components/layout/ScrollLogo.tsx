import React from 'react';
import { Link } from 'react-router-dom';
import { useScrollProgress } from '@/hooks/useScrollProgress';
import logo from '@/assets/logo.png';

interface ScrollLogoProps {
  className?: string;
}

/**
 * Header logo that appears after the hero logo transition completes.
 * On desktop: hidden initially, fades in when scroll progress reaches 1.
 * On mobile: always visible as static logo.
 */
export const ScrollLogo: React.FC<ScrollLogoProps> = ({ className }) => {
  const { progress, isMobile } = useScrollProgress({
    scrollDistance: 350,
    disableOnMobile: true,
    mobileBreakpoint: 1024,
  });

  // Mobile: always show static logo
  if (isMobile) {
    return (
      <Link to="/" className="flex items-center px-2 py-1">
        <img 
          src={logo} 
          alt="Hossam Fekry" 
          className="h-14 w-auto object-contain"
        />
      </Link>
    );
  }

  // Desktop: fade in as hero logo fades out
  // Start appearing at 85% progress, fully visible at 100%
  const opacity = progress < 0.85 ? 0 : (progress - 0.85) / 0.15;

  return (
    <div 
      className="flex items-center"
      style={{
        opacity,
        willChange: 'opacity',
        pointerEvents: progress < 0.85 ? 'none' : 'auto',
      }}
    >
      <Link 
        to="/" 
        className="flex items-center px-2 py-1"
      >
        <img 
          src={logo} 
          alt="Hossam Fekry" 
          className="h-14 2xl:h-16 3xl:h-20 w-auto object-contain"
        />
      </Link>
    </div>
  );
};