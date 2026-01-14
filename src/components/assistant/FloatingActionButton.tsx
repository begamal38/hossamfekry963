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
        "fixed z-50",
        // Mobile: higher to avoid bottom nav, Desktop: lower
        isMobile ? "bottom-24 end-4" : "bottom-8 end-8",
        // Styling
        "flex items-center gap-2 px-4 py-3 rounded-full",
        "bg-primary text-primary-foreground",
        "shadow-lg shadow-primary/25",
        "hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30",
        "active:scale-95 transition-all duration-200",
        "font-medium text-sm",
        className
      )}
    >
      <Icon className="w-5 h-5" />
      {label && <span>{label}</span>}
    </button>
  );
};
