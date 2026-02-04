import { useState, useMemo, useCallback } from 'react';

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

export function usePagination<T>(
  items: T[],
  options: UsePaginationOptions = {}
): UsePaginationResult<T> {
  const { itemsPerPage = 30, initialPage = 1 } = options;
  const [currentPage, setCurrentPage] = useState(initialPage);
  
  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(items.length / itemsPerPage));
  }, [items.length, itemsPerPage]);
  
  // Ensure current page is valid
  const validatedPage = useMemo(() => {
    if (currentPage > totalPages) return totalPages;
    if (currentPage < 1) return 1;
    return currentPage;
  }, [currentPage, totalPages]);
  
  // Auto-correct page if it's out of bounds
  if (validatedPage !== currentPage) {
    setCurrentPage(validatedPage);
  }
  
  // Calculate indices
  const startIndex = (validatedPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, items.length);
  
  // Get current page items
  const currentItems = useMemo(() => {
    return items.slice(startIndex, endIndex);
  }, [items, startIndex, endIndex]);
  
  // Navigation functions
  const goToPage = useCallback((page: number) => {
    const targetPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(targetPage);
  }, [totalPages]);
  
  const nextPage = useCallback(() => {
    if (validatedPage < totalPages) {
      setCurrentPage(validatedPage + 1);
    }
  }, [validatedPage, totalPages]);
  
  const prevPage = useCallback(() => {
    if (validatedPage > 1) {
      setCurrentPage(validatedPage - 1);
    }
  }, [validatedPage]);
  
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
    totalItems: items.length,
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
