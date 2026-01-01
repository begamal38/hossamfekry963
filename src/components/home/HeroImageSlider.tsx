import React, { memo } from 'react';
import teacherImage from '@/assets/teacher.jpg';

interface HeroImageSliderProps {
  className?: string;
}

/**
 * Optimized single LANDSCAPE image for hero section.
 * Wide cinematic aspect ratio with subtle animation.
 */
export const HeroImageSlider: React.FC<HeroImageSliderProps> = memo(({ className }) => {
  return (
    <div className={`relative overflow-hidden rounded-2xl lg:rounded-3xl shadow-2xl group ${className}`}>
      {/* Subtle glow behind */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 blur-xl scale-105 -z-10 opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* LANDSCAPE Image container - 16:9 mobile, 21:9 desktop */}
      <div className="relative aspect-video lg:aspect-[21/9]">
        <img
          src={teacherImage}
          alt="حسام فكري - مدرس الكيمياء"
          className="w-full h-full object-cover object-top transform group-hover:scale-105 transition-transform duration-700 ease-out"
          loading="eager"
          fetchPriority="high"
        />
      </div>

      {/* Subtle overlay gradient for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent pointer-events-none" />
      
      {/* Subtle vignette effect */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-background/20 pointer-events-none" />
      
      {/* Decorative corner accent */}
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-primary/30 to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-accent/20 to-transparent pointer-events-none" />
    </div>
  );
});

HeroImageSlider.displayName = 'HeroImageSlider';
