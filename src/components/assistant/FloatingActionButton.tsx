import React from 'react';
import { LucideIcon, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-20 sm:bottom-24 z-40",
        "end-4 sm:end-6",
        "flex items-center gap-2 px-4 py-3 rounded-full",
        "bg-primary text-primary-foreground shadow-lg",
        "hover:bg-primary/90 active:scale-95 transition-all duration-200",
        "font-medium text-sm",
        className
      )}
    >
      <Icon className="w-5 h-5" />
      {label && <span>{label}</span>}
    </button>
  );
};
