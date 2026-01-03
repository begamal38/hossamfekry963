import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ className }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      
      // Subscribe to new notifications
      const channel = supabase
        .channel('notifications-count')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
          },
          () => {
            fetchUnreadCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    if (!user) return;

    try {
      // Fetch user's profile to get grade and attendance_mode
      const { data: profile } = await supabase
        .from('profiles')
        .select('grade, attendance_mode')
        .eq('user_id', user.id)
        .maybeSingle();

      // Fetch user's course enrollments
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('course_id')
        .eq('user_id', user.id)
        .eq('status', 'active');

      const enrolledCourseIds = (enrollments || []).map(e => e.course_id);

      // Get all notifications
      const { data: notifications, error: notifError } = await supabase
        .from('notifications')
        .select('id, target_type, target_id, target_value, course_id');

      if (notifError) throw notifError;

      // Filter notifications based on targeting
      const relevantNotifications = (notifications || []).filter(n => {
        if (n.target_type === 'user') return n.target_id === user.id;
        if (n.target_type === 'all') return true;
        if (n.target_type === 'course' && n.course_id) return enrolledCourseIds.includes(n.course_id);
        if (n.target_type === 'lesson' && n.course_id) return enrolledCourseIds.includes(n.course_id);
        if (n.target_type === 'grade' && n.target_value) return profile?.grade === n.target_value;
        if (n.target_type === 'attendance_mode' && n.target_value) return profile?.attendance_mode === n.target_value;
        return false;
      });

      // Get user's read notifications
      const { data: reads, error: readsError } = await supabase
        .from('notification_reads')
        .select('notification_id')
        .eq('user_id', user.id);

      if (readsError) throw readsError;

      const readIds = new Set((reads || []).map(r => r.notification_id));
      const unread = relevantNotifications.filter(n => !readIds.has(n.id)).length;

      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  if (!user) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("relative", className)}
      onClick={() => navigate('/notifications')}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Button>
  );
};
