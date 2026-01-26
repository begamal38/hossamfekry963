import React from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FilterOption {
  value: string;
  label: string;
}

interface SearchFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: Array<{
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
    placeholder?: string;
  }>;
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
  isRTL?: boolean;
  className?: string;
  /** Show active filter count badge */
  showFilterCount?: boolean;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'بحث...',
  filters,
  onClearFilters,
  hasActiveFilters = false,
  isRTL = false,
  className,
  showFilterCount = true,
}) => {
  // Count active filters (excluding 'all' values)
  const activeFilterCount = filters?.filter(f => f.value !== 'all').length || 0;
  
  return (
    <div className={cn("space-y-3 mb-4", className)}>
      {/* Search Bar - Enhanced with clear affordance */}
      <div className="relative">
        <Search className={cn(
          "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground",
          isRTL ? "right-3" : "left-3"
        )} />
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(
            "h-10 bg-background/50 border-border/80 focus:border-primary/50 transition-colors",
            isRTL ? "pr-10" : "pl-10",
            searchValue && (isRTL ? "pl-10" : "pr-10")
          )}
        />
        {searchValue && (
          <button
            onClick={() => onSearchChange('')}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-muted transition-colors",
              isRTL ? "left-2" : "right-2"
            )}
            aria-label={isRTL ? 'مسح البحث' : 'Clear search'}
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Filters - Horizontal scroll with active indicator */}
      {filters && filters.length > 0 && (
        <div className="flex items-center gap-2">
          {/* Filter indicator icon */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
            {showFilterCount && activeFilterCount > 0 && (
              <Badge 
                variant="default" 
                className="h-5 min-w-5 px-1.5 text-[10px] font-semibold"
              >
                {activeFilterCount}
              </Badge>
            )}
          </div>
          
          {/* Scrollable filters */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1 -mx-1 px-1 pb-0.5">
            {filters.map((filter, index) => (
              <select
                key={index}
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                className={cn(
                  "flex-shrink-0 h-8 px-3 text-xs bg-background border rounded-full cursor-pointer",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all",
                  filter.value !== 'all' 
                    ? "border-primary/50 text-primary bg-primary/5 font-medium" 
                    : "border-border/80 text-muted-foreground hover:border-border"
                )}
              >
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ))}
            
            {/* Clear filters button - only when active */}
            {hasActiveFilters && onClearFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="flex-shrink-0 h-8 px-3 text-xs text-muted-foreground hover:text-foreground gap-1"
              >
                <X className="w-3 h-3" />
                {isRTL ? 'مسح' : 'Clear'}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};