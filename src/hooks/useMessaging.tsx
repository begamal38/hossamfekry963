import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserRole } from './useUserRole';

export interface Conversation {
  id: string;
  student_id: string;
  assistant_teacher_id: string;
  last_message_at: string;
  last_message_preview: string | null;
  unread_count_student: number;
  unread_count_assistant: number;
  created_at: string;
  // Joined data
  student_name?: string;
  assistant_name?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: 'student' | 'assistant';
  message_text: string;
  read_at: string | null;
  created_at: string;
}

export const useMessaging = () => {
  const { user } = useAuth();
  const { isStudent, isAssistantTeacher } = useUserRole();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false });
      
      if (error) throw error;

      // Fetch names for each conversation
      const conversationsWithNames = await Promise.all(
        (data || []).map(async (conv) => {
          const [studentProfile, assistantProfile] = await Promise.all([
            supabase.from('profiles').select('full_name').eq('user_id', conv.student_id).maybeSingle(),
            supabase.from('profiles').select('full_name').eq('user_id', conv.assistant_teacher_id).maybeSingle()
          ]);
          
          return {
            ...conv,
            student_name: studentProfile.data?.full_name || 'طالب',
            assistant_name: assistantProfile.data?.full_name || 'المدرس المساعد'
          };
        })
      );

      setConversations(conversationsWithNames);

      // Calculate total unread
      const unread = conversationsWithNames.reduce((sum, c) => {
        if (isStudent()) return sum + c.unread_count_student;
        if (isAssistantTeacher()) return sum + c.unread_count_assistant;
        return sum;
      }, 0);
      setTotalUnread(unread);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [user, isStudent, isAssistantTeacher]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setMessages((data || []) as Message[]);
      
      // Mark messages as read
      const unreadMessages = (data || []).filter(
        m => !m.read_at && m.sender_id !== user.id
      );
      
      if (unreadMessages.length > 0) {
        await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .in('id', unreadMessages.map(m => m.id));
        
        // Update unread count in conversation
        const updateField = isStudent() ? 'unread_count_student' : 'unread_count_assistant';
        await supabase
          .from('conversations')
          .update({ [updateField]: 0 })
          .eq('id', conversationId);
        
        // Refresh conversations to update unread counts
        fetchConversations();
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  }, [user, isStudent, fetchConversations]);

  // Send a message
  const sendMessage = useCallback(async (conversationId: string, messageText: string) => {
    if (!user || !messageText.trim()) return null;
    
    const senderRole = isStudent() ? 'student' : 'assistant';
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          sender_role: senderRole,
          message_text: messageText.trim()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Add message to local state immediately
      setMessages(prev => [...prev, data as Message]);
      
      return data;
    } catch (err) {
      console.error('Error sending message:', err);
      return null;
    }
  }, [user, isStudent]);

  // Get or create conversation (for students)
  const getOrCreateConversation = useCallback(async (assistantTeacherId: string) => {
    if (!user || !isStudent()) return null;
    
    try {
      // Check if conversation exists
      const { data: existing, error: fetchError } = await supabase
        .from('conversations')
        .select('*')
        .eq('student_id', user.id)
        .eq('assistant_teacher_id', assistantTeacherId)
        .maybeSingle();
      
      if (fetchError) throw fetchError;
      
      if (existing) {
        // Fetch assistant name
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', assistantTeacherId)
          .maybeSingle();
        
        return {
          ...existing,
          assistant_name: profile?.full_name || 'المدرس المساعد'
        };
      }
      
      // Create new conversation
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
          student_id: user.id,
          assistant_teacher_id: assistantTeacherId
        })
        .select()
        .single();
      
      if (createError) throw createError;
      
      // Fetch assistant name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', assistantTeacherId)
        .maybeSingle();
      
      return {
        ...newConv,
        assistant_name: profile?.full_name || 'المدرس المساعد'
      };
    } catch (err) {
      console.error('Error getting/creating conversation:', err);
      return null;
    }
  }, [user, isStudent]);

  // Get available assistant teacher for student messaging
  // Priority: 1) Previously linked assistant, 2) Any available assistant
  const getAvailableAssistantTeacher = useCallback(async () => {
    if (!user) return null;
    
    try {
      // First, check if student already has an existing conversation
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('assistant_teacher_id')
        .eq('student_id', user.id)
        .limit(1)
        .maybeSingle();
      
      if (existingConv?.assistant_teacher_id) {
        return existingConv.assistant_teacher_id;
      }
      
      // Otherwise, get any available assistant teacher
      const { data: assistants, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'assistant_teacher');
      
      if (error) throw error;
      
      // Return the first assistant found
      if (assistants && assistants.length > 0) {
        return assistants[0].user_id;
      }
      
      return null;
    } catch (err) {
      console.error('Error fetching assistant teacher:', err);
      return null;
    }
  }, [user]);

  // Subscribe to new messages in real-time
  useEffect(() => {
    if (!user || !currentConversation) return;
    
    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${currentConversation.id}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          // Only add if not already in state (to avoid duplicates from our own sends)
          setMessages(prev => {
            if (prev.find(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage] as Message[];
          });
          
          // Mark as read if from other user
          if (newMessage.sender_id !== user.id) {
            supabase
              .from('messages')
              .update({ read_at: new Date().toISOString() })
              .eq('id', newMessage.id);
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, currentConversation]);

  // Subscribe to conversation updates
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel('conversations-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConversations]);

  // Get student's conversation (create if needed with auto-assigned assistant)
  const getStudentConversation = useCallback(async () => {
    if (!user || !isStudent()) return null;
    
    try {
      // Check if student already has a conversation
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('*')
        .eq('student_id', user.id)
        .limit(1)
        .maybeSingle();
      
      if (existingConv) {
        // Fetch assistant name
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', existingConv.assistant_teacher_id)
          .maybeSingle();
        
        return {
          ...existingConv,
          assistant_name: profile?.full_name || 'المدرس المساعد'
        };
      }
      
      // No existing conversation - find an assistant and create one
      const assistantId = await getAvailableAssistantTeacher();
      
      if (!assistantId) {
        // Even without an assistant, we can still return a placeholder
        // This should rarely happen in a real system
        console.warn('No assistant teacher found in system');
        return null;
      }
      
      // Create new conversation
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
          student_id: user.id,
          assistant_teacher_id: assistantId
        })
        .select()
        .single();
      
      if (createError) throw createError;
      
      // Fetch assistant name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', assistantId)
        .maybeSingle();
      
      return {
        ...newConv,
        assistant_name: profile?.full_name || 'المدرس المساعد'
      };
    } catch (err) {
      console.error('Error getting student conversation:', err);
      return null;
    }
  }, [user, isStudent, getAvailableAssistantTeacher]);

  // Create or get conversation with a specific student (for assistant teachers)
  const getOrCreateConversationWithStudent = useCallback(async (studentId: string) => {
    if (!user || !isAssistantTeacher()) return null;
    
    try {
      // Check if conversation exists
      const { data: existing, error: fetchError } = await supabase
        .from('conversations')
        .select('*')
        .eq('student_id', studentId)
        .eq('assistant_teacher_id', user.id)
        .maybeSingle();
      
      if (fetchError) throw fetchError;
      
      if (existing) {
        // Fetch student name
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', studentId)
          .maybeSingle();
        
        return {
          ...existing,
          student_name: profile?.full_name || 'طالب'
        };
      }
      
      // Create new conversation
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
          student_id: studentId,
          assistant_teacher_id: user.id
        })
        .select()
        .single();
      
      if (createError) throw createError;
      
      // Fetch student name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', studentId)
        .maybeSingle();
      
      return {
        ...newConv,
        student_name: profile?.full_name || 'طالب'
      };
    } catch (err) {
      console.error('Error getting/creating conversation with student:', err);
      return null;
    }
  }, [user, isAssistantTeacher]);

  return {
    conversations,
    messages,
    currentConversation,
    setCurrentConversation,
    loading,
    totalUnread,
    fetchConversations,
    fetchMessages,
    sendMessage,
    getOrCreateConversation,
    getAvailableAssistantTeacher,
    getStudentConversation,
    getOrCreateConversationWithStudent
  };
};
