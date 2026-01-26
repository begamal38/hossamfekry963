import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base: Flat, functional, minimal - 6px radius, no decorative effects
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 select-none",
  {
    variants: {
      variant: {
        // Primary: Solid brand color, flat
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        // Destructive: Solid red, flat
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        // Outline: Border only, neutral
        outline: "border border-border bg-transparent text-foreground hover:bg-muted",
        // Secondary: Muted background
        secondary: "bg-muted text-foreground hover:bg-muted/80",
        // Ghost: No background
        ghost: "hover:bg-muted text-foreground",
        // Link: Text only
        link: "text-primary underline-offset-4 hover:underline",
        // Hero: Same as default (no gradients)
        hero: "bg-primary text-primary-foreground hover:bg-primary/90",
        heroOutline: "border border-primary bg-transparent text-primary hover:bg-primary/5",
        // Glow: Same as default (no glow effects)
        glow: "bg-primary text-primary-foreground hover:bg-primary/90",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-6 text-base",
        xl: "h-12 px-8 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp 
        className={cn(buttonVariants({ variant, size, className }))} 
        ref={ref} 
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <span className="inline-flex gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-dot" />
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-dot animation-delay-200" />
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-dot animation-delay-400" />
            </span>
            <span className="sr-only">Loading...</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
