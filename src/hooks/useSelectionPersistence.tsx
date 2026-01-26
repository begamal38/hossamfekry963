/**
 * URL-based Selection Persistence Hook
 * 
 * Persists entity selections (course, chapter, etc.) to URL search params.
 * This ensures that navigating away and back restores the previous selection.
 * 
 * Usage:
 * const { selectedCourse, setSelectedCourse } = useSelectionPersistence('course');
 */

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

type SelectionKey = 'course' | 'chapter' | 'lesson' | 'student' | 'group' | 'exam';

const PARAM_KEYS: Record<SelectionKey, string> = {
  course: 'c',
  chapter: 'ch',
  lesson: 'l',
  student: 's',
  group: 'g',
  exam: 'e',
};

/**
 * Persist a single selection to URL
 */
export function useSelectionPersistence(key: SelectionKey, defaultValue: string = '') {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramKey = PARAM_KEYS[key];

  const value = useMemo(() => {
    return searchParams.get(paramKey) || defaultValue;
  }, [searchParams, paramKey, defaultValue]);

  const setValue = useCallback((newValue: string) => {
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      if (newValue && newValue !== defaultValue) {
        params.set(paramKey, newValue);
      } else {
        params.delete(paramKey);
      }
      return params;
    }, { replace: true });
  }, [setSearchParams, paramKey, defaultValue]);

  return { value, setValue };
}

/**
 * Persist multiple selections to URL at once
 */
export function useMultiSelectionPersistence<T extends Record<string, string>>(
  keys: SelectionKey[],
  defaults: Record<SelectionKey, string> = {} as any
) {
  const [searchParams, setSearchParams] = useSearchParams();

  const values = useMemo(() => {
    const result: Record<SelectionKey, string> = {} as any;
    keys.forEach(key => {
      result[key] = searchParams.get(PARAM_KEYS[key]) || defaults[key] || '';
    });
    return result as T;
  }, [searchParams, keys, defaults]);

  const setValue = useCallback((key: SelectionKey, newValue: string) => {
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      const paramKey = PARAM_KEYS[key];
      const defaultVal = defaults[key] || '';
      
      if (newValue && newValue !== defaultVal) {
        params.set(paramKey, newValue);
      } else {
        params.delete(paramKey);
      }
      return params;
    }, { replace: true });
  }, [setSearchParams, defaults]);

  const setValues = useCallback((newValues: Partial<Record<SelectionKey, string>>) => {
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      Object.entries(newValues).forEach(([key, value]) => {
        const paramKey = PARAM_KEYS[key as SelectionKey];
        const defaultVal = defaults[key as SelectionKey] || '';
        
        if (value && value !== defaultVal) {
          params.set(paramKey, value);
        } else {
          params.delete(paramKey);
        }
      });
      return params;
    }, { replace: true });
  }, [setSearchParams, defaults]);

  const clearAll = useCallback(() => {
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      keys.forEach(key => params.delete(PARAM_KEYS[key]));
      return params;
    }, { replace: true });
  }, [setSearchParams, keys]);

  return { values, setValue, setValues, clearAll };
}
