import React, { memo, useState, useEffect, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

// Desktop images (larger)
import heroSlide1 from '@/assets/hero-slide-1.webp';
import heroSlide2 from '@/assets/hero-slide-2.webp';
import heroSlide3 from '@/assets/hero-slide-3.webp';

// Mobile images (smaller, optimized)
import heroSlide1Mobile from '@/assets/hero-slide-1-mobile.webp';
import heroSlide2Mobile from '@/assets/hero-slide-2-mobile.webp';
import heroSlide3Mobile from '@/assets/hero-slide-3-mobile.webp';

interface HeroImageSliderProps {
  className?: string;
}

const desktopSlides = [
  { src: heroSlide1, alt: 'حسام فكري - في الاستوديو' },
  { src: heroSlide2, alt: 'حسام فكري - صورة رسمية' },
  { src: heroSlide3, alt: 'حسام فكري - في البرنامج' },
];

const mobileSlides = [
  { src: heroSlide1Mobile, alt: 'حسام فكري - في الاستوديو' },
  { src: heroSlide2Mobile, alt: 'حسام فكري - صورة رسمية' },
  { src: heroSlide3Mobile, alt: 'حسام فكري - في البرنامج' },
];

/**
 * Optimized auto-sliding hero images.
 * Uses smaller images on mobile for faster loading.
 */
export const HeroImageSlider: React.FC<HeroImageSliderProps> = memo(({ className }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const isMobile = useIsMobile();
  
  // Select appropriate slides based on device
  const slides = isMobile ? mobileSlides : desktopSlides;

  // Auto-slide every 4 seconds
  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    const interval = setInterval(nextSlide, 4000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  return (
    <div className={`relative overflow-hidden rounded-2xl lg:rounded-3xl shadow-xl group ${className}`}>
      {/* Clean container - no decorative glow */}
      
      {/* LANDSCAPE Image container - 16:9 mobile, larger on desktop */}
      <div className="relative aspect-video lg:aspect-[16/9] xl:aspect-[2/1]">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-1000 ease-out ${
              index === currentIndex 
                ? 'opacity-100 scale-100' 
                : 'opacity-0 scale-105'
            }`}
          >
            <img
              src={slide.src}
              alt={slide.alt}
              width={isMobile ? 800 : 1920}
              height={isMobile ? 450 : 1080}
              className={`w-full h-full object-cover object-top transition-transform ease-out ${
                index === currentIndex ? 'scale-105' : 'scale-100'
              }`}
              style={{ transitionDuration: '6000ms' }}
              loading={index === 0 ? 'eager' : 'lazy'}
              fetchPriority={index === 0 ? 'high' : 'auto'}
              decoding="async"
            />
          </div>
        ))}
      </div>

      {/* Subtle overlay gradient for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent pointer-events-none" />
      
      {/* Simple bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background/30 to-transparent pointer-events-none" />

      {/* Slide indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            aria-label={`الانتقال للصورة ${index + 1}`}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? 'bg-white w-6' 
                : 'bg-white/50 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </div>
  );
});

HeroImageSlider.displayName = 'HeroImageSlider';
