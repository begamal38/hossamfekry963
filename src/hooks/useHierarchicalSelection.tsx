/**
 * Hierarchical State Lock + Anti-Reset Guard System
 * 
 * This hook manages a strict parent-child selection hierarchy (Course → Chapter → Lesson)
 * that prevents automatic resets when:
 * - Parent data is re-fetched
 * - Component re-renders
 * - Internal state updates occur
 * 
 * Key Rules:
 * 1. User selections are LOCKED once made
 * 2. Defaults apply ONLY on initial boot when state is null
 * 3. API responses populate option lists only, never mutate selection state
 * 4. Changing a parent clears all child selections
 */

import { useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

// URL param keys for persistence
const PARAM_KEYS = {
  course: 'c',
  chapter: 'ch',
  lesson: 'l',
} as const;

// Alternative param keys (for backward compatibility)
const ALT_PARAM_KEYS = {
  course: 'course',
  chapter: 'chapter',
  lesson: 'lesson',
} as const;

type SelectionLevel = 'course' | 'chapter' | 'lesson';

interface HierarchicalSelection {
  courseId: string | null;
  chapterId: string | null;
  lessonId: string | null;
}

interface UseHierarchicalSelectionOptions {
  /** Whether to include lesson in the hierarchy (default: false for chapters page) */
  includeLesson?: boolean;
  /** Default chapter value when none selected (e.g., 'all') */
  defaultChapter?: string;
}

interface UseHierarchicalSelectionReturn {
  /** Current selection state */
  selection: HierarchicalSelection;
  
  /** Set course - clears chapter and lesson */
  setCourse: (courseId: string | null) => void;
  
  /** Set chapter - clears lesson only */
  setChapter: (chapterId: string | null) => void;
  
  /** Set lesson */
  setLesson: (lessonId: string | null) => void;
  
  /** Apply default course ONLY if no selection exists (one-time boot) */
  applyDefaultCourseIfEmpty: (courseId: string) => void;
  
  /** Check if user has made a selection (locked state) */
  hasUserSelection: (level: SelectionLevel) => boolean;
  
  /** Clear all selections */
  clearAll: () => void;
}

/**
 * Read value from URL params with fallback to alternative key
 */
function getParamValue(
  searchParams: URLSearchParams,
  primaryKey: string,
  altKey: string
): string | null {
  return searchParams.get(primaryKey) || searchParams.get(altKey) || null;
}

export function useHierarchicalSelection(
  options: UseHierarchicalSelectionOptions = {}
): UseHierarchicalSelectionReturn {
  const { includeLesson = true, defaultChapter = null } = options;
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Track if user has made a selection (prevents auto-defaults after first selection)
  // This ref persists across renders without causing re-renders
  const userSelectionLock = useRef<Record<SelectionLevel, boolean>>({
    course: false,
    chapter: false,
    lesson: false,
  });
  
  // Initialize lock state from URL params (if URL has values, user has selected)
  const initialUrlCourse = getParamValue(searchParams, PARAM_KEYS.course, ALT_PARAM_KEYS.course);
  const initialUrlChapter = getParamValue(searchParams, PARAM_KEYS.chapter, ALT_PARAM_KEYS.chapter);
  const initialUrlLesson = getParamValue(searchParams, PARAM_KEYS.lesson, ALT_PARAM_KEYS.lesson);
  
  // Mark as locked if URL has values on mount
  if (initialUrlCourse && !userSelectionLock.current.course) {
    userSelectionLock.current.course = true;
  }
  if (initialUrlChapter && !userSelectionLock.current.chapter) {
    userSelectionLock.current.chapter = true;
  }
  if (initialUrlLesson && !userSelectionLock.current.lesson) {
    userSelectionLock.current.lesson = true;
  }
  
  // Read current selection from URL (single source of truth)
  const selection = useMemo<HierarchicalSelection>(() => ({
    courseId: getParamValue(searchParams, PARAM_KEYS.course, ALT_PARAM_KEYS.course),
    chapterId: getParamValue(searchParams, PARAM_KEYS.chapter, ALT_PARAM_KEYS.chapter) || defaultChapter,
    lessonId: includeLesson 
      ? getParamValue(searchParams, PARAM_KEYS.lesson, ALT_PARAM_KEYS.lesson) 
      : null,
  }), [searchParams, defaultChapter, includeLesson]);
  
  /**
   * Update URL params atomically
   * Removes legacy param keys and sets only the short keys
   */
  const updateParams = useCallback((updates: Partial<HierarchicalSelection>) => {
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      
      // Process course
      if ('courseId' in updates) {
        // Remove both old and new keys first
        params.delete(ALT_PARAM_KEYS.course);
        params.delete(PARAM_KEYS.course);
        
        if (updates.courseId) {
          params.set(PARAM_KEYS.course, updates.courseId);
        }
      }
      
      // Process chapter
      if ('chapterId' in updates) {
        params.delete(ALT_PARAM_KEYS.chapter);
        params.delete(PARAM_KEYS.chapter);
        
        if (updates.chapterId && updates.chapterId !== defaultChapter) {
          params.set(PARAM_KEYS.chapter, updates.chapterId);
        }
      }
      
      // Process lesson
      if ('lessonId' in updates && includeLesson) {
        params.delete(ALT_PARAM_KEYS.lesson);
        params.delete(PARAM_KEYS.lesson);
        
        if (updates.lessonId) {
          params.set(PARAM_KEYS.lesson, updates.lessonId);
        }
      }
      
      return params;
    }, { replace: true });
  }, [setSearchParams, defaultChapter, includeLesson]);
  
  /**
   * Set course - CLEARS chapter and lesson (parent change rule)
   */
  const setCourse = useCallback((courseId: string | null) => {
    // Lock the course selection
    userSelectionLock.current.course = true;
    
    // Unlock children (they'll need new selection)
    userSelectionLock.current.chapter = false;
    userSelectionLock.current.lesson = false;
    
    // Update all levels
    updateParams({
      courseId,
      chapterId: defaultChapter, // Reset to default
      lessonId: null,
    });
  }, [updateParams, defaultChapter]);
  
  /**
   * Set chapter - CLEARS lesson only
   */
  const setChapter = useCallback((chapterId: string | null) => {
    // Lock the chapter selection
    userSelectionLock.current.chapter = true;
    
    // Unlock lesson
    userSelectionLock.current.lesson = false;
    
    updateParams({
      chapterId: chapterId || defaultChapter,
      lessonId: null,
    });
  }, [updateParams, defaultChapter]);
  
  /**
   * Set lesson
   */
  const setLesson = useCallback((lessonId: string | null) => {
    userSelectionLock.current.lesson = true;
    updateParams({ lessonId });
  }, [updateParams]);
  
  /**
   * Apply default course ONLY if:
   * 1. No course is currently selected
   * 2. User has NOT made any course selection yet (not locked)
   * 
   * This is the ANTI-RESET GUARD - prevents re-applying defaults after re-fetch
   */
  const applyDefaultCourseIfEmpty = useCallback((courseId: string) => {
    // CRITICAL: Only apply if truly empty AND not locked
    if (!selection.courseId && !userSelectionLock.current.course) {
      userSelectionLock.current.course = true;
      updateParams({ courseId });
    }
  }, [selection.courseId, updateParams]);
  
  /**
   * Check if user has made a selection at a specific level
   */
  const hasUserSelection = useCallback((level: SelectionLevel): boolean => {
    return userSelectionLock.current[level];
  }, []);
  
  /**
   * Clear all selections (explicit user action)
   */
  const clearAll = useCallback(() => {
    userSelectionLock.current = {
      course: false,
      chapter: false,
      lesson: false,
    };
    
    updateParams({
      courseId: null,
      chapterId: defaultChapter,
      lessonId: null,
    });
  }, [updateParams, defaultChapter]);
  
  return {
    selection,
    setCourse,
    setChapter,
    setLesson,
    applyDefaultCourseIfEmpty,
    hasUserSelection,
    clearAll,
  };
}
