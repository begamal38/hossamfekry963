import React from 'react';
import { MessageCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InboxEmptyProps {
  isRTL?: boolean;
  type?: 'no_messages' | 'no_assistant' | 'loading';
  className?: string;
}

/**
 * Unified Inbox Empty State
 * No "No assistant available" - always shows helpful message
 */
export const InboxEmpty: React.FC<InboxEmptyProps> = ({
  isRTL = false,
  type = 'no_messages',
  className,
}) => {
  const content = {
    no_messages: {
      icon: MessageCircle,
      title: isRTL ? 'مفيش رسائل' : 'No Messages',
      subtitle: isRTL 
        ? 'لما يكون في رسائل جديدة هتظهر هنا' 
        : 'New messages will appear here',
    },
    no_assistant: {
      icon: Clock,
      title: isRTL ? 'سيتم الرد عليك قريباً' : 'We\'ll respond soon',
      subtitle: isRTL 
        ? 'فريق الدعم هيتواصل معاك في أقرب وقت' 
        : 'Our support team will reach out shortly',
    },
    loading: {
      icon: MessageCircle,
      title: isRTL ? 'جاري التحميل...' : 'Loading...',
      subtitle: '',
    },
  };

  const config = content[type];
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4 text-center",
      className
    )}>
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        {type === 'loading' ? (
          <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
        ) : (
          <Icon className="w-8 h-8 text-muted-foreground" />
        )}
      </div>
      <h3 className="font-semibold text-foreground mb-1">
        {config.title}
      </h3>
      {config.subtitle && (
        <p className="text-sm text-muted-foreground max-w-xs">
          {config.subtitle}
        </p>
      )}
    </div>
  );
};
