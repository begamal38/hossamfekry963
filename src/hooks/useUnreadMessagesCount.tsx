import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';

export function useUnreadMessagesCount() {
  const { user } = useAuth();
  const { isStudent, isAssistantTeacher } = useUserRole();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCount = useCallback(async () => {
    if (!user) {
      setCount(0);
      setLoading(false);
      return;
    }

    try {
      if (isStudent()) {
        // Student: get conversations where they're the student
        const { data: conversations } = await supabase
          .from('conversations')
          .select('unread_count_student')
          .eq('student_id', user.id);

        const total = (conversations || []).reduce(
          (sum, c) => sum + (c.unread_count_student || 0),
          0
        );
        setCount(total);
      } else if (isAssistantTeacher()) {
        // Assistant teacher: get conversations where they're assigned
        const { data: conversations } = await supabase
          .from('conversations')
          .select('unread_count_assistant')
          .eq('assistant_teacher_id', user.id);

        const total = (conversations || []).reduce(
          (sum, c) => sum + (c.unread_count_assistant || 0),
          0
        );
        setCount(total);
      }
    } catch (error) {
      console.error('Error fetching unread messages count:', error);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [user, isStudent, isAssistantTeacher]);

  useEffect(() => {
    fetchCount();

    // Subscribe to real-time updates
    if (!user) return;

    const channel = supabase
      .channel('unread-messages-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          fetchCount();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCount, user]);

  return { count, loading, refetch: fetchCount };
}
