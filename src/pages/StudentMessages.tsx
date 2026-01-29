import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { 
  MessageCircle, 
  Send, 
  ArrowLeft, 
  ArrowRight,
  Clock,
  CheckCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';
import { ar } from 'date-fns/locale/ar';

interface Message {
  id: string;
  message_text: string;
  sender_role: string;
  created_at: string;
  read_at: string | null;
}

interface Conversation {
  id: string;
  assistant_teacher_id: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_count_student: number;
  assistant_name?: string;
}

const StudentMessages: React.FC = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isArabic = language === 'ar';
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  const fetchConversation = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get student's conversation
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('student_id', user.id)
        .maybeSingle();
      
      if (convError) throw convError;
      
      if (convData) {
        // Get assistant name
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', convData.assistant_teacher_id)
          .single();
        
        setConversation({
          ...convData,
          assistant_name: profile?.full_name || (isArabic ? 'المساعد' : 'Assistant')
        });
        
        // Get messages
        const { data: msgData } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', convData.id)
          .order('created_at', { ascending: true });
        
        setMessages(msgData || []);
        
        // Mark as read
        if (convData.unread_count_student > 0) {
          await supabase
            .from('conversations')
            .update({ unread_count_student: 0 })
            .eq('id', convData.id);
          
          await supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .eq('conversation_id', convData.id)
            .eq('sender_role', 'assistant')
            .is('read_at', null);
        }
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
    } finally {
      setLoading(false);
    }
  }, [user, isArabic]);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchConversation();
  }, [fetchConversation]);

  // Realtime subscription
  useEffect(() => {
    if (!conversation?.id) return;
    
    const channel = supabase
      .channel(`messages-${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => [...prev, newMsg]);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation?.id]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || sending) return;
    
    try {
      setSending(true);
      
      let convId = conversation?.id;
      
      // Create conversation if doesn't exist (will be assigned to an assistant later)
      if (!convId) {
        // For now, show message that they'll be contacted
        return;
      }
      
      // Send message
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: convId,
          sender_id: user.id,
          sender_role: 'student',
          message_text: newMessage.trim()
        });
      
      if (error) throw error;
      
      // Update conversation
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          last_message_preview: newMessage.trim().substring(0, 100),
          unread_count_assistant: (conversation?.unread_count_student || 0) + 1
        })
        .eq('id', convId);
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatMessageDate = (date: string) => {
    const d = new Date(date);
    if (isToday(d)) {
      return format(d, 'HH:mm');
    }
    if (isYesterday(d)) {
      return isArabic ? 'أمس' : 'Yesterday';
    }
    return format(d, 'dd/MM', { locale: isArabic ? ar : undefined });
  };

  const BackIcon = isArabic ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-muted/30 pb-mobile-nav" dir={isArabic ? 'rtl' : 'ltr'}>
      <Navbar />
      
      <main className="pt-20 sm:pt-24 pb-8 content-appear">
        <div className="container mx-auto px-3 sm:px-4 max-w-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/platform')}
              className="shrink-0"
            >
              <BackIcon className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                {isArabic ? 'الرسائل' : 'Messages'}
              </h1>
              {conversation?.assistant_name && (
                <p className="text-sm text-muted-foreground">
                  {isArabic ? 'مع' : 'with'} {conversation.assistant_name}
                </p>
              )}
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <Card className="p-4">
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className={cn("flex", i % 2 === 0 ? "justify-end" : "")}>
                    <Skeleton className="h-12 w-3/4 rounded-xl" />
                  </div>
                ))}
              </div>
            </Card>
          ) : !conversation ? (
            /* No Conversation State */
            <Card className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {isArabic ? 'سيتم الرد عليك قريباً' : 'You\'ll hear from us soon'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {isArabic 
                  ? 'سيتم تعيين مساعد لك قريباً للإجابة على أسئلتك ومتابعة تقدمك' 
                  : 'An assistant will be assigned to you soon to answer your questions and track your progress'}
              </p>
            </Card>
          ) : (
            /* Chat Interface */
            <Card className="overflow-hidden">
              {/* Messages List */}
              <div className="h-[400px] sm:h-[500px] overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    {isArabic ? 'ابدأ المحادثة بإرسال رسالة' : 'Start the conversation by sending a message'}
                  </div>
                ) : (
                  messages.map(msg => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        msg.sender_role === 'student' ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-2.5",
                          msg.sender_role === 'student'
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted text-foreground rounded-bl-sm"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {msg.message_text}
                        </p>
                        <div className={cn(
                          "flex items-center gap-1 mt-1",
                          msg.sender_role === 'student' ? "justify-end" : "justify-start"
                        )}>
                          <span className={cn(
                            "text-[10px]",
                            msg.sender_role === 'student' 
                              ? "text-primary-foreground/70" 
                              : "text-muted-foreground"
                          )}>
                            {formatMessageDate(msg.created_at)}
                          </span>
                          {msg.sender_role === 'student' && msg.read_at && (
                            <CheckCheck className="w-3 h-3 text-primary-foreground/70" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Message Input */}
              <div className="border-t border-border p-3 bg-card">
                <div className="flex items-center gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={isArabic ? 'اكتب رسالتك...' : 'Type your message...'}
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    disabled={sending}
                  />
                  <Button 
                    size="icon" 
                    onClick={handleSend}
                    disabled={!newMessage.trim() || sending}
                  >
                    <Send className={cn("h-4 w-4", isArabic && "rotate-180")} />
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default StudentMessages;
