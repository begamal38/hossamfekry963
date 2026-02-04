import { useState, useMemo, useCallback, useEffect } from 'react';

interface UsePaginationOptions {
  itemsPerPage?: number;
  initialPage?: number;
}

interface UsePaginationResult<T> {
  // Current page data
  currentItems: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  
  // Navigation
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  goToFirst: () => void;
  goToLast: () => void;
  
  // State helpers
  hasNextPage: boolean;
  hasPrevPage: boolean;
  startIndex: number;
  endIndex: number;
  
  // Reset when data changes
  resetToFirstPage: () => void;
}

/**
 * Pagination hook following SSOT standards
 * - Uses stable primitive dependencies
 * - Effect-based page correction (no render-time setState)
 * - Memoized calculations for performance
 */
export function usePagination<T>(
  items: T[],
  options: UsePaginationOptions = {}
): UsePaginationResult<T> {
  const { itemsPerPage = 30, initialPage = 1 } = options;
  const [currentPage, setCurrentPage] = useState(initialPage);
  
  // Stable primitive: items.length
  const itemsLength = items.length;
  
  // Calculate total pages using stable primitive
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(itemsLength / itemsPerPage));
  }, [itemsLength, itemsPerPage]);
  
  // Effect-based page correction (SSOT: no setState during render)
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    } else if (currentPage < 1) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);
  
  // Use validated page for calculations
  const validatedPage = Math.max(1, Math.min(currentPage, totalPages));
  
  // Calculate indices
  const startIndex = (validatedPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, itemsLength);
  
  // Get current page items - uses stable indices
  const currentItems = useMemo(() => {
    return items.slice(startIndex, endIndex);
  }, [items, startIndex, endIndex]);
  
  // Navigation functions with stable dependencies
  const goToPage = useCallback((page: number) => {
    const targetPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(targetPage);
  }, [totalPages]);
  
  const nextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  }, [totalPages]);
  
  const prevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);
  
  const goToFirst = useCallback(() => {
    setCurrentPage(1);
  }, []);
  
  const goToLast = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);
  
  const resetToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);
  
  return {
    currentItems,
    currentPage: validatedPage,
    totalPages,
    totalItems: itemsLength,
    goToPage,
    nextPage,
    prevPage,
    goToFirst,
    goToLast,
    hasNextPage: validatedPage < totalPages,
    hasPrevPage: validatedPage > 1,
    startIndex: startIndex + 1, // 1-indexed for display
    endIndex,
    resetToFirstPage,
  };
}
