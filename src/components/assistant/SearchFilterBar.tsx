import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
}) => {
  return (
    <div className={cn("space-y-3 mb-4", className)}>
      {/* Search Bar */}
      <div className="relative">
        <Search className={cn(
          "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground",
          isRTL ? "right-3" : "left-3"
        )} />
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn("h-10", isRTL ? "pr-10" : "pl-10")}
        />
        {searchValue && (
          <button
            onClick={() => onSearchChange('')}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted",
              isRTL ? "left-3" : "right-3"
            )}
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Filters - Horizontal scroll */}
      {filters && filters.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-3 px-3 pb-1">
          {filters.map((filter, index) => (
            <select
              key={index}
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className={cn(
                "flex-shrink-0 h-8 px-3 text-xs bg-background border border-input rounded-full",
                "focus:outline-none focus:ring-2 focus:ring-primary/20",
                filter.value !== 'all' && "border-primary text-primary bg-primary/5"
              )}
            >
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ))}
          
          {hasActiveFilters && onClearFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="flex-shrink-0 h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3 mr-1" />
              {isRTL ? 'مسح الفلاتر' : 'Clear'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
