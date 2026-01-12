import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Message } from '@/hooks/useMessaging';
import { format, isToday, isYesterday } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ChatWindowProps {
  conversationId: string;
  otherPartyName: string;
  messages: Message[];
  onSendMessage: (text: string) => Promise<void>;
  onBack?: () => void;
  loading?: boolean;
  isRTL?: boolean;
}

const formatMessageTime = (dateStr: string, isArabic: boolean) => {
  const date = new Date(dateStr);
  const locale = isArabic ? ar : undefined;
  
  if (isToday(date)) {
    return format(date, 'h:mm a', { locale });
  }
  if (isYesterday(date)) {
    return isArabic ? `أمس ${format(date, 'h:mm a', { locale })}` : `Yesterday ${format(date, 'h:mm a')}`;
  }
  return format(date, 'd MMM, h:mm a', { locale });
};

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversationId,
  otherPartyName,
  messages,
  onSendMessage,
  onBack,
  loading = false,
  isRTL = true
}) => {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    
    setSending(true);
    try {
      await onSendMessage(newMessage);
      setNewMessage('');
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="flex-shrink-0">
            <ArrowRight className={cn("w-5 h-5", !isRTL && "rotate-180")} />
          </Button>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground truncate">{otherPartyName}</h2>
          <p className="text-xs text-muted-foreground">
            {isRTL ? 'محادثة مباشرة' : 'Direct message'}
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Send className="w-8 h-8 text-primary" />
            </div>
            <p className="text-muted-foreground text-sm">
              {isRTL ? 'ابدأ المحادثة بإرسال رسالة' : 'Start the conversation by sending a message'}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === user?.id;
            
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  isMine ? (isRTL ? "justify-start" : "justify-end") : (isRTL ? "justify-end" : "justify-start")
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5",
                    isMine
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.message_text}</p>
                  <p className={cn(
                    "text-[10px] mt-1",
                    isMine ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}>
                    {formatMessageTime(msg.created_at, isRTL)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-border bg-card">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={isRTL ? 'اكتب رسالتك...' : 'Type a message...'}
              className={cn(
                "w-full resize-none rounded-xl border border-input bg-background px-4 py-2.5 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-ring",
                "min-h-[44px] max-h-[120px]"
              )}
              rows={1}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            size="icon"
            className="h-11 w-11 rounded-xl flex-shrink-0"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className={cn("w-5 h-5", isRTL && "rotate-180")} />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
