import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useScrollProgress } from '@/hooks/useScrollProgress';
import logo from '@/assets/logo.png';

interface ScrollLogoProps {
  className?: string;
}

export const ScrollLogo: React.FC<ScrollLogoProps> = ({ className }) => {
  const { progress, isMobile } = useScrollProgress({
    scrollDistance: 300,
    disableOnMobile: true,
    mobileBreakpoint: 1024,
  });

  const logoRef = useRef<HTMLAnchorElement>(null);
  const [initialOffset, setInitialOffset] = useState(0);

  // Calculate the offset needed to center the logo initially
  useEffect(() => {
    const calculateOffset = () => {
      if (!logoRef.current || isMobile) return;
      
      const logoRect = logoRef.current.getBoundingClientRect();
      const viewportCenter = window.innerWidth / 2;
      const logoCenter = logoRect.left + logoRect.width / 2;
      
      // Calculate how much to translate to center the logo
      // We need to account for the current transform, so use the natural position
      const naturalLogoCenter = logoRect.left + logoRect.width / 2;
      const offsetToCenter = viewportCenter - naturalLogoCenter;
      
      setInitialOffset(offsetToCenter);
    };

    // Calculate on mount and resize
    calculateOffset();
    
    // Recalculate after a brief delay to ensure layout is stable
    const timeout = setTimeout(calculateOffset, 100);
    
    window.addEventListener('resize', calculateOffset);
    return () => {
      window.removeEventListener('resize', calculateOffset);
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

  // Desktop: scroll-driven logo behavior
  // Initial state: larger, centered, positioned lower (brand-focused)
  // Final state: smaller, in navbar position (navigation-focused)
  
  const initialScale = 2.2;
  const finalScale = 1;
  const currentScale = initialScale - (progress * (initialScale - finalScale));
  
  // Vertical translation: starts 80px down, ends at 0
  const initialTranslateY = 80;
  const currentTranslateY = initialTranslateY * (1 - progress);
  
  // Horizontal translation: starts centered, ends at natural position (0)
  const currentTranslateX = initialOffset * (1 - progress);

  return (
    <Link 
      ref={logoRef}
      to="/" 
      className="flex items-center px-2 py-1 origin-center"
      style={{
        transform: `translateX(${currentTranslateX}px) translateY(${currentTranslateY}px) scale(${currentScale})`,
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