/**
 * Profile Completion Logger
 * 
 * Internal debug logging for profile completion attempts.
 * Logs are NOT visible to students - admin/assistant only.
 * 
 * Used for diagnosing edge cases and failed completions.
 */

import { supabase } from '@/integrations/supabase/client';

export interface CompletionLogPayload {
  attendance_mode?: string | null;
  grade?: string | null;
  language_track?: string | null;
  center_group_id?: string | null;
  full_name?: string | null;
  phone?: string | null;
  governorate?: string | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings?: string[];
}

export type WriteResult = 'success' | 'failed' | 'rollback';

interface LogEntry {
  user_id: string;
  attempted_payload: CompletionLogPayload;
  validation_result: ValidationResult;
  write_result: WriteResult;
  failure_reason?: string;
  failure_details?: Record<string, unknown>;
}

/**
 * Log a profile completion attempt.
 * Fire-and-forget - does not throw on failure.
 */
export async function logProfileCompletionAttempt(entry: LogEntry): Promise<void> {
  try {
    // Use raw SQL-like insert to avoid type issues with jsonb
    const { error } = await supabase
      .from('profile_completion_logs')
      .insert({
        user_id: entry.user_id,
        attempted_payload: entry.attempted_payload,
        validation_result: entry.validation_result,
        write_result: entry.write_result,
        failure_reason: entry.failure_reason || null,
        failure_details: entry.failure_details || null,
      } as any); // Type assertion needed for dynamic jsonb columns
    
    if (error) {
      // Log to console but don't throw - this is non-critical
      console.warn('[ProfileCompletionLogger] Failed to write log:', error);
    }
  } catch (err) {
    // Silently fail - logging should never break the main flow
    console.warn('[ProfileCompletionLogger] Exception:', err);
  }
}

/**
 * Create a quick failure log.
 * Convenience method for common failure scenarios.
 */
export function logCompletionFailure(
  userId: string,
  payload: CompletionLogPayload,
  reason: string,
  details?: Record<string, unknown>
): void {
  logProfileCompletionAttempt({
    user_id: userId,
    attempted_payload: payload,
    validation_result: { isValid: false, errors: { _reason: reason } },
    write_result: 'failed',
    failure_reason: reason,
    failure_details: details,
  });
}

/**
 * Create a rollback log.
 * Used when group membership fails after profile update.
 */
export function logCompletionRollback(
  userId: string,
  payload: CompletionLogPayload,
  reason: string,
  details?: Record<string, unknown>
): void {
  logProfileCompletionAttempt({
    user_id: userId,
    attempted_payload: payload,
    validation_result: { isValid: true, errors: {} },
    write_result: 'rollback',
    failure_reason: reason,
    failure_details: details,
  });
}

/**
 * Create a success log.
 */
export function logCompletionSuccess(
  userId: string,
  payload: CompletionLogPayload
): void {
  logProfileCompletionAttempt({
    user_id: userId,
    attempted_payload: payload,
    validation_result: { isValid: true, errors: {} },
    write_result: 'success',
  });
}
