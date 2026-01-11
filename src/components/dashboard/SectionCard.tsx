import React from 'react';
import { ChevronLeft, ChevronRight, LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  /** Section title */
  title: string;
  /** Optional icon */
  icon?: LucideIcon;
  /** Link for "see all" action */
  seeAllHref?: string;
  /** RTL mode */
  isRTL?: boolean;
  /** Additional class names */
  className?: string;
  /** Content */
  children: React.ReactNode;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  icon: Icon,
  seeAllHref,
  isRTL = false,
  className,
  children,
}) => {
  return (
    <section className={cn("bg-card rounded-2xl border border-border p-4 sm:p-5", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="w-4 h-4 text-primary" />
            </div>
          )}
          <h3 className="text-base sm:text-lg font-bold text-foreground">{title}</h3>
        </div>
        
        {seeAllHref && (
          <Link
            to={seeAllHref}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <span>{isRTL ? 'عرض الكل' : 'See all'}</span>
            {isRTL ? (
              <ChevronLeft className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </Link>
        )}
      </div>

      {/* Content */}
      {children}
    </section>
  );
};
