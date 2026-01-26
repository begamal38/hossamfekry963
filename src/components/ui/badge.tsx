import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  // Unified rounded-full with consistent padding and font weight
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none",
  {
    variants: {
      variant: {
        // Primary badge - solid
        default: "border-transparent bg-primary text-primary-foreground",
        // Secondary - subtle background
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        // Destructive - for errors/warnings
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        // Outline - minimal, just border
        outline: "text-foreground border-border bg-transparent",
        // Success - green tones
        success: "border-transparent bg-success/15 text-success dark:bg-success/20 dark:text-success",
        // Warning - amber/orange tones  
        warning: "border-transparent bg-warning/15 text-warning dark:bg-warning/20 dark:text-warning",
        // Accent - brand accent color
        accent: "border-transparent bg-accent/15 text-accent-foreground dark:bg-accent/20",
        // Muted - very subtle, for metadata
        muted: "border-transparent bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />;
  }
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
