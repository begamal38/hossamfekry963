import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, UserPlus, BookOpen, GraduationCap, FileCheck, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';

const EVENT_ICONS: Record<string, React.ElementType> = {
  new_student: UserPlus,
  profile_complete: ClipboardCheck,
  enrollment: BookOpen,
  lesson_complete: FileCheck,
  exam_start: GraduationCap,
  exam_complete: GraduationCap,
};

const EVENT_COLORS: Record<string, string> = {
  new_student: 'bg-blue-500/15 text-blue-600',
  profile_complete: 'bg-green-500/15 text-green-600',
  enrollment: 'bg-purple-500/15 text-purple-600',
  lesson_complete: 'bg-amber-500/15 text-amber-600',
  exam_start: 'bg-orange-500/15 text-orange-600',
  exam_complete: 'bg-emerald-500/15 text-emerald-600',
};

interface AssistantNotification {
  id: string;
  event_type: string;
  message_ar: string;
  student_name: string | null;
  is_read: boolean;
  created_at: string;
}

export const AssistantNotificationBell: React.FC<{ className?: string }> = ({ className }) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [notifications, setNotifications] = useState<AssistantNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('assistant_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      setNotifications((data || []) as AssistantNotification[]);
      setUnreadCount((data || []).filter((n: any) => !n.is_read).length);
    } catch (err) {
      console.error('[AssistantNotificationBell] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel('assistant-notifications-bell')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'assistant_notifications',
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const markAllRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      if (unreadIds.length === 0) return;

      await supabase
        .from('assistant_notifications')
        .update({ is_read: true })
        .in('id', unreadIds);

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('[AssistantNotificationBell] Mark read error:', err);
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      // Mark all as read when opening
      markAllRead();
    }
  };

  const timeAgo = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), {
        addSuffix: true,
        locale: isArabic ? ar : undefined,
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className={cn("relative transition-all duration-150 active:scale-[0.98]", className)}
        onClick={handleToggle}
      >
        <Bell className={cn("h-5 w-5 transition-colors", unreadCount > 0 && "text-primary")} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className={cn(
          "fixed sm:absolute top-[64px] sm:top-full sm:mt-2",
          "inset-x-2 sm:inset-x-auto sm:w-96",
          "max-h-[60vh] bg-popover border border-border rounded-xl shadow-xl overflow-hidden z-[300]",
          "origin-top-right animate-fade-in",
          isArabic ? "sm:left-0" : "sm:right-0"
        )}>
          {/* Header */}
          <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/30">
            <h3 className="font-semibold text-sm">
              {isArabic ? 'إشعارات النشاط' : 'Activity Notifications'}
            </h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} {isArabic ? 'جديد' : 'new'}
              </Badge>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-[60vh]">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                {isArabic ? 'لا توجد إشعارات بعد' : 'No notifications yet'}
              </div>
            ) : (
              notifications.map((notif) => {
                const Icon = EVENT_ICONS[notif.event_type] || Bell;
                const colorClass = EVENT_COLORS[notif.event_type] || 'bg-muted text-muted-foreground';

                return (
                  <div
                    key={notif.id}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 border-b border-border/50 transition-colors",
                      !notif.is_read && "bg-primary/5"
                    )}
                  >
                    {/* Avatar/Icon */}
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", colorClass)}>
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm leading-snug",
                        !notif.is_read ? "font-medium text-foreground" : "text-muted-foreground"
                      )}>
                        {notif.message_ar}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {timeAgo(notif.created_at)}
                      </p>
                    </div>

                    {/* Unread dot */}
                    {!notif.is_read && (
                      <div className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
