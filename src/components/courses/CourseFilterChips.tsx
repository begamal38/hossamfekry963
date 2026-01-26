import React from 'react';
import { Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface FilterOption {
  value: string;
  label: string;
  group?: 'year' | 'track' | 'status';
}

interface CourseFilterChipsProps {
  filters: FilterOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  showFreeOnly?: boolean;
  onFreeToggle?: () => void;
  isRTL?: boolean;
  className?: string;
}

/**
 * Unified Course Filter Chips
 * Groups filters logically: Year → Track → Status
 * Mobile: horizontal scroll, Desktop: inline wrap
 */
export const CourseFilterChips: React.FC<CourseFilterChipsProps> = ({
  filters,
  selectedValue,
  onSelect,
  showFreeOnly = false,
  onFreeToggle,
  isRTL = false,
  className,
}) => {
  const hasActiveFilter = selectedValue !== 'all' || showFreeOnly;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Filter chips row - Horizontal scroll on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
        {/* "All" chip */}
        <button
          onClick={() => onSelect('all')}
          className={cn(
            "flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-150",
            "active:scale-[0.97] select-none touch-manipulation",
            selectedValue === 'all' && !showFreeOnly
              ? "bg-primary text-primary-foreground shadow-sm" 
              : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {isRTL ? 'الكل' : 'All'}
        </button>
        
        {/* Grade/Track chips */}
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => onSelect(filter.value)}
            className={cn(
              "flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-150 whitespace-nowrap",
              "active:scale-[0.97] select-none touch-manipulation",
              selectedValue === filter.value 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {filter.label}
          </button>
        ))}
        
        {/* Free filter chip - visually distinct */}
        {onFreeToggle && (
          <button
            onClick={onFreeToggle}
            className={cn(
              "flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-150 flex items-center gap-1.5",
              "active:scale-[0.97] select-none touch-manipulation",
              showFreeOnly 
                ? "bg-success text-success-foreground shadow-sm" 
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isRTL ? 'مجاني' : 'Free'}
          </button>
        )}
      </div>

      {/* Active filter indicator */}
      {hasActiveFilter && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {isRTL ? 'الفلاتر النشطة:' : 'Active:'}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {selectedValue !== 'all' && (
              <Badge 
                variant="secondary" 
                className="gap-1 text-xs cursor-pointer hover:bg-secondary/80"
                onClick={() => onSelect('all')}
              >
                {filters.find(f => f.value === selectedValue)?.label}
                <X className="w-3 h-3" />
              </Badge>
            )}
            {showFreeOnly && onFreeToggle && (
              <Badge 
                variant="success" 
                className="gap-1 text-xs cursor-pointer"
                onClick={onFreeToggle}
              >
                {isRTL ? 'مجاني' : 'Free'}
                <X className="w-3 h-3" />
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseFilterChips;
