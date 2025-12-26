import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type AppRole = 'admin' | 'assistant_teacher' | 'student';

export const useUserRole = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      if (!user) {
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

        setRoles((data || []).map((r) => r.role as AppRole));
      } catch (error) {
        console.error('Error fetching roles:', error);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [user]);

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
  };
};
