/**
 * Filter State Persistence Hook
 * 
 * Remembers the last filter state in localStorage for assistant pages.
 * Improves productivity by maintaining context between page navigations.
 * 
 * NOTE: Only persists non-sensitive filter state (not search terms).
 */

import { useEffect, useCallback } from 'react';

interface FilterState {
  gradeFilter?: string;
  trackFilter?: string;
  studyModeFilter?: string;
  centerGroupFilter?: string;
  statusFilter?: string;
}

const STORAGE_KEY_PREFIX = 'assistant_filters_';

/**
 * Persist and restore filter state for a specific page
 */
export function useFilterPersistence(
  pageKey: string,
  filterState: FilterState,
  setters: {
    setGradeFilter?: (v: string) => void;
    setTrackFilter?: (v: string) => void;
    setStudyModeFilter?: (v: string) => void;
    setCenterGroupFilter?: (v: string) => void;
    setStatusFilter?: (v: string) => void;
  }
) {
  const storageKey = `${STORAGE_KEY_PREFIX}${pageKey}`;

  // Restore on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as FilterState;
        
        if (parsed.gradeFilter && setters.setGradeFilter) {
          setters.setGradeFilter(parsed.gradeFilter);
        }
        if (parsed.trackFilter && setters.setTrackFilter) {
          setters.setTrackFilter(parsed.trackFilter);
        }
        if (parsed.studyModeFilter && setters.setStudyModeFilter) {
          setters.setStudyModeFilter(parsed.studyModeFilter);
        }
        if (parsed.centerGroupFilter && setters.setCenterGroupFilter) {
          setters.setCenterGroupFilter(parsed.centerGroupFilter);
        }
        if (parsed.statusFilter && setters.setStatusFilter) {
          setters.setStatusFilter(parsed.statusFilter);
        }
      }
    } catch (e) {
      // Ignore parse errors
      console.warn('Failed to restore filter state:', e);
    }
  }, [storageKey]); // Only run on mount

  // Save on change (debounced effect)
  useEffect(() => {
    // Only save if at least one filter is active
    const hasActiveFilters = Object.values(filterState).some(v => v && v !== 'all');
    
    if (hasActiveFilters) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(filterState));
      } catch (e) {
        // Ignore storage errors
      }
    } else {
      // Clear storage when all filters are reset
      localStorage.removeItem(storageKey);
    }
  }, [storageKey, filterState]);

  // Clear persisted state
  const clearPersistedFilters = useCallback(() => {
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  return { clearPersistedFilters };
}
