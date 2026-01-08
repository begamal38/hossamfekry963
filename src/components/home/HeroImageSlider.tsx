import React, { memo, useState, useEffect, useCallback } from 'react';
import heroSlide1 from '@/assets/hero-slide-1.webp';
import heroSlide2 from '@/assets/hero-slide-2.webp';
import heroSlide3 from '@/assets/hero-slide-3.webp';

interface HeroImageSliderProps {
  className?: string;
}

const slides = [
  { src: heroSlide1, alt: 'حسام فكري - في الاستوديو' },
  { src: heroSlide2, alt: 'حسام فكري - صورة رسمية' },
  { src: heroSlide3, alt: 'حسام فكري - في البرنامج' },
];

/**
 * Optimized auto-sliding hero images.
 * Larger on desktop, same layout on mobile.
 */
export const HeroImageSlider: React.FC<HeroImageSliderProps> = memo(({ className }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-slide every 3 seconds
  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(nextSlide, 4000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  return (
    <div className={`relative overflow-hidden rounded-2xl lg:rounded-3xl shadow-2xl group ${className}`}>
      {/* Subtle glow behind */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 blur-xl scale-105 -z-10 opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
      
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
              width={1920}
              height={1080}
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
      
      {/* Subtle vignette effect */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-background/20 pointer-events-none" />
      
      {/* Decorative corner accent */}
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-primary/30 to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-accent/20 to-transparent pointer-events-none" />

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
