import { cn } from "@/lib/utils";

interface PulsingDotsProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Language-agnostic loading indicator
 * Uses brand indigo color with sequential pulsing animation
 * No text - pure visual indicator
 */
export function PulsingDots({ className, size = "md" }: PulsingDotsProps) {
  const sizeClasses = {
    sm: "w-1.5 h-1.5",
    md: "w-2.5 h-2.5",
    lg: "w-3.5 h-3.5",
  };

  const gapClasses = {
    sm: "gap-1",
    md: "gap-1.5",
    lg: "gap-2",
  };

  return (
    <div 
      className={cn("flex items-center justify-center", gapClasses[size], className)}
      role="status"
      aria-label="Loading"
    >
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className={cn(
            sizeClasses[size],
            "rounded-full bg-primary animate-pulse-dot"
          )}
          style={{
            animationDelay: `${index * 150}ms`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Full-page loading container with centered pulsing dots
 * Replaces all full-screen loading spinners
 */
export function PageLoading({ className }: { className?: string }) {
  return (
    <div className={cn("min-h-screen bg-background flex items-center justify-center", className)}>
      <PulsingDots size="lg" />
    </div>
  );
}

/**
 * Inline loading indicator for buttons and small containers
 */
export function InlineLoading({ className }: { className?: string }) {
  return <PulsingDots size="sm" className={className} />;
}

export default PulsingDots;
