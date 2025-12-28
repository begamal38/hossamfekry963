import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type AppRole = 'admin' | 'assistant_teacher' | 'student';

export const useUserRole = () => {
  const { user, session, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  // One-shot retry for the common "just logged in" race where the first role query can fail.
  const retryCountRef = useRef(0);

  const fetchRoles = useCallback(async () => {
    // Don’t query roles until auth is fully initialized.
    if (authLoading) return;

    setLoading(true);

    if (!user || !session) {
      retryCountRef.current = 0;
      setRoles([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) throw error;

      retryCountRef.current = 0;
      setRoles((data || []).map((r) => r.role as AppRole));
    } catch (error) {
      // If the first request fails right after login, retry once after a short delay.
      if (retryCountRef.current < 1) {
        retryCountRef.current += 1;
        window.setTimeout(() => {
          fetchRoles();
        }, 600);
      } else {
        console.error('Error fetching roles:', error);
        setRoles([]);
      }
    } finally {
      setLoading(false);
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
    hasRole,
    isAdmin,
    isAssistantTeacher,
    isStudent,
    canAccessDashboard,
    refreshRoles: fetchRoles,
  };
};
