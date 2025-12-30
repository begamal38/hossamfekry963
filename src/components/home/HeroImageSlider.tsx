import React, { useState, useEffect, useCallback } from 'react';
import teacherImage from '@/assets/teacher.jpg';

interface HeroImageSliderProps {
  className?: string;
}

/**
 * Auto-rotating image slider for hero section.
 * Smooth fade transitions, no arrows, no dots.
 */
export const HeroImageSlider: React.FC<HeroImageSliderProps> = ({ className }) => {
  // For now we use the same image; add more when available
  const images = [
    { src: teacherImage, alt: 'Hossam Fekry - Chemistry Teacher 1' },
    { src: teacherImage, alt: 'Hossam Fekry - Chemistry Teacher 2' },
    { src: teacherImage, alt: 'Hossam Fekry - Chemistry Teacher 3' },
    { src: teacherImage, alt: 'Hossam Fekry - Chemistry Teacher 4' },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  // Auto-rotate every 3.5 seconds
  useEffect(() => {
    const interval = setInterval(nextSlide, 3500);
    return () => clearInterval(interval);
  }, [nextSlide]);

  return (
    <div className={`relative overflow-hidden rounded-2xl lg:rounded-3xl shadow-2xl ${className}`}>
      {/* Subtle glow behind */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 blur-xl scale-105 -z-10" />
      
      {/* Image container with fade effect */}
      <div className="relative aspect-[3/4] sm:aspect-[4/5] lg:aspect-[3/4]">
        {images.map((image, index) => (
          <img
            key={index}
            src={image.src}
            alt={image.alt}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
            loading={index === 0 ? 'eager' : 'lazy'}
          />
        ))}
      </div>

      {/* Subtle overlay gradient for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent pointer-events-none" />
    </div>
  );
};
