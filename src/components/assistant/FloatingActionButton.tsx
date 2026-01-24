import React from 'react';
import { LucideIcon, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface FloatingActionButtonProps {
  icon?: LucideIcon;
  onClick: () => void;
  label?: string;
  className?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon: Icon = Plus,
  onClick,
  label,
  className,
}) => {
  const isMobile = useIsMobile();

  return (
    <button
      onClick={onClick}
      className={cn(
        // Fixed position at bottom-right (or bottom-left for RTL)
        "fixed z-40",
        // Mobile: higher to avoid bottom nav, Desktop: lower and smaller
        isMobile ? "bottom-24 end-4" : "bottom-6 end-6",
        // Styling - slightly smaller on desktop
        "flex items-center gap-2 rounded-full",
        isMobile ? "px-4 py-3" : "px-3.5 py-2.5",
        "bg-primary text-primary-foreground",
        "shadow-lg shadow-primary/20",
        "hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/25",
        "active:scale-95 transition-all duration-200",
        "font-medium",
        isMobile ? "text-sm" : "text-xs",
        className
      )}
    >
      <Icon className={cn(isMobile ? "w-5 h-5" : "w-4 h-4")} />
      {label && <span>{label}</span>}
    </button>
  );
};
