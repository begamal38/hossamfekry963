import React, { useState, useEffect, forwardRef, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { safeFilterMatch } from '@/lib/silentAutoFix';

interface NotificationBellProps {
  className?: string;
}

export const NotificationBell = forwardRef<HTMLButtonElement, NotificationBellProps>(({ className }, ref) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Use ref to prevent multiple rapid fetches
  const fetchingRef = useRef(false);
  const lastFetchRef = useRef(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    
    // Debounce: skip if we fetched within last 2 seconds
    const now = Date.now();
    if (fetchingRef.current || now - lastFetchRef.current < 2000) {
      return;
    }
    
    fetchingRef.current = true;
    lastFetchRef.current = now;

    try {
      // Get user creation date - only count notifications created AFTER user joined
      const userCreatedAt = user.created_at;

      // Fetch user's profile to get grade, attendance_mode, and creation date
      const { data: profile } = await supabase
        .from('profiles')
        .select('grade, attendance_mode, created_at')
        .eq('user_id', user.id)
        .maybeSingle();

      // Use profile creation date if available, otherwise use auth user creation date
      const userJoinDate = profile?.created_at || userCreatedAt;

      // Fetch user's course enrollments
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('course_id')
        .eq('user_id', user.id)
        .eq('status', 'active');

      const enrolledCourseIds = (enrollments || []).map(e => e.course_id);

      // Get notifications created AFTER user joined
      const { data: notifications, error: notifError } = await supabase
        .from('notifications')
        .select('id, target_type, target_id, target_value, course_id')
        .gte('created_at', userJoinDate);

      if (notifError) throw notifError;

      // Filter notifications based on targeting - using safeFilterMatch for attendance_mode normalization
      const relevantNotifications = (notifications || []).filter(n => {
        if (n.target_type === 'user') return n.target_id === user.id;
        if (n.target_type === 'all') return true;
        if (n.target_type === 'course' && n.course_id) return enrolledCourseIds.includes(n.course_id);
        if (n.target_type === 'lesson' && n.course_id) return enrolledCourseIds.includes(n.course_id);
        if (n.target_type === 'grade' && n.target_value) return profile?.grade === n.target_value;
        // Use safeFilterMatch for attendance_mode to handle legacy 'hybrid' values
        if (n.target_type === 'attendance_mode' && n.target_value) {
          return safeFilterMatch(profile?.attendance_mode, n.target_value);
        }
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
    } finally {
      fetchingRef.current = false;
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      
      // Use unique channel name per user to prevent cross-session conflicts
      const channelName = `notifications-bell-${user.id}`;
      const channel = supabase
        .channel(channelName)
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
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notification_reads',
          },
          () => {
            // When user reads a notification, update count
            fetchUnreadCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, fetchUnreadCount]);

  if (!user) return null;

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn("relative transition-all duration-150 active:scale-[0.98]", className)}
      onClick={() => navigate('/notifications')}
    >
      <Bell className={cn("h-5 w-5 transition-colors", unreadCount > 0 && "text-primary")} />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Button>
  );
});

NotificationBell.displayName = 'NotificationBell';
