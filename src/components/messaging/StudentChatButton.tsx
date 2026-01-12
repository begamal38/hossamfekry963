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
    getOrCreateConversation,
    getFirstAssistantTeacher,
    loading
  } = useMessaging();

  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [initializing, setInitializing] = useState(false);

  const initializeConversation = useCallback(async () => {
    setInitializing(true);
    try {
      const assistantId = await getFirstAssistantTeacher();
      if (assistantId) {
        const conv = await getOrCreateConversation(assistantId);
        if (conv) {
          setConversation(conv);
          await fetchMessages(conv.id);
        }
      }
    } catch (err) {
      console.error('Error initializing conversation:', err);
    } finally {
      setInitializing(false);
    }
  }, [getFirstAssistantTeacher, getOrCreateConversation, fetchMessages]);

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
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              {isRTL ? 'لا يوجد مدرس مساعد متاح حالياً' : 'No assistant teacher available'}
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
