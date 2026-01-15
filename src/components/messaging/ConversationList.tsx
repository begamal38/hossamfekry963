import React from 'react';
import { MessageCircle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Conversation } from '@/hooks/useMessaging';
import { format, isToday, isYesterday } from 'date-fns';
import { ar } from 'date-fns/locale/ar';

interface ConversationListProps {
  conversations: Conversation[];
  onSelectConversation: (conv: Conversation) => void;
  loading?: boolean;
  isRTL?: boolean;
  viewerRole: 'student' | 'assistant';
}

const formatTime = (dateStr: string, isArabic: boolean) => {
  const date = new Date(dateStr);
  const locale = isArabic ? ar : undefined;
  
  if (isToday(date)) {
    return format(date, 'h:mm a', { locale });
  }
  if (isYesterday(date)) {
    return isArabic ? 'أمس' : 'Yesterday';
  }
  return format(date, 'd MMM', { locale });
};

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  onSelectConversation,
  loading = false,
  isRTL = true,
  viewerRole
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <MessageCircle className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-sm">
          {isRTL ? 'لا توجد محادثات حتى الآن' : 'No conversations yet'}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {conversations.map((conv) => {
        const unreadCount = viewerRole === 'student' 
          ? conv.unread_count_student 
          : conv.unread_count_assistant;
        const displayName = viewerRole === 'student' 
          ? conv.assistant_name 
          : conv.student_name;
        
        return (
          <button
            key={conv.id}
            onClick={() => onSelectConversation(conv)}
            className={cn(
              "w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-right",
              unreadCount > 0 && "bg-primary/5"
            )}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-semibold text-primary">
                {displayName?.charAt(0) || '؟'}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className={cn(
                  "font-medium text-foreground truncate",
                  unreadCount > 0 && "font-semibold"
                )}>
                  {displayName || (isRTL ? 'مستخدم' : 'User')}
                </h3>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {formatTime(conv.last_message_at, isRTL)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className={cn(
                  "text-sm truncate",
                  unreadCount > 0 ? "text-foreground" : "text-muted-foreground"
                )}>
                  {conv.last_message_preview || (isRTL ? 'رسالة جديدة' : 'New message')}
                </p>
                {unreadCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center flex-shrink-0">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
            </div>

            {/* Chevron */}
            {isRTL ? (
              <ChevronLeft className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            ) : (
              <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );
};
