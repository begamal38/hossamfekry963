import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  onNextPage: () => void;
  onPrevPage: () => void;
  onGoToFirst?: () => void;
  onGoToLast?: () => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  isRTL?: boolean;
  className?: string;
  compact?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  onNextPage,
  onPrevPage,
  onGoToFirst,
  onGoToLast,
  hasNextPage,
  hasPrevPage,
  isRTL = false,
  className,
  compact = false,
}) => {
  // Don't show pagination if only one page
  if (totalPages <= 1) return null;

  // Swap icons for RTL
  const PrevIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;
  const FirstIcon = isRTL ? ChevronsRight : ChevronsLeft;
  const LastIcon = isRTL ? ChevronsLeft : ChevronsRight;

  return (
    <div 
      className={cn(
        'flex items-center justify-between gap-2 py-3 px-1',
        className
      )}
    >
      {/* Item range info */}
      <div className="text-xs sm:text-sm text-muted-foreground tabular-nums">
        {isRTL ? (
          <span>{startIndex} - {endIndex} من {totalItems}</span>
        ) : (
          <span>{startIndex} - {endIndex} of {totalItems}</span>
        )}
      </div>

      {/* Navigation controls */}
      <div className="flex items-center gap-1">
        {/* First page button - only on larger screens or non-compact */}
        {!compact && onGoToFirst && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onGoToFirst}
            disabled={!hasPrevPage}
            className="h-8 w-8 hidden sm:flex"
            aria-label={isRTL ? 'الصفحة الأولى' : 'First page'}
          >
            <FirstIcon className="h-4 w-4" />
          </Button>
        )}

        {/* Previous page button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevPage}
          disabled={!hasPrevPage}
          className="h-8 px-2 sm:px-3 gap-1"
          aria-label={isRTL ? 'الصفحة السابقة' : 'Previous page'}
        >
          <PrevIcon className="h-4 w-4" />
          <span className="hidden sm:inline text-xs">
            {isRTL ? 'السابق' : 'Prev'}
          </span>
        </Button>

        {/* Page indicator */}
        <div className="flex items-center justify-center min-w-[4rem] px-2">
          <span className="text-xs sm:text-sm font-medium tabular-nums">
            {currentPage} / {totalPages}
          </span>
        </div>

        {/* Next page button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onNextPage}
          disabled={!hasNextPage}
          className="h-8 px-2 sm:px-3 gap-1"
          aria-label={isRTL ? 'الصفحة التالية' : 'Next page'}
        >
          <span className="hidden sm:inline text-xs">
            {isRTL ? 'التالي' : 'Next'}
          </span>
          <NextIcon className="h-4 w-4" />
        </Button>

        {/* Last page button - only on larger screens or non-compact */}
        {!compact && onGoToLast && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onGoToLast}
            disabled={!hasNextPage}
            className="h-8 w-8 hidden sm:flex"
            aria-label={isRTL ? 'الصفحة الأخيرة' : 'Last page'}
          >
            <LastIcon className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
