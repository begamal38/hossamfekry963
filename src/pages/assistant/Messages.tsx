import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ArrowRight, Plus } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { ConversationList } from '@/components/messaging/ConversationList';
import { ChatWindow } from '@/components/messaging/ChatWindow';
import { NewConversationDialog } from '@/components/messaging/NewConversationDialog';
import { useMessaging, Conversation } from '@/hooks/useMessaging';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export default function AssistantMessages() {
  const { user, loading: authLoading } = useAuth();
  const { canAccessDashboard, loading: roleLoading } = useUserRole();
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  
  const {
    conversations,
    messages,
    currentConversation,
    setCurrentConversation,
    loading,
    fetchConversations,
    fetchMessages,
    sendMessage,
    getOrCreateConversationWithStudent
  } = useMessaging();

  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [newConversationOpen, setNewConversationOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    if (!authLoading && !roleLoading && user && !canAccessDashboard()) {
      navigate('/');
    }
  }, [user, authLoading, roleLoading, canAccessDashboard, navigate]);

  useEffect(() => {
    if (user && canAccessDashboard()) {
      fetchConversations();
    }
  }, [user, canAccessDashboard, fetchConversations]);

  const handleSelectConversation = useCallback(async (conv: Conversation) => {
    setCurrentConversation(conv);
    await fetchMessages(conv.id);
  }, [setCurrentConversation, fetchMessages]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!currentConversation) return;
    await sendMessage(currentConversation.id, text);
  }, [currentConversation, sendMessage]);

  const handleBack = useCallback(() => {
    setCurrentConversation(null);
  }, [setCurrentConversation]);

  const handleStartNewConversation = useCallback(async (studentId: string) => {
    const conv = await getOrCreateConversationWithStudent(studentId);
    if (conv) {
      setCurrentConversation(conv);
      await fetchMessages(conv.id);
      await fetchConversations();
    }
  }, [getOrCreateConversationWithStudent, setCurrentConversation, fetchMessages, fetchConversations]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Mobile: Show either list or chat
  if (isMobileView) {
    return (
      <div className="min-h-screen bg-background pb-mobile-nav" dir={isRTL ? 'rtl' : 'ltr'}>
        <Navbar />
        
        {currentConversation ? (
          <div className="pt-16 h-screen flex flex-col">
            <ChatWindow
              conversationId={currentConversation.id}
              otherPartyName={currentConversation.student_name || (isRTL ? 'طالب' : 'Student')}
              messages={messages}
              onSendMessage={handleSendMessage}
              onBack={handleBack}
              loading={loading}
              isRTL={isRTL}
            />
          </div>
        ) : (
          <main className="pt-20">
            <div className="container mx-auto px-4 max-w-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" onClick={() => navigate('/assistant')}>
                    <ArrowRight className={cn("w-5 h-5", !isRTL && "rotate-180")} />
                  </Button>
                  <div>
                    <h1 className="text-xl font-bold text-foreground">
                      {isRTL ? 'رسائل الطلاب' : 'Student Messages'}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      {isRTL ? 'تواصل مع طلابك' : 'Communicate with your students'}
                    </p>
                  </div>
                </div>
                <Button 
                  size="icon" 
                  onClick={() => setNewConversationOpen(true)}
                  className="rounded-full"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>

              {/* Conversations List */}
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <ConversationList
                  conversations={conversations}
                  onSelectConversation={handleSelectConversation}
                  loading={loading}
                  isRTL={isRTL}
                  viewerRole="assistant"
                />
              </div>
            </div>
          </main>
        )}

        <NewConversationDialog
          open={newConversationOpen}
          onOpenChange={setNewConversationOpen}
          onSelectStudent={handleStartNewConversation}
          isRTL={isRTL}
        />
      </div>
    );
  }

  // Desktop: Split view
  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      
      <main className="pt-20 pb-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/assistant')}>
                <ArrowRight className={cn("w-5 h-5", !isRTL && "rotate-180")} />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {isRTL ? 'رسائل الطلاب' : 'Student Messages'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'تواصل مع طلابك' : 'Communicate with your students'}
                </p>
              </div>
            </div>
            <Button onClick={() => setNewConversationOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              {isRTL ? 'محادثة جديدة' : 'New Conversation'}
            </Button>
          </div>

          {/* Split View */}
          <div className="grid grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
            {/* Conversations Sidebar */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="p-4 border-b border-border">
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  {isRTL ? 'المحادثات' : 'Conversations'}
                </h2>
              </div>
              <div className="overflow-y-auto h-[calc(100%-60px)]">
                <ConversationList
                  conversations={conversations}
                  onSelectConversation={handleSelectConversation}
                  loading={loading}
                  isRTL={isRTL}
                  viewerRole="assistant"
                />
              </div>
            </div>

            {/* Chat Area */}
            <div className="col-span-2 bg-card rounded-2xl border border-border overflow-hidden">
              {currentConversation ? (
                <ChatWindow
                  conversationId={currentConversation.id}
                  otherPartyName={currentConversation.student_name || (isRTL ? 'طالب' : 'Student')}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  loading={loading}
                  isRTL={isRTL}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                    <MessageCircle className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    {isRTL ? 'اختر محادثة' : 'Select a conversation'}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm mb-4">
                    {isRTL 
                      ? 'اختر محادثة من القائمة أو ابدأ محادثة جديدة'
                      : 'Choose a conversation from the list or start a new one'
                    }
                  </p>
                  <Button variant="outline" onClick={() => setNewConversationOpen(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    {isRTL ? 'محادثة جديدة' : 'New Conversation'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <NewConversationDialog
        open={newConversationOpen}
        onOpenChange={setNewConversationOpen}
        onSelectStudent={handleStartNewConversation}
        isRTL={isRTL}
      />
    </div>
  );
}
