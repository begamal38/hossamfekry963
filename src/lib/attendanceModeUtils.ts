/**
 * Attendance Mode Normalization Utilities
 * 
 * The database includes attendance_mode enum: online | center | hybrid
 * The platform no longer supports "hybrid" in the UI.
 * 
 * This utility normalizes legacy "hybrid" values to "online" at the UI layer
 * WITHOUT changing database schema or existing data.
 */

// Valid UI attendance modes (hybrid is NOT user-facing)
export type UIAttendanceMode = 'online' | 'center';

// Raw database attendance mode (includes legacy hybrid)
export type RawAttendanceMode = 'online' | 'center' | 'hybrid' | null;

/**
 * Normalize attendance mode for UI display and logic.
 * Treats "hybrid" as "online" silently.
 * 
 * @param mode - Raw attendance mode from database
 * @returns Normalized UI attendance mode or null
 */
export function normalizeAttendanceMode(mode: RawAttendanceMode): UIAttendanceMode | null {
  if (!mode) return null;
  
  // Legacy hybrid → treat as online
  if (mode === 'hybrid') return 'online';
  
  return mode;
}

/**
 * Check if attendance mode represents a center student.
 * Only 'center' returns true. hybrid and online both return false.
 */
export function isCenterStudent(mode: RawAttendanceMode): boolean {
  return mode === 'center';
}

/**
 * Check if attendance mode represents an online student.
 * Both 'online' and legacy 'hybrid' return true.
 */
export function isOnlineStudent(mode: RawAttendanceMode): boolean {
  return mode === 'online' || mode === 'hybrid';
}

/**
 * Get display label for attendance mode.
 * Normalizes hybrid → online in displayed text.
 */
export function getAttendanceModeLabel(mode: RawAttendanceMode, isArabic: boolean): string {
  const normalized = normalizeAttendanceMode(mode);
  
  if (!normalized) {
    return isArabic ? 'غير محدد' : 'Not Set';
  }
  
  const labels: Record<UIAttendanceMode, { ar: string; en: string }> = {
    online: { ar: 'أونلاين', en: 'Online' },
    center: { ar: 'سنتر', en: 'Center' },
  };
  
  return isArabic ? labels[normalized].ar : labels[normalized].en;
}

/**
 * Valid modes for UI selection (excludes hybrid).
 */
export const UI_ATTENDANCE_MODES: UIAttendanceMode[] = ['online', 'center'];

/**
 * Get attendance mode options for filters/selectors.
 * Only includes online and center (no hybrid).
 */
export function getAttendanceModeOptions(isArabic: boolean): Array<{ value: UIAttendanceMode; label: string }> {
  return [
    { value: 'online', label: isArabic ? 'أونلاين' : 'Online' },
    { value: 'center', label: isArabic ? 'سنتر' : 'Center' },
  ];
}

/**
 * Normalize attendance mode for database update.
 * Converts hybrid → online when saving.
 */
export function normalizeForSave(mode: RawAttendanceMode): UIAttendanceMode | null {
  if (!mode) return null;
  if (mode === 'hybrid') return 'online';
  return mode;
}

/**
 * Check if a mode requires normalization on save.
 */
export function requiresNormalization(mode: RawAttendanceMode): boolean {
  return mode === 'hybrid';
}
