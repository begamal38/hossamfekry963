import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type AppRole = 'admin' | 'assistant_teacher' | 'student';

// Simple in-memory cache to avoid re-fetching roles on every route change (prevents flashing loaders).
let roleCache: { userId: string; roles: AppRole[]; fetchedAt: number } | null = null;
const ROLE_CACHE_TTL_MS = 60 * 1000; // 1 minute - faster refresh for role changes

// Export cache clear function for sign out
export const clearRoleCache = () => {
  roleCache = null;
};

export const useUserRole = () => {
  const { user, session, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

  // One-shot retry for the common "just logged in" race where the first role query can fail.
  const retryCountRef = useRef(0);

  const fetchRoles = useCallback(async () => {
    // Don't query roles until auth is fully initialized.
    if (authLoading) return;

    if (!user || !session) {
      roleCache = null;
      retryCountRef.current = 0;
      setRoles([]);
      setLoading(false);
      setHasAttemptedFetch(true);
      return;
    }

    const cachedForUser = roleCache?.userId === user.id ? roleCache : null;
    const cacheFresh = cachedForUser && Date.now() - cachedForUser.fetchedAt < ROLE_CACHE_TTL_MS;

    // If we have fresh cached roles, use them immediately and don't block UI.
    if (cacheFresh) {
      setRoles(cachedForUser.roles);
      setLoading(false);
      setHasAttemptedFetch(true);
      return;
    }

    // If we have cached roles but they're stale, don't show a big loader; refresh quietly.
    const silentRefresh = !!cachedForUser && cachedForUser.roles.length > 0;
    if (!silentRefresh) setLoading(true);

    let keepLoadingForRetry = false;

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) throw error;

      retryCountRef.current = 0;
      const nextRoles = (data || []).map((r) => r.role as AppRole);
      
      // Update cache FIRST to ensure consistency
      roleCache = { userId: user.id, roles: nextRoles, fetchedAt: Date.now() };
      // Then update state
      setRoles(nextRoles);
    } catch (error) {
      // If the first request fails right after login, retry once after a short delay.
      if (retryCountRef.current < 1) {
        retryCountRef.current += 1;
        keepLoadingForRetry = true;
        window.setTimeout(() => {
          fetchRoles();
        }, 600);
      } else {
        console.warn('Role fetch failed (will treat as no roles).');
        setRoles([]);
        roleCache = { userId: user.id, roles: [], fetchedAt: Date.now() };
      }
    } finally {
      if (!keepLoadingForRetry) {
        setLoading(false);
        setHasAttemptedFetch(true);
      }
    }
  }, [authLoading, session, user]);

  // Initial fetch
  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Subscribe to role changes in realtime
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user-roles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Clear cache and refetch when role changes
          roleCache = null;
          fetchRoles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchRoles]);

  const roleSet = useMemo(() => new Set(roles), [roles]);

  const hasRole = useCallback((role: AppRole) => roleSet.has(role), [roleSet]);
  const isAdmin = useCallback(() => hasRole('admin'), [hasRole]);
  const isAssistantTeacher = useCallback(() => hasRole('assistant_teacher'), [hasRole]);
  const isStudent = useCallback(() => hasRole('student'), [hasRole]);
  
  // UNIFIED: Admin and Assistant Teacher have IDENTICAL permissions
  // This is the single source of truth for staff access checks
  const isStaff = useCallback(() => isAdmin() || isAssistantTeacher(), [isAdmin, isAssistantTeacher]);
  const canAccessDashboard = useCallback(() => isStaff(), [isStaff]);

  return {
    roles,
    loading,
    hasAttemptedFetch,
    hasRole,
    isAdmin,
    isAssistantTeacher,
    isStudent,
    isStaff, // NEW: Unified staff check - use this instead of isAdmin() || isAssistantTeacher()
    canAccessDashboard,
    refreshRoles: fetchRoles,
  };
};
