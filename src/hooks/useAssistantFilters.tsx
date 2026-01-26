/**
 * Unified Filter Engine for Assistant Dashboard Pages
 * 
 * Provides consistent filtering across Students, Enrollments, and other assistant pages.
 * Single source of truth for filter options and logic.
 */

import { useState, useMemo, useCallback } from 'react';

// ============= Filter Types =============

export type StudyModeFilter = 'all' | 'online' | 'center';

export interface AssistantFilterState {
  searchTerm: string;
  gradeFilter: string;
  trackFilter: string;
  studyModeFilter: StudyModeFilter;
  centerGroupFilter: string;
  statusFilter: string;
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface CenterGroup {
  id: string;
  name: string;
  grade: string;
  language_track: string;
}

// ============= Filter Options (Consistent across all pages) =============

export const getGradeFilterOptions = (isRTL: boolean): FilterOption[] => [
  { value: 'all', label: isRTL ? 'كل الصفوف' : 'All Grades' },
  { value: 'second_secondary', label: isRTL ? 'تانية ثانوي' : '2nd Sec' },
  { value: 'third_secondary', label: isRTL ? 'تالته ثانوي' : '3rd Sec' },
];

// Course Status Filter Options
export type CourseStatusFilter = 'all' | 'with_courses' | 'no_courses';

export const getCourseStatusFilterOptions = (isRTL: boolean): FilterOption[] => [
  { value: 'all', label: isRTL ? 'كل الطلاب' : 'All Students' },
  { value: 'with_courses', label: isRTL ? 'لديهم كورسات' : 'With Courses' },
  { value: 'no_courses', label: isRTL ? 'بدون كورسات' : 'No Courses' },
];

export const getTrackFilterOptions = (isRTL: boolean): FilterOption[] => [
  { value: 'all', label: isRTL ? 'كل الأنظمة' : 'All Tracks' },
  { value: 'arabic', label: isRTL ? 'عربي' : 'Arabic' },
  { value: 'languages', label: isRTL ? 'لغات' : 'Languages' },
];

export const getStudyModeFilterOptions = (isRTL: boolean): FilterOption[] => [
  { value: 'all', label: isRTL ? 'كل الأنظمة' : 'All Modes' },
  { value: 'online', label: isRTL ? 'أونلاين' : 'Online' },
  { value: 'center', label: isRTL ? 'سنتر' : 'Center' },
];

export const getStatusFilterOptions = (isRTL: boolean): FilterOption[] => [
  { value: 'all', label: isRTL ? 'كل الحالات' : 'All Status' },
  { value: 'pending', label: isRTL ? 'معلق' : 'Pending' },
  { value: 'active', label: isRTL ? 'نشط' : 'Active' },
  { value: 'suspended', label: isRTL ? 'موقوف' : 'Suspended' },
  { value: 'expired', label: isRTL ? 'منتهي' : 'Expired' },
];

export const getCenterGroupFilterOptions = (
  groups: CenterGroup[],
  isRTL: boolean,
  gradeFilter?: string,
  trackFilter?: string
): FilterOption[] => {
  // Filter groups by grade and track if specified
  let filteredGroups = groups;
  
  if (gradeFilter && gradeFilter !== 'all') {
    filteredGroups = filteredGroups.filter(g => g.grade === gradeFilter);
  }
  
  if (trackFilter && trackFilter !== 'all') {
    filteredGroups = filteredGroups.filter(g => g.language_track === trackFilter);
  }
  
  return [
    { value: 'all', label: isRTL ? 'كل المجموعات' : 'All Groups' },
    ...filteredGroups.map(g => ({
      value: g.id,
      label: g.name,
    })),
  ];
};

// ============= Student Profile Interface =============

export interface FilterableStudent {
  user_id: string;
  full_name?: string | null;
  phone?: string | null;
  grade?: string | null;
  academic_year?: string | null;
  language_track?: string | null;
  attendance_mode?: 'online' | 'center' | 'hybrid' | null;
  center_group_id?: string | null;
}

export interface FilterableEnrollment {
  id: string;
  user_id: string;
  status: string;
  profile?: {
    full_name?: string | null;
    phone?: string | null;
    email?: string | null;
    grade?: string | null;
    academic_year?: string | null;
    language_track?: string | null;
    attendance_mode?: 'online' | 'center' | 'hybrid' | null;
  };
  course?: {
    title?: string;
    title_ar?: string;
    grade?: string;
  };
}

// ============= Filter Logic (Pure functions) =============

export function applyStudentFilters<T extends FilterableStudent>(
  students: T[],
  filters: Partial<AssistantFilterState>,
  centerGroupMembers?: Map<string, string> // userId -> groupId mapping
): T[] {
  let filtered = [...students];

  // Search filter (name or phone)
  if (filters.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    filtered = filtered.filter(
      (s) =>
        s.full_name?.toLowerCase().includes(term) ||
        s.phone?.includes(filters.searchTerm!)
    );
  }

  // Grade filter (academic_year or grade)
  if (filters.gradeFilter && filters.gradeFilter !== 'all') {
    filtered = filtered.filter(
      (s) => s.academic_year === filters.gradeFilter || s.grade === filters.gradeFilter
    );
  }

  // Track filter
  if (filters.trackFilter && filters.trackFilter !== 'all') {
    filtered = filtered.filter(
      (s) => s.language_track === filters.trackFilter
    );
  }

  // Study mode filter
  if (filters.studyModeFilter && filters.studyModeFilter !== 'all') {
    filtered = filtered.filter(
      (s) => s.attendance_mode === filters.studyModeFilter
    );
  }

  // Center group filter (requires centerGroupMembers mapping)
  if (filters.centerGroupFilter && filters.centerGroupFilter !== 'all' && centerGroupMembers) {
    filtered = filtered.filter(
      (s) => centerGroupMembers.get(s.user_id) === filters.centerGroupFilter
    );
  }

  return filtered;
}

export function applyEnrollmentFilters(
  enrollments: FilterableEnrollment[],
  filters: Partial<AssistantFilterState>,
  centerGroupMembers?: Map<string, string>
): FilterableEnrollment[] {
  let filtered = [...enrollments];

  // Search filter (name, phone, email, or course)
  if (filters.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.profile?.full_name?.toLowerCase().includes(term) ||
        e.profile?.phone?.includes(filters.searchTerm!) ||
        e.profile?.email?.toLowerCase().includes(term) ||
        e.course?.title?.toLowerCase().includes(term) ||
        e.course?.title_ar?.includes(filters.searchTerm!)
    );
  }

  // Status filter
  if (filters.statusFilter && filters.statusFilter !== 'all') {
    filtered = filtered.filter((e) => e.status === filters.statusFilter);
  }

  // Grade filter (from profile)
  if (filters.gradeFilter && filters.gradeFilter !== 'all') {
    filtered = filtered.filter(
      (e) => 
        e.profile?.academic_year === filters.gradeFilter || 
        e.profile?.grade === filters.gradeFilter
    );
  }

  // Track filter (from profile)
  if (filters.trackFilter && filters.trackFilter !== 'all') {
    filtered = filtered.filter(
      (e) => e.profile?.language_track === filters.trackFilter
    );
  }

  // Study mode filter (from profile)
  if (filters.studyModeFilter && filters.studyModeFilter !== 'all') {
    filtered = filtered.filter(
      (e) => e.profile?.attendance_mode === filters.studyModeFilter
    );
  }

  // Center group filter
  if (filters.centerGroupFilter && filters.centerGroupFilter !== 'all' && centerGroupMembers) {
    filtered = filtered.filter(
      (e) => centerGroupMembers.get(e.user_id) === filters.centerGroupFilter
    );
  }

  return filtered;
}

// ============= Main Hook =============

interface UseAssistantFiltersOptions {
  includeStatus?: boolean;
  includeCenterGroup?: boolean;
  centerGroups?: CenterGroup[];
}

export function useAssistantFilters(options: UseAssistantFiltersOptions = {}) {
  const { includeStatus = false, includeCenterGroup = true, centerGroups = [] } = options;

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [trackFilter, setTrackFilter] = useState('all');
  const [studyModeFilter, setStudyModeFilter] = useState<StudyModeFilter>('all');
  const [centerGroupFilter, setCenterGroupFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Computed: has any active filters
  const hasActiveFilters = useMemo(() => {
    return (
      searchTerm !== '' ||
      gradeFilter !== 'all' ||
      trackFilter !== 'all' ||
      studyModeFilter !== 'all' ||
      centerGroupFilter !== 'all' ||
      (includeStatus && statusFilter !== 'all')
    );
  }, [searchTerm, gradeFilter, trackFilter, studyModeFilter, centerGroupFilter, statusFilter, includeStatus]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setGradeFilter('all');
    setTrackFilter('all');
    setStudyModeFilter('all');
    setCenterGroupFilter('all');
    setStatusFilter('all');
  }, []);

  // Reset center group when study mode changes from 'center'
  const handleStudyModeChange = useCallback((value: string) => {
    setStudyModeFilter(value as StudyModeFilter);
    if (value !== 'center') {
      setCenterGroupFilter('all');
    }
  }, []);

  // Build filter config for SearchFilterBar
  const buildFilterConfig = useCallback((isRTL: boolean) => {
    const filters: Array<{
      value: string;
      onChange: (value: string) => void;
      options: FilterOption[];
    }> = [];

    // Grade filter
    filters.push({
      value: gradeFilter,
      onChange: setGradeFilter,
      options: getGradeFilterOptions(isRTL),
    });

    // Track filter
    filters.push({
      value: trackFilter,
      onChange: setTrackFilter,
      options: getTrackFilterOptions(isRTL),
    });

    // Study mode filter
    filters.push({
      value: studyModeFilter,
      onChange: handleStudyModeChange,
      options: getStudyModeFilterOptions(isRTL),
    });

    // Center group filter (only visible when study mode is 'center')
    if (includeCenterGroup && studyModeFilter === 'center' && centerGroups.length > 0) {
      filters.push({
        value: centerGroupFilter,
        onChange: setCenterGroupFilter,
        options: getCenterGroupFilterOptions(centerGroups, isRTL, gradeFilter, trackFilter),
      });
    }

    // Status filter (for enrollments page)
    if (includeStatus) {
      filters.push({
        value: statusFilter,
        onChange: setStatusFilter,
        options: getStatusFilterOptions(isRTL),
      });
    }

    return filters;
  }, [
    gradeFilter,
    trackFilter,
    studyModeFilter,
    centerGroupFilter,
    statusFilter,
    centerGroups,
    includeStatus,
    includeCenterGroup,
    handleStudyModeChange,
  ]);

  // Current filter state for external use
  const filterState: AssistantFilterState = useMemo(() => ({
    searchTerm,
    gradeFilter,
    trackFilter,
    studyModeFilter,
    centerGroupFilter,
    statusFilter,
  }), [searchTerm, gradeFilter, trackFilter, studyModeFilter, centerGroupFilter, statusFilter]);

  return {
    // Individual filter state
    searchTerm,
    setSearchTerm,
    gradeFilter,
    setGradeFilter,
    trackFilter,
    setTrackFilter,
    studyModeFilter,
    setStudyModeFilter: handleStudyModeChange,
    centerGroupFilter,
    setCenterGroupFilter,
    statusFilter,
    setStatusFilter,
    
    // Computed
    hasActiveFilters,
    filterState,
    
    // Actions
    clearFilters,
    buildFilterConfig,
  };
}
