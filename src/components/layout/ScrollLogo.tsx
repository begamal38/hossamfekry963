import React from 'react';
import { Link } from 'react-router-dom';
import { useScrollProgress } from '@/hooks/useScrollProgress';
import logo from '@/assets/logo.png';

interface ScrollLogoProps {
  className?: string;
}

export const ScrollLogo: React.FC<ScrollLogoProps> = ({ className }) => {
  const { progress, isMobile } = useScrollProgress({
    scrollDistance: 250,
    disableOnMobile: true,
    mobileBreakpoint: 1024, // lg breakpoint - desktop only behavior
  });

  // Mobile: static logo in navbar
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

  // Desktop: scroll-driven logo behavior
  // Initial state: larger logo, positioned lower (as if in hero)
  // Final state: smaller logo, in navbar position
  
  const initialScale = 1.8;
  const finalScale = 1;
  const currentScale = initialScale - (progress * (initialScale - finalScale));
  
  // Vertical translation: starts 60px down, ends at 0
  const initialTranslateY = 60;
  const currentTranslateY = initialTranslateY * (1 - progress);

  return (
    <Link 
      to="/" 
      className="flex items-center px-2 py-1 origin-top-right"
      style={{
        transform: `translateY(${currentTranslateY}px) scale(${currentScale})`,
        willChange: 'transform',
      }}
    >
      <img 
        src={logo} 
        alt="Hossam Fekry" 
        className="h-16 2xl:h-20 3xl:h-24 w-auto object-contain"
      />
    </Link>
  );
};
