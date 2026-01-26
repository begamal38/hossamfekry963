/**
 * Silent Auto-Fix Layer
 * 
 * Ensures the system auto-recovers from legacy, invalid, or incomplete data
 * without errors, redirects, or UX interruption.
 * 
 * CORE PRINCIPLES:
 * - Never block the user due to system or legacy data issues
 * - Never show technical errors for recoverable cases
 * - Prefer auto-normalization over validation failure
 * - Fix data on read and on write, silently
 */

import { normalizeAttendanceMode, normalizeForSave, RawAttendanceMode, UIAttendanceMode } from './attendanceModeUtils';

// ══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ══════════════════════════════════════════════════════════════════════════

export interface ProfileData {
  full_name?: string | null;
  grade?: string | null;
  language_track?: string | null;
  academic_year?: string | null;
  attendance_mode?: RawAttendanceMode;
  governorate?: string | null;
  phone?: string | null;
  study_mode_confirmed?: boolean | null;
}

export interface NormalizedProfile {
  full_name: string | null;
  grade: string | null;
  language_track: string | null;
  attendance_mode: UIAttendanceMode | null;
  governorate: string | null;
  phone: string | null;
  isLegacyData: boolean;
  requiresReconfirmation: boolean;
}

// ══════════════════════════════════════════════════════════════════════════
// GRADE NORMALIZATION
// ══════════════════════════════════════════════════════════════════════════

const VALID_GRADES = ['second_secondary', 'third_secondary'] as const;
const VALID_TRACKS = ['arabic', 'languages'] as const;

type ValidGrade = typeof VALID_GRADES[number];
type ValidTrack = typeof VALID_TRACKS[number];

/**
 * Normalize grade value from various legacy formats
 * Handles: second_arabic, third_languages, second, third, etc.
 */
export function normalizeGrade(grade: string | null | undefined): ValidGrade | null {
  if (!grade) return null;
  
  const normalized = grade.toLowerCase().trim();
  
  // Already valid
  if (VALID_GRADES.includes(normalized as ValidGrade)) {
    return normalized as ValidGrade;
  }
  
  // Legacy combined formats
  if (normalized.startsWith('second')) return 'second_secondary';
  if (normalized.startsWith('third')) return 'third_secondary';
  
  // Numeric or text alternatives
  if (normalized === '2' || normalized === 'two' || normalized === 'ثانية') {
    return 'second_secondary';
  }
  if (normalized === '3' || normalized === 'three' || normalized === 'ثالثة') {
    return 'third_secondary';
  }
  
  return null;
}

/**
 * Normalize language track from various formats
 */
export function normalizeTrack(track: string | null | undefined): ValidTrack | null {
  if (!track) return null;
  
  const normalized = track.toLowerCase().trim();
  
  // Already valid
  if (VALID_TRACKS.includes(normalized as ValidTrack)) {
    return normalized as ValidTrack;
  }
  
  // Common alternatives
  if (normalized === 'ar' || normalized === 'عربي') return 'arabic';
  if (normalized === 'en' || normalized === 'lang' || normalized === 'لغات') return 'languages';
  
  return null;
}

/**
 * Extract track from combined grade format
 * e.g., "second_arabic" → "arabic"
 */
export function extractTrackFromGrade(grade: string | null | undefined): ValidTrack | null {
  if (!grade) return null;
  
  const normalized = grade.toLowerCase().trim();
  
  if (normalized.endsWith('_arabic') || normalized.endsWith('arabic')) return 'arabic';
  if (normalized.endsWith('_languages') || normalized.endsWith('languages')) return 'languages';
  
  return null;
}

// ══════════════════════════════════════════════════════════════════════════
// PROFILE NORMALIZATION (READ)
// ══════════════════════════════════════════════════════════════════════════

/**
 * Normalize profile data on read - silently fixes legacy values
 * Returns normalized data with flags indicating what was fixed
 */
export function normalizeProfileOnRead(profile: ProfileData): NormalizedProfile {
  let isLegacyData = false;
  
  // Grade normalization
  let normalizedGrade = normalizeGrade(profile.grade);
  if (!normalizedGrade && profile.academic_year) {
    normalizedGrade = normalizeGrade(profile.academic_year);
  }
  
  // Track normalization - try explicit track first, then extract from combined grade
  let normalizedTrack = normalizeTrack(profile.language_track);
  if (!normalizedTrack && profile.grade) {
    normalizedTrack = extractTrackFromGrade(profile.grade);
    if (normalizedTrack) isLegacyData = true;
  }
  
  // Attendance mode normalization
  const normalizedMode = normalizeAttendanceMode(profile.attendance_mode);
  if (profile.attendance_mode === 'hybrid') {
    isLegacyData = true;
  }
  
  // Determine if reconfirmation is needed
  const requiresReconfirmation = 
    !normalizedMode || // No mode set
    profile.attendance_mode === 'hybrid' || // Legacy hybrid
    (profile.attendance_mode === 'online' && profile.study_mode_confirmed !== true); // Unconfirmed online
  
  return {
    full_name: profile.full_name?.trim() || null,
    grade: normalizedGrade,
    language_track: normalizedTrack,
    attendance_mode: normalizedMode,
    governorate: profile.governorate?.trim() || null,
    phone: profile.phone?.trim() || null,
    isLegacyData,
    requiresReconfirmation,
  };
}

// ══════════════════════════════════════════════════════════════════════════
// PROFILE NORMALIZATION (WRITE)
// ══════════════════════════════════════════════════════════════════════════

interface ProfileSaveData {
  grade?: string | null;
  language_track?: string | null;
  attendance_mode?: RawAttendanceMode;
  full_name?: string | null;
  phone?: string | null;
  governorate?: string | null;
}

interface NormalizedSaveData {
  grade?: string | null;
  language_track?: string | null;
  attendance_mode?: UIAttendanceMode | null;
  full_name?: string | null;
  phone?: string | null;
  governorate?: string | null;
}

/**
 * Normalize profile data before saving - ensures only valid values are written
 */
export function normalizeProfileForSave(data: ProfileSaveData): NormalizedSaveData {
  const result: NormalizedSaveData = {};
  
  // Normalize each field silently
  if (data.grade !== undefined) {
    result.grade = normalizeGrade(data.grade);
  }
  
  if (data.language_track !== undefined) {
    result.language_track = normalizeTrack(data.language_track);
  }
  
  if (data.attendance_mode !== undefined) {
    result.attendance_mode = normalizeForSave(data.attendance_mode);
  }
  
  if (data.full_name !== undefined) {
    result.full_name = data.full_name?.trim() || null;
  }
  
  if (data.phone !== undefined) {
    result.phone = normalizePhone(data.phone);
  }
  
  if (data.governorate !== undefined) {
    result.governorate = data.governorate?.trim() || null;
  }
  
  return result;
}

// ══════════════════════════════════════════════════════════════════════════
// PHONE NORMALIZATION
// ══════════════════════════════════════════════════════════════════════════

/**
 * Normalize Egyptian phone numbers
 * Handles: +20..., 0020..., 01..., etc.
 */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');
  
  // Handle international format
  if (digits.startsWith('20') && digits.length === 12) {
    digits = '0' + digits.slice(2);
  }
  if (digits.startsWith('002') && digits.length === 14) {
    digits = digits.slice(3);
  }
  
  // Validate Egyptian mobile format
  if (/^01[0125][0-9]{8}$/.test(digits)) {
    return digits;
  }
  
  // Return as-is if it doesn't match - don't block
  return phone.trim() || null;
}

// ══════════════════════════════════════════════════════════════════════════
// NULL-SAFE ACCESSORS
// ══════════════════════════════════════════════════════════════════════════

/**
 * Safely get a value with fallback - never throws
 */
export function safeGet<T>(value: T | null | undefined, fallback: T): T {
  return value ?? fallback;
}

/**
 * Safely get string value - never returns undefined
 */
export function safeString(value: string | null | undefined): string {
  return value?.trim() || '';
}

/**
 * Safely get boolean value - defaults to false
 */
export function safeBool(value: boolean | null | undefined): boolean {
  return value === true;
}

/**
 * Safely get array - defaults to empty array
 */
export function safeArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

// ══════════════════════════════════════════════════════════════════════════
// RELATIONSHIP NORMALIZATION
// ══════════════════════════════════════════════════════════════════════════

/**
 * Check if a relationship exists (foreign key is valid)
 * Returns true for null/undefined (allows navigation) 
 * Returns false only for explicitly invalid references
 */
export function isValidRelation(value: string | null | undefined): boolean {
  if (!value) return true; // Null is valid - allows navigation
  
  // Check if it looks like a UUID
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(value);
}

/**
 * Normalize enrollment status - handles legacy/unknown values
 */
export function normalizeEnrollmentStatus(status: string | null | undefined): string {
  if (!status) return 'pending';
  
  const validStatuses = ['active', 'pending', 'suspended', 'expired', 'cancelled'];
  const normalized = status.toLowerCase().trim();
  
  if (validStatuses.includes(normalized)) {
    return normalized;
  }
  
  // Map legacy values
  if (normalized === 'inactive' || normalized === 'disabled') return 'suspended';
  if (normalized === 'completed') return 'active';
  
  return 'pending'; // Safe default
}

// ══════════════════════════════════════════════════════════════════════════
// ERROR RECOVERY
// ══════════════════════════════════════════════════════════════════════════

/**
 * Wrap async operation with silent error recovery
 * Returns null/fallback on error instead of throwing
 */
export async function silentTry<T>(
  operation: () => Promise<T>,
  fallback: T,
  onError?: (error: unknown) => void
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (onError) {
      onError(error);
    } else {
      console.warn('Silent auto-fix: operation failed', error);
    }
    return fallback;
  }
}

/**
 * Sync version of silentTry
 */
export function silentTrySync<T>(
  operation: () => T,
  fallback: T,
  onError?: (error: unknown) => void
): T {
  try {
    return operation();
  } catch (error) {
    if (onError) {
      onError(error);
    } else {
      console.warn('Silent auto-fix: sync operation failed', error);
    }
    return fallback;
  }
}

// ══════════════════════════════════════════════════════════════════════════
// FILTER NORMALIZATION
// ══════════════════════════════════════════════════════════════════════════

/**
 * Normalize filter value - ensures consistent comparison
 */
export function normalizeFilterValue(value: string | null | undefined): string | null {
  if (!value || value === 'all' || value === '') return null;
  return value.toLowerCase().trim();
}

/**
 * Safe filter match - handles null, legacy values, and normalization
 */
export function safeFilterMatch(
  recordValue: string | null | undefined,
  filterValue: string | null | undefined
): boolean {
  // No filter = match all
  if (!filterValue || filterValue === 'all') return true;
  
  // No record value = no match (unless filter is 'null' or 'empty')
  if (!recordValue) {
    return filterValue === 'null' || filterValue === 'empty' || filterValue === 'none';
  }
  
  // Normalize both and compare
  const normalizedRecord = recordValue.toLowerCase().trim();
  const normalizedFilter = filterValue.toLowerCase().trim();
  
  // Handle attendance mode normalization
  if (normalizedFilter === 'online') {
    return normalizedRecord === 'online' || normalizedRecord === 'hybrid';
  }
  
  return normalizedRecord === normalizedFilter;
}

// ══════════════════════════════════════════════════════════════════════════
// EXPORT CONSOLIDATED UTILITIES
// ══════════════════════════════════════════════════════════════════════════

export const AutoFix = {
  // Grade/Track
  normalizeGrade,
  normalizeTrack,
  extractTrackFromGrade,
  
  // Profile
  normalizeProfileOnRead,
  normalizeProfileForSave,
  
  // Phone
  normalizePhone,
  
  // Safe accessors
  safeGet,
  safeString,
  safeBool,
  safeArray,
  
  // Relationships
  isValidRelation,
  normalizeEnrollmentStatus,
  
  // Error recovery
  silentTry,
  silentTrySync,
  
  // Filters
  normalizeFilterValue,
  safeFilterMatch,
};

export default AutoFix;
