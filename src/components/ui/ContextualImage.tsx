/**
 * Contextual Image Component
 * 
 * Displays subtle educational imagery for visual context.
 * PURELY PRESENTATIONAL - no state, no SSOT interaction.
 * 
 * Supports:
 * - RTL/LTR layouts
 * - Dark mode
 * - Reduced motion preferences
 * - Mobile-first responsive design
 */

import React from 'react';
import { cn } from '@/lib/utils';

// Import contextual images
import courseHeaderImage from '@/assets/contextual/chemistry-course-header.webp';
import lessonHeaderImage from '@/assets/contextual/chemistry-lesson-header.webp';
import chapterAccentImage from '@/assets/contextual/chemistry-chapter-accent.webp';

type ImageVariant = 'course' | 'lesson' | 'chapter';

interface ContextualImageProps {
  variant: ImageVariant;
  className?: string;
  alt?: string;
}

const imageMap: Record<ImageVariant, string> = {
  course: courseHeaderImage,
  lesson: lessonHeaderImage,
  chapter: chapterAccentImage,
};

const heightMap: Record<ImageVariant, string> = {
  course: 'h-20 sm:h-24 md:h-28',
  lesson: 'h-14 sm:h-16 md:h-20',
  chapter: 'h-10 sm:h-12',
};

export function ContextualImage({ 
  variant, 
  className,
  alt = 'Educational context illustration'
}: ContextualImageProps) {
  const imageSrc = imageMap[variant];
  const heightClass = heightMap[variant];

  return (
    <div 
      className={cn(
        "relative w-full overflow-hidden rounded-lg",
        heightClass,
        // Subtle fade-in animation respecting reduced motion
        "motion-safe:animate-fade-in",
        className
      )}
      aria-hidden="true"
    >
      <img
        src={imageSrc}
        alt={alt}
        className={cn(
          "w-full h-full object-cover object-center",
          // Muted opacity for subtle visual context
          "opacity-60 dark:opacity-40",
          // Prevent image from affecting layout
          "pointer-events-none select-none"
        )}
        loading="lazy"
        decoding="async"
      />
      {/* Gradient overlay for seamless blend with content */}
      <div className={cn(
        "absolute inset-0",
        "bg-gradient-to-b from-transparent via-transparent to-background/80",
        "dark:to-background/90"
      )} />
    </div>
  );
}

export default ContextualImage;
