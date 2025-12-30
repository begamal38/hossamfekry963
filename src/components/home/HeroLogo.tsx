import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useScrollProgress } from '@/hooks/useScrollProgress';
import logo from '@/assets/logo.png';

export const HeroLogo: React.FC = () => {
  const { progress, isMobile } = useScrollProgress({
    scrollDistance: 350,
    disableOnMobile: true,
    mobileBreakpoint: 1024,
  });

  const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0 });
  const logoRef = useRef<HTMLDivElement>(null);

  // Calculate the header logo position (where we need to animate TO)
  useEffect(() => {
    if (isMobile) return;

    const calculateTarget = () => {
      // Find the navbar container to get target position
      const navbar = document.querySelector('nav');
      if (!navbar) return;

      const navRect = navbar.getBoundingClientRect();
      // Target is approximately 100px from left edge of navbar, vertically centered
      const targetX = navRect.left + 100;
      const targetY = navRect.top + navRect.height / 2;

      setTargetPosition({ x: targetX, y: targetY });
    };

    calculateTarget();
    
    const timeout = setTimeout(calculateTarget, 150);
    window.addEventListener('resize', calculateTarget);
    
    return () => {
      window.removeEventListener('resize', calculateTarget);
      clearTimeout(timeout);
    };
  }, [isMobile]);

  // Don't render on mobile - header has its own static logo
  if (isMobile) return null;

  // Don't render when fully transitioned
  if (progress >= 1) return null;

  // Use easeOutCubic for smooth deceleration
  const easedProgress = 1 - Math.pow(1 - progress, 3);

  // Initial position: centered horizontally, positioned in hero area
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
  
  // Start position: centered in viewport, in hero area
  const startX = viewportWidth / 2;
  const startY = 200; // Hero area vertical position
  
  // Calculate current position
  const currentX = startX + (targetPosition.x - startX) * easedProgress;
  const currentY = startY + (targetPosition.y - startY) * easedProgress;

  // Scale: starts at 2.5x, ends at 1x
  const initialScale = 2.5;
  const finalScale = 1;
  const currentScale = initialScale - (easedProgress * (initialScale - finalScale));

  // Opacity: fade out as we approach the end
  const opacity = progress > 0.85 ? 1 - ((progress - 0.85) / 0.15) : 1;

  return (
    <div
      ref={logoRef}
      className="fixed z-[60] pointer-events-none"
      style={{
        left: currentX,
        top: currentY,
        transform: `translate(-50%, -50%) scale(${currentScale})`,
        transformOrigin: 'center center',
        willChange: 'transform, left, top, opacity',
        opacity,
      }}
    >
      <Link 
        to="/" 
        className="flex items-center pointer-events-auto"
      >
        <img 
          src={logo} 
          alt="Hossam Fekry" 
          className="h-14 2xl:h-16 3xl:h-20 w-auto object-contain drop-shadow-lg"
        />
      </Link>
    </div>
  );
};
