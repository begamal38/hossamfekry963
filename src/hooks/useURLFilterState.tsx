/**
 * URL-based Filter State Persistence Hook
 * 
 * Persists filter state to URL search params for navigation preservation.
 * When navigating away and back, filters are restored from the URL.
 * 
 * This enables:
 * - Filter persistence across List → Detail → Back navigation
 * - Shareable filtered views
 * - Browser history-aware filtering
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export type CourseStatusFilter = 'all' | 'with_courses' | 'no_courses';

export interface URLFilterState {
  grade: string;
  track: string;
  studyMode: string;
  centerGroup: string;
  courseStatus: CourseStatusFilter;
}

const FILTER_PARAM_KEYS = {
  grade: 'g',
  track: 't',
  studyMode: 's',
  centerGroup: 'cg',
  courseStatus: 'cs',
} as const;

const DEFAULT_VALUES: URLFilterState = {
  grade: 'all',
  track: 'all',
  studyMode: 'all',
  centerGroup: 'all',
  courseStatus: 'all',
};

/**
 * Hook for URL-based filter persistence
 * Reads from and writes to URL search params
 */
export function useURLFilterState() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read current filter state from URL
  const filterState = useMemo<URLFilterState>(() => ({
    grade: searchParams.get(FILTER_PARAM_KEYS.grade) || DEFAULT_VALUES.grade,
    track: searchParams.get(FILTER_PARAM_KEYS.track) || DEFAULT_VALUES.track,
    studyMode: searchParams.get(FILTER_PARAM_KEYS.studyMode) || DEFAULT_VALUES.studyMode,
    centerGroup: searchParams.get(FILTER_PARAM_KEYS.centerGroup) || DEFAULT_VALUES.centerGroup,
    courseStatus: (searchParams.get(FILTER_PARAM_KEYS.courseStatus) as CourseStatusFilter) || DEFAULT_VALUES.courseStatus,
  }), [searchParams]);

  // Update a single filter value in URL
  const setFilter = useCallback((key: keyof URLFilterState, value: string) => {
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      const paramKey = FILTER_PARAM_KEYS[key];
      
      if (value === 'all' || value === DEFAULT_VALUES[key]) {
        // Remove param if it's the default value
        params.delete(paramKey);
      } else {
        params.set(paramKey, value);
      }
      
      // Special case: clear centerGroup when studyMode is not 'center'
      if (key === 'studyMode' && value !== 'center') {
        params.delete(FILTER_PARAM_KEYS.centerGroup);
      }
      
      return params;
    }, { replace: true });
  }, [setSearchParams]);

  // Convenience setters for each filter
  const setGradeFilter = useCallback((value: string) => setFilter('grade', value), [setFilter]);
  const setTrackFilter = useCallback((value: string) => setFilter('track', value), [setFilter]);
  const setStudyModeFilter = useCallback((value: string) => setFilter('studyMode', value), [setFilter]);
  const setCenterGroupFilter = useCallback((value: string) => setFilter('centerGroup', value), [setFilter]);
  const setCourseStatusFilter = useCallback((value: string) => setFilter('courseStatus', value), [setFilter]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filterState.grade !== 'all' ||
      filterState.track !== 'all' ||
      filterState.studyMode !== 'all' ||
      filterState.centerGroup !== 'all' ||
      filterState.courseStatus !== 'all'
    );
  }, [filterState]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      Object.values(FILTER_PARAM_KEYS).forEach(key => params.delete(key));
      return params;
    }, { replace: true });
  }, [setSearchParams]);

  return {
    // State
    filterState,
    gradeFilter: filterState.grade,
    trackFilter: filterState.track,
    studyModeFilter: filterState.studyMode,
    centerGroupFilter: filterState.centerGroup,
    courseStatusFilter: filterState.courseStatus,
    
    // Setters
    setGradeFilter,
    setTrackFilter,
    setStudyModeFilter,
    setCenterGroupFilter,
    setCourseStatusFilter,
    
    // Helpers
    hasActiveFilters,
    clearFilters,
  };
}

// Filter options for Course Status
export const getCourseStatusFilterOptions = (isRTL: boolean) => [
  { value: 'all', label: isRTL ? 'كل الطلاب' : 'All Students' },
  { value: 'with_courses', label: isRTL ? 'لديهم كورسات مفعلة' : 'With Active Courses' },
  { value: 'no_courses', label: isRTL ? 'بدون أي كورسات' : 'No Courses' },
];
