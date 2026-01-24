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
        // Fixed position at bottom-right (respects RTL with 'end')
        // z-40 ensures it sits above content but below modals/dialogs (z-50)
        "fixed z-40",
        // Mobile: higher to avoid bottom nav + safe area, Desktop: standard positioning
        isMobile ? "bottom-24 end-4 safe-area-inset-bottom" : "bottom-6 end-6",
        // Styling - responsive sizing
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
      aria-label={label || 'Action button'}
    >
      <Icon className={cn(isMobile ? "w-5 h-5" : "w-4 h-4")} />
      {label && <span>{label}</span>}
    </button>
  );
};
