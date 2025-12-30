import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useScrollProgress } from '@/hooks/useScrollProgress';
import logo from '@/assets/logo.png';

interface ScrollLogoProps {
  className?: string;
}

export const ScrollLogo: React.FC<ScrollLogoProps> = ({ className }) => {
  const { progress, isMobile } = useScrollProgress({
    scrollDistance: 350, // Slightly longer scroll for smoother transition
    disableOnMobile: true,
    mobileBreakpoint: 1024,
  });

  const logoRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ 
    viewportWidth: 0, 
    logoWidth: 0,
    navbarLogoX: 0 
  });

  // Calculate positions on mount and resize
  useEffect(() => {
    const calculateDimensions = () => {
      if (!logoRef.current || isMobile) return;
      
      const viewportWidth = window.innerWidth;
      const logoRect = logoRef.current.getBoundingClientRect();
      
      // The navbar logo position (where it should end up)
      // This is the natural position of the logo in the navbar
      const navbarLogoX = logoRect.left + logoRect.width / 2;
      
      setDimensions({
        viewportWidth,
        logoWidth: logoRect.width,
        navbarLogoX
      });
    };

    calculateDimensions();
    
    // Recalculate after layout stabilizes
    const timeout = setTimeout(calculateDimensions, 150);
    
    window.addEventListener('resize', calculateDimensions);
    return () => {
      window.removeEventListener('resize', calculateDimensions);
      clearTimeout(timeout);
    };
  }, [isMobile]);

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

  // Calculate the centered position relative to the navbar position
  const viewportCenter = dimensions.viewportWidth / 2;
  const offsetToCenter = viewportCenter - dimensions.navbarLogoX;

  // Animation values with easing
  // Use easeOutCubic for smooth deceleration
  const easedProgress = 1 - Math.pow(1 - progress, 3);

  // Scale: starts at 2.5x, ends at 1x
  const initialScale = 2.5;
  const finalScale = 1;
  const currentScale = initialScale - (easedProgress * (initialScale - finalScale));
  
  // Vertical translation: starts 120px down (into hero), ends at 0 (navbar)
  const initialTranslateY = 120;
  const currentTranslateY = initialTranslateY * (1 - easedProgress);
  
  // Horizontal translation: starts centered, ends at natural navbar position
  const currentTranslateX = offsetToCenter * (1 - easedProgress);

  // Opacity for smooth fade-in of the brand focal point
  const logoOpacity = progress < 0.1 ? 1 : 1;

  return (
    <div 
      ref={logoRef}
      className="flex items-center"
      style={{
        transform: `translateX(${currentTranslateX}px) translateY(${currentTranslateY}px) scale(${currentScale})`,
        transformOrigin: 'center center',
        willChange: 'transform',
        opacity: logoOpacity,
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