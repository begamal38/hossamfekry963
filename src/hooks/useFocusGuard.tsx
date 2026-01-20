/**
 * Focus Mode Guard Hook
 * 
 * CRITICAL: Prevents focus tracking for inactive enrollments.
 * Focus data must ONLY exist for active enrollments.
 * 
 * ARCHITECTURE RULES:
 * - Hard guard: if enrollment is not active, focus mode is disabled
 * - No analytics corruption from suspended/expired enrollments
 * - Free lessons always allow focus (no enrollment required)
 */

import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { useUserRole } from './useUserRole';

export type EnrollmentStatus = 'active' | 'suspended' | 'expired' | 'pending' | 'cancelled' | null;

export interface FocusGuardResult {
  /** Whether focus mode can be activated */
  canActivateFocus: boolean;
  /** Whether focus sessions should be persisted to database */
  canPersistFocus: boolean;
  /** Reason why focus is blocked (for debugging/logging) */
  blockReason: string | null;
  /** Whether the user has any form of access to content */
  hasContentAccess: boolean;
}

interface UseFocusGuardParams {
  enrollmentStatus: EnrollmentStatus;
  isFreeLessonOrCourse: boolean;
  isLessonCompleted?: boolean;
}

/**
 * Determines if focus mode can be activated and persisted.
 * 
 * RULES:
 * 1. Staff (admin/assistant) → always allowed
 * 2. Free content → always allowed
 * 3. Active enrollment → allowed
 * 4. Suspended + completed lesson → view-only (no focus tracking)
 * 5. All other cases → blocked
 */
export const useFocusGuard = ({
  enrollmentStatus,
  isFreeLessonOrCourse,
  isLessonCompleted = false,
}: UseFocusGuardParams): FocusGuardResult => {
  const { user } = useAuth();
  const { isAdmin, isAssistantTeacher, loading: rolesLoading } = useUserRole();
  
  return useMemo(() => {
    // Not logged in → visitors can view free content but no focus tracking
    if (!user) {
      return {
        canActivateFocus: false,
        canPersistFocus: false,
        blockReason: 'not_authenticated',
        hasContentAccess: isFreeLessonOrCourse,
      };
    }

    // Still loading roles → block focus but allow content viewing
    if (rolesLoading) {
      return {
        canActivateFocus: false,
        canPersistFocus: false,
        blockReason: 'roles_loading',
        hasContentAccess: true,
      };
    }

    // Staff always has full access
    const isStaff = isAdmin() || isAssistantTeacher();
    if (isStaff) {
      return {
        canActivateFocus: true,
        canPersistFocus: true,
        blockReason: null,
        hasContentAccess: true,
      };
    }

    // Free content always allows focus tracking
    if (isFreeLessonOrCourse) {
      return {
        canActivateFocus: true,
        canPersistFocus: true,
        blockReason: null,
        hasContentAccess: true,
      };
    }

    // Check enrollment status
    switch (enrollmentStatus) {
      case 'active':
        // Active enrollment → full access
        return {
          canActivateFocus: true,
          canPersistFocus: true,
          blockReason: null,
          hasContentAccess: true,
        };

      case 'suspended':
        // Suspended → can view completed lessons but NO new focus tracking
        // This prevents corrupting analytics with suspended user activity
        return {
          canActivateFocus: false,
          canPersistFocus: false,
          blockReason: 'enrollment_suspended',
          hasContentAccess: isLessonCompleted,
        };

      case 'expired':
        // Expired → no access at all
        return {
          canActivateFocus: false,
          canPersistFocus: false,
          blockReason: 'enrollment_expired',
          hasContentAccess: false,
        };

      case 'pending':
        // Pending → waiting for payment confirmation
        return {
          canActivateFocus: false,
          canPersistFocus: false,
          blockReason: 'enrollment_pending',
          hasContentAccess: false,
        };

      case 'cancelled':
        // Cancelled → no access
        return {
          canActivateFocus: false,
          canPersistFocus: false,
          blockReason: 'enrollment_cancelled',
          hasContentAccess: false,
        };

      case null:
        // Not enrolled at all
        return {
          canActivateFocus: false,
          canPersistFocus: false,
          blockReason: 'not_enrolled',
          hasContentAccess: false,
        };

      default:
        // Unknown status → block for safety
        return {
          canActivateFocus: false,
          canPersistFocus: false,
          blockReason: 'unknown_enrollment_status',
          hasContentAccess: false,
        };
    }
  }, [
    user,
    rolesLoading,
    isAdmin,
    isAssistantTeacher,
    enrollmentStatus,
    isFreeLessonOrCourse,
    isLessonCompleted,
  ]);
};

/**
 * Simple utility to check if focus should be blocked
 */
export const shouldBlockFocus = (
  enrollmentStatus: EnrollmentStatus,
  isFreeLessonOrCourse: boolean,
  isStaff: boolean
): boolean => {
  if (isStaff) return false;
  if (isFreeLessonOrCourse) return false;
  return enrollmentStatus !== 'active';
};
