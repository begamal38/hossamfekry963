import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ChatWindow } from './ChatWindow';
import { useMessaging, Conversation } from '@/hooks/useMessaging';
import { cn } from '@/lib/utils';

interface StudentChatButtonProps {
  isRTL?: boolean;
  className?: string;
}

export const StudentChatButton: React.FC<StudentChatButtonProps> = ({
  isRTL = true,
  className
}) => {
  const {
    messages,
    totalUnread,
    fetchMessages,
    sendMessage,
    getStudentConversation,
    loading
  } = useMessaging();

  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeConversation = useCallback(async () => {
    setInitializing(true);
    setError(null);
    try {
      const conv = await getStudentConversation();
      if (conv) {
        setConversation(conv);
        await fetchMessages(conv.id);
      } else {
        // Very rare edge case - show helpful message
        setError('جاري تجهيز المحادثة...');
      }
    } catch (err) {
      console.error('Error initializing conversation:', err);
      setError('حدث خطأ، يرجى المحاولة مرة أخرى');
    } finally {
      setInitializing(false);
    }
  }, [getStudentConversation, fetchMessages]);

  useEffect(() => {
    if (open && !conversation) {
      initializeConversation();
    }
  }, [open, conversation, initializeConversation]);

  const handleSendMessage = async (text: string) => {
    if (!conversation) return;
    await sendMessage(conversation.id, text);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "gap-2 relative",
            className
          )}
        >
          <MessageCircle className="w-4 h-4" />
          <span>{isRTL ? 'التواصل مع المدرس المساعد' : 'Contact Assistant'}</span>
          {totalUnread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
              {totalUnread > 9 ? '9+' : totalUnread}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent 
        side={isRTL ? 'right' : 'left'} 
        className="w-full sm:max-w-md p-0 flex flex-col"
      >
        {initializing || loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : conversation ? (
          <ChatWindow
            conversationId={conversation.id}
            otherPartyName={conversation.assistant_name || (isRTL ? 'المدرس المساعد' : 'Assistant Teacher')}
            messages={messages}
            onSendMessage={handleSendMessage}
            loading={loading}
            isRTL={isRTL}
          />
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-primary" />
            </div>
            <p className="text-muted-foreground">{error}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={initializeConversation}
            >
              {isRTL ? 'إعادة المحاولة' : 'Retry'}
            </Button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-primary" />
            </div>
            <p className="text-muted-foreground">
              {isRTL ? 'اكتب رسالتك للمدرس المساعد هنا…' : 'Write your message to the assistant teacher here...'}
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
