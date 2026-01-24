import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base: faster 150ms transitions, press scale, reduced-motion safety
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/95",
        outline: "border-2 border-primary bg-transparent text-primary hover:bg-primary/5 active:bg-primary/10",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/90",
        ghost: "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
        link: "text-primary underline-offset-4 hover:underline active:opacity-80",
        hero: "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg hover:shadow-glow hover:-translate-y-1 active:translate-y-0 active:shadow-md transition-all duration-200",
        heroOutline: "border-2 border-primary bg-primary/5 text-primary hover:bg-primary/10 active:bg-primary/15 backdrop-blur-sm",
        glow: "bg-primary text-primary-foreground shadow-glow hover:shadow-glow-sm active:shadow-none",
      },
      size: {
        default: "h-11 px-6 py-2 lg:h-10 lg:px-5",
        sm: "h-9 rounded-md px-4 lg:h-8 lg:px-3",
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
