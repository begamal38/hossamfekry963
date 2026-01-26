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
        // Fixed position at bottom-right
        "fixed z-40",
        isMobile ? "bottom-24 end-4 safe-area-inset-bottom" : "bottom-6 end-6",
        // Flat, functional styling - no decorative effects
        "flex items-center gap-2 rounded-md",
        isMobile ? "px-4 py-3" : "px-3.5 py-2.5",
        "bg-primary text-primary-foreground",
        "hover:bg-primary/90 transition-colors duration-150",
        "font-medium",
        isMobile ? "text-sm" : "text-xs",
        className
      )}
      aria-label={label || 'Action button'}
    >
      <Icon className={cn(isMobile ? "w-5 h-5" : "w-4 h-4")} />
      {label && <span>{label}</span>}
    </button>
  );
};
