import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type AppRole = 'admin' | 'assistant_teacher' | 'student';

// Simple in-memory cache to avoid re-fetching roles on every route change (prevents flashing loaders).
let roleCache: { userId: string; roles: AppRole[]; fetchedAt: number } | null = null;
const ROLE_CACHE_TTL_MS = 5 * 60 * 1000;

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
      setRoles(nextRoles);
      roleCache = { userId: user.id, roles: nextRoles, fetchedAt: Date.now() };
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

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const roleSet = useMemo(() => new Set(roles), [roles]);

  const hasRole = useCallback((role: AppRole) => roleSet.has(role), [roleSet]);
  const isAdmin = useCallback(() => hasRole('admin'), [hasRole]);
  const isAssistantTeacher = useCallback(() => hasRole('assistant_teacher'), [hasRole]);
  const isStudent = useCallback(() => hasRole('student'), [hasRole]);
  const canAccessDashboard = useCallback(() => isAdmin() || isAssistantTeacher(), [isAdmin, isAssistantTeacher]);

  return {
    roles,
    loading,
    hasAttemptedFetch,
    hasRole,
    isAdmin,
    isAssistantTeacher,
    isStudent,
    canAccessDashboard,
    refreshRoles: fetchRoles,
  };
};
