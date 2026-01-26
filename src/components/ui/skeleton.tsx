import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Skeleton loading placeholder
 * Uses subtle pulse animation for loading states
 * Supports various shapes via className
 */
const Skeleton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Unified rounded-lg with subtle shimmer animation
          "animate-pulse rounded-lg bg-muted/70",
          className
        )}
        {...props}
      />
    );
  }
);
Skeleton.displayName = "Skeleton";

export { Skeleton };
