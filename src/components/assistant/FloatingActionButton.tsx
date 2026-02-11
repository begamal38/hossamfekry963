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

/**
 * Global Floating Action Button with stable positioning.
 * 
 * Mobile: fixed above bottom nav (68px nav + 16px gap + safe-area).
 * Desktop: smaller inline-style fixed button at bottom-end.
 * 
 * z-index: 40 — above content, below modals/dialogs/dropdowns (z-50+).
 */
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
        "fixed z-40",
        "flex items-center gap-2 rounded-lg shadow-lg",
        "bg-primary text-primary-foreground",
        "hover:bg-primary/90 active:scale-[0.98] transition-all duration-150",
        "font-medium",
        isMobile ? "px-4 py-3 text-sm end-4" : "px-3.5 py-2.5 text-xs end-6 bottom-8",
        className
      )}
      style={isMobile ? {
        // 68px nav + 16px gap, plus safe-area-inset-bottom
        bottom: 'calc(68px + 16px + env(safe-area-inset-bottom, 0px))',
      } : undefined}
      aria-label={label || 'Action button'}
    >
      <Icon className={cn(isMobile ? "w-5 h-5" : "w-4 h-4")} />
      {label && <span>{label}</span>}
    </button>
  );
};
