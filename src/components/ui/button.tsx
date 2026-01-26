import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base: 150ms transitions, press scale, reduced-motion safety, unified rounded-xl
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97] motion-reduce:transform-none motion-reduce:transition-none select-none",
  {
    variants: {
      variant: {
        // Primary CTA - Vodafone-inspired: bold, prominent, clean
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
        // Destructive actions
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/95",
        // Secondary CTA - border-based, clean
        outline: "border border-border/80 bg-card text-foreground hover:bg-muted/50 hover:border-primary/40 active:bg-muted/70",
        // Tertiary - muted background
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/90",
        // Minimal - no background until hover
        ghost: "hover:bg-muted/60 hover:text-foreground active:bg-muted/80",
        // Text link style
        link: "text-primary underline-offset-4 hover:underline active:opacity-80",
        // Hero buttons - accent gradient with glow
        hero: "bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-glow hover:-translate-y-1 active:translate-y-0 active:shadow-md transition-all duration-200",
        heroOutline: "border-2 border-primary/50 bg-card text-primary hover:bg-primary/5 hover:border-primary active:bg-primary/10 backdrop-blur-sm",
        // Glow effect button
        glow: "bg-primary text-primary-foreground shadow-glow hover:shadow-glow-sm active:shadow-none",
      },
      size: {
        default: "h-11 px-6 py-2 lg:h-10 lg:px-5",
        sm: "h-9 rounded-lg px-4 text-xs lg:h-8 lg:px-3",
        lg: "h-12 rounded-lg px-8 text-base lg:h-11 lg:px-6",
        xl: "h-14 rounded-xl px-10 text-lg lg:h-12 lg:px-8",
        icon: "h-10 w-10 lg:h-9 lg:w-9",
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
