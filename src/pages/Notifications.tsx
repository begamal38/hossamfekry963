import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  BookOpen, 
  Video, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Building,
  Globe,
  MessageSquare,
  ArrowLeft,
  Check,
  ChevronRight,
  X
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

type NotificationType = 
  | 'course_announcement'
  | 'lesson_available'
  | 'lesson_reminder'
  | 'exam_available'
  | 'exam_reminder'
  | 'exam_completed'
  | 'attendance_center'
  | 'attendance_online'
  | 'attendance_followup'
  | 'system_message';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  title_ar: string;
  message: string;
  message_ar: string;
  created_at: string;
  course_id: string | null;
  lesson_id: string | null;
  exam_id: string | null;
  isRead: boolean;
}

// Helper to derive action URL from notification data - returns null if no specific link
const getActionUrl = (notification: Notification): string | null => {
  // Lesson notifications
  if (notification.lesson_id) {
    return `/lessons/${notification.lesson_id}`;
  }
  
  // Exam notifications
  if (notification.exam_id) {
    return `/exam/${notification.exam_id}`;
  }
  
  // Course notifications
  if (notification.course_id) {
    return `/courses/${notification.course_id}`;
  }
  
  // No specific link - will open message modal
  return null;
};

// Check if notification has a specific action link
const hasActionLink = (notification: Notification): boolean => {
  return !!(notification.lesson_id || notification.exam_id || notification.course_id);
};

// Helper to get action label based on notification type
const getActionLabel = (type: NotificationType, isArabic: boolean): string => {
  switch (type) {
    case 'lesson_available':
    case 'lesson_reminder':
      return isArabic ? 'شاهد الحصة' : 'Watch Lesson';
    case 'exam_available':
    case 'exam_reminder':
      return isArabic ? 'ابدأ الامتحان' : 'Start Exam';
    case 'exam_completed':
      return isArabic ? 'شوف النتيجة' : 'View Results';
    case 'course_announcement':
      return isArabic ? 'افتح الكورس' : 'Open Course';
    case 'attendance_center':
    case 'attendance_online':
    case 'attendance_followup':
      return isArabic ? 'شوف التفاصيل' : 'View Details';
    default:
      return isArabic ? 'افتح' : 'Open';
  }
};

// Helper to detect if text is primarily Arabic
const isArabicText = (text: string): boolean => {
  const arabicPattern = /[\u0600-\u06FF]/;
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
  return arabicChars > latinChars;
};

// Helper to truncate message with line break support
const truncateMessage = (message: string, maxLines: number = 3): { text: string; isTruncated: boolean } => {
  const lines = message.split(/\n|\r\n/);
  if (lines.length <= maxLines) {
    const fullText = lines.join('\n');
    if (fullText.length <= 150) {
      return { text: fullText, isTruncated: false };
    }
    return { text: fullText.substring(0, 150) + '...', isTruncated: true };
  }
  return { text: lines.slice(0, maxLines).join('\n') + '...', isTruncated: true };
};

const NOTIFICATION_CONFIG: Record<NotificationType, {
  icon: typeof Bell;
  color: string;
  bgColor: string;
  labelEn: string;
  labelAr: string;
}> = {
  course_announcement: {
    icon: BookOpen,
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
    labelEn: 'Course',
    labelAr: 'كورس',
  },
  lesson_available: {
    icon: Video,
    color: 'text-green-600',
    bgColor: 'bg-green-500/10',
    labelEn: 'Lesson',
    labelAr: 'حصة',
  },
  lesson_reminder: {
    icon: Clock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
    labelEn: 'Reminder',
    labelAr: 'تذكير',
  },
  exam_available: {
    icon: FileText,
    color: 'text-purple-600',
    bgColor: 'bg-purple-500/10',
    labelEn: 'Exam',
    labelAr: 'امتحان',
  },
  exam_reminder: {
    icon: Clock,
    color: 'text-orange-600',
    bgColor: 'bg-orange-500/10',
    labelEn: 'Exam Reminder',
    labelAr: 'تذكير امتحان',
  },
  exam_completed: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-500/10',
    labelEn: 'Exam Done',
    labelAr: 'امتحان خلص',
  },
  attendance_center: {
    icon: Building,
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
    labelEn: 'Attendance',
    labelAr: 'حضور',
  },
  attendance_online: {
    icon: Globe,
    color: 'text-purple-600',
    bgColor: 'bg-purple-500/10',
    labelEn: 'Online',
    labelAr: 'أونلاين',
  },
  attendance_followup: {
    icon: Clock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
    labelEn: 'Follow-up',
    labelAr: 'متابعة',
  },
  system_message: {
    icon: MessageSquare,
    color: 'text-gray-600',
    bgColor: 'bg-gray-500/10',
    labelEn: 'System',
    labelAr: 'النظام',
  },
};

export default function Notifications() {
  const navigate = useNavigate();
  const { t, language, isRTL } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const isArabic = language === 'ar';

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    if (user) {
      fetchNotifications();
    }
  }, [user, authLoading]);

  const fetchNotifications = async () => {
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

      // Fetch notifications - we need to filter based on targeting
      const { data: notificationsData, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (notifError) throw notifError;

      // Filter notifications based on targeting
      const relevantNotifications = (notificationsData || []).filter(n => {
        // Direct user targeting - only show if targeted to this user
        if (n.target_type === 'user') {
          return n.target_id === user.id;
        }
        
        // All students
        if (n.target_type === 'all') {
          return true;
        }
        
        // Course targeting - show if user is enrolled
        if (n.target_type === 'course' && n.course_id) {
          return enrolledCourseIds.includes(n.course_id);
        }
        
        // Lesson targeting - show if user is enrolled in the course
        if (n.target_type === 'lesson' && n.course_id) {
          return enrolledCourseIds.includes(n.course_id);
        }
        
        // Grade targeting
        if (n.target_type === 'grade' && n.target_value) {
          return profile?.grade === n.target_value;
        }
        
        // Attendance mode targeting
        if (n.target_type === 'attendance_mode' && n.target_value) {
          return profile?.attendance_mode === n.target_value;
        }
        
        return false;
      });

      // Fetch user's read notifications
      const { data: readsData, error: readsError } = await supabase
        .from('notification_reads')
        .select('notification_id')
        .eq('user_id', user.id);

      if (readsError) throw readsError;

      const readIds = new Set((readsData || []).map(r => r.notification_id));

      // Map notifications with read status
      const mappedNotifications: Notification[] = relevantNotifications.map(n => ({
        ...n,
        type: n.type as NotificationType,
        isRead: readIds.has(n.id),
      }));

      setNotifications(mappedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('notification_reads')
        .insert({
          notification_id: notificationId,
          user_id: user.id,
        });

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    const unreadNotifications = notifications.filter(n => !n.isRead);
    if (unreadNotifications.length === 0) return;

    try {
      const inserts = unreadNotifications.map(n => ({
        notification_id: n.id,
        user_id: user.id,
      }));

      await supabase
        .from('notification_reads')
        .upsert(inserts, { onConflict: 'notification_id,user_id' });

      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return isArabic ? 'دلوقتي' : 'Just now';
    if (diffMins < 60) return isArabic ? `من ${diffMins} دقيقة` : `${diffMins}m ago`;
    if (diffHours < 24) return isArabic ? `من ${diffHours} ساعة` : `${diffHours}h ago`;
    if (diffDays < 7) return isArabic ? `من ${diffDays} يوم` : `${diffDays}d ago`;
    
    return date.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    const actionUrl = getActionUrl(notification);
    
    // If there's a specific link, navigate to it
    if (actionUrl) {
      navigate(actionUrl);
    } else {
      // Otherwise, open the message modal
      setSelectedNotification(notification);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-mobile-nav" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />

      <main className="container mx-auto px-4 py-8 pt-24 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className={cn("h-5 w-5", isRTL && "rotate-180")} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Bell className="h-6 w-6 text-primary" />
                {isArabic ? 'الإشعارات' : 'Notifications'}
              </h1>
              {unreadCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  {isArabic ? `${unreadCount} إشعار جديد` : `${unreadCount} unread`}
                </p>
              )}
            </div>
          </div>

          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <Check className="h-4 w-4 mr-1" />
              {isArabic ? 'قراءة الكل' : 'Mark all read'}
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {isArabic ? 'مفيش إشعارات' : 'No notifications'}
              </h3>
              <p className="text-muted-foreground">
                {isArabic ? 'هتلاقي الإشعارات هنا لما توصلك' : "You'll see notifications here when you get them"}
              </p>
            </div>
          ) : (
            notifications.map(notification => {
              const config = NOTIFICATION_CONFIG[notification.type];
              const Icon = config.icon;
              const hasLink = hasActionLink(notification);
              const actionLabel = hasLink ? getActionLabel(notification.type, isArabic) : (isArabic ? 'اقرأ الرسالة' : 'Read Message');
              const message = isArabic ? notification.message_ar : notification.message;
              const { text: truncatedMessage, isTruncated } = truncateMessage(message);
              const messageIsArabic = isArabicText(message);

              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "bg-card border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md hover:border-primary/50 group",
                    !notification.isRead && "border-primary/30 bg-primary/5"
                  )}
                >
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                      config.bgColor
                    )}>
                      <Icon className={cn("h-5 w-5", config.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={cn("text-xs", config.color)}>
                            {isArabic ? config.labelAr : config.labelEn}
                          </Badge>
                          {!notification.isRead && (
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(notification.created_at)}
                        </span>
                      </div>

                      {/* Title - Bold */}
                      <h4 className="font-bold text-foreground text-base mb-2">
                        {isArabic ? notification.title_ar : notification.title}
                      </h4>

                      {/* Message Body - with proper line breaks and RTL support */}
                      <div 
                        className={cn(
                          "text-sm text-muted-foreground leading-relaxed whitespace-pre-line",
                          messageIsArabic && "text-right"
                        )}
                        dir={messageIsArabic ? 'rtl' : 'ltr'}
                      >
                        {truncatedMessage}
                      </div>

                      {/* Action Button */}
                      <div className="mt-3 flex items-center justify-between">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className={cn(
                            "gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors",
                            isRTL && "flex-row-reverse"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNotificationClick(notification);
                          }}
                        >
                          {actionLabel}
                          <ChevronRight className={cn("h-4 w-4", isRTL && "rotate-180")} />
                        </Button>

                        {isTruncated && (
                          <span className="text-xs text-muted-foreground">
                            {isArabic ? 'اضغط للمزيد' : 'Tap for more'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Notification Detail Modal */}
      <Dialog open={!!selectedNotification} onOpenChange={(open) => !open && setSelectedNotification(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
          {selectedNotification && (() => {
            const config = NOTIFICATION_CONFIG[selectedNotification.type];
            const Icon = config.icon;
            const message = isArabic ? selectedNotification.message_ar : selectedNotification.message;
            const messageIsArabic = isArabicText(message);
            
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      config.bgColor
                    )}>
                      <Icon className={cn("h-5 w-5", config.color)} />
                    </div>
                    <div>
                      <Badge variant="outline" className={cn("text-xs mb-1", config.color)}>
                        {isArabic ? config.labelAr : config.labelEn}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(selectedNotification.created_at)}
                      </p>
                    </div>
                  </div>
                  <DialogTitle className="text-xl font-bold">
                    {isArabic ? selectedNotification.title_ar : selectedNotification.title}
                  </DialogTitle>
                </DialogHeader>
                
                <div 
                  className={cn(
                    "text-foreground leading-relaxed whitespace-pre-line mt-4",
                    messageIsArabic && "text-right"
                  )}
                  dir={messageIsArabic ? 'rtl' : 'ltr'}
                >
                  {message}
                </div>
                
                <div className="mt-6 flex justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedNotification(null)}
                  >
                    {isArabic ? 'إغلاق' : 'Close'}
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
}
