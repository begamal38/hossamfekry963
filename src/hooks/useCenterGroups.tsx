/**
 * Center Groups Hook
 * 
 * Provides center group data and operations for the assistant dashboard.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface CenterGroup {
  id: string;
  name: string;
  grade: string;
  language_track: string;
  days_of_week: string[];
  time_slot: string;
  is_active: boolean;
  assistant_teacher_id: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

export interface CenterGroupMember {
  id: string;
  group_id: string;
  student_id: string;
  enrolled_at: string;
  is_active: boolean;
  student?: {
    user_id: string;
    full_name: string | null;
    phone: string | null;
    grade: string | null;
  };
  enrollment_status?: string;
}

interface UseCenterGroupsReturn {
  groups: CenterGroup[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createGroup: (data: Omit<CenterGroup, 'id' | 'created_at' | 'updated_at' | 'assistant_teacher_id'>) => Promise<CenterGroup | null>;
  updateGroup: (id: string, data: Partial<CenterGroup>) => Promise<boolean>;
  deleteGroup: (id: string) => Promise<boolean>;
  getGroupMembers: (groupId: string) => Promise<CenterGroupMember[]>;
  activateGroupSubscriptions: (groupId: string, courseId: string) => Promise<{ activated: number; alreadyActive: number }>;
}

export function useCenterGroups(): UseCenterGroupsReturn {
  const { user } = useAuth();
  const [groups, setGroups] = useState<CenterGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchGroups = useCallback(async () => {
    // PHASE GUARD: Require authenticated user
    const userId = user?.id;
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('center_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;

      // Fetch member counts for each group
      const groupsWithCounts = await Promise.all(
        (groupsData || []).map(async (group) => {
          const { count } = await supabase
            .from('center_group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id)
            .eq('is_active', true);
          
          return { ...group, member_count: count || 0 };
        })
      );

      setGroups(groupsWithCounts);
      setError(null);
    } catch (err) {
      console.error('Error fetching center groups:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  // STABLE DEPS: Use user?.id instead of user object to prevent reference instability
  }, [user?.id]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const createGroup = async (
    data: Omit<CenterGroup, 'id' | 'created_at' | 'updated_at' | 'assistant_teacher_id'>
  ): Promise<CenterGroup | null> => {
    if (!user) return null;

    try {
      const { data: newGroup, error } = await supabase
        .from('center_groups')
        .insert({
          ...data,
          assistant_teacher_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchGroups();
      return newGroup;
    } catch (err) {
      console.error('Error creating group:', err);
      throw err;
    }
  };

  const updateGroup = async (id: string, data: Partial<CenterGroup>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('center_groups')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      await fetchGroups();
      return true;
    } catch (err) {
      console.error('Error updating group:', err);
      return false;
    }
  };

  const deleteGroup = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('center_groups')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchGroups();
      return true;
    } catch (err) {
      console.error('Error deleting group:', err);
      return false;
    }
  };

  const getGroupMembers = async (groupId: string): Promise<CenterGroupMember[]> => {
    try {
      // Get group members
      const { data: members, error: membersError } = await supabase
        .from('center_group_members')
        .select('*')
        .eq('group_id', groupId)
        .eq('is_active', true);

      if (membersError) throw membersError;

      if (!members || members.length === 0) return [];

      // Get student profiles
      const studentIds = members.map(m => m.student_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone, grade')
        .in('user_id', studentIds);

      // Get enrollment statuses for all courses (we'll take the most relevant)
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('user_id, status')
        .in('user_id', studentIds);

      // Map profiles and enrollments to members
      return members.map(member => {
        const profile = profiles?.find(p => p.user_id === member.student_id);
        const enrollment = enrollments?.find(e => e.user_id === member.student_id);
        
        return {
          ...member,
          student: profile || undefined,
          enrollment_status: enrollment?.status,
        };
      });
    } catch (err) {
      console.error('Error fetching group members:', err);
      return [];
    }
  };

  const activateGroupSubscriptions = async (
    groupId: string,
    courseId: string
  ): Promise<{ activated: number; alreadyActive: number }> => {
    try {
      // Get all active members of the group
      const { data: members, error: membersError } = await supabase
        .from('center_group_members')
        .select('student_id')
        .eq('group_id', groupId)
        .eq('is_active', true);

      if (membersError) throw membersError;
      if (!members || members.length === 0) {
        return { activated: 0, alreadyActive: 0 };
      }

      const studentIds = members.map(m => m.student_id);

      // Check existing enrollments for this course
      const { data: existingEnrollments } = await supabase
        .from('course_enrollments')
        .select('user_id, status')
        .eq('course_id', courseId)
        .in('user_id', studentIds);

      const existingActiveIds = new Set(
        (existingEnrollments || [])
          .filter(e => e.status === 'active')
          .map(e => e.user_id)
      );

      const existingPendingIds = new Set(
        (existingEnrollments || [])
          .filter(e => e.status === 'pending')
          .map(e => e.user_id)
      );

      // Students to activate (those pending)
      const toActivate = studentIds.filter(id => existingPendingIds.has(id));
      
      // Students to enroll (those not enrolled at all)
      const existingIds = new Set((existingEnrollments || []).map(e => e.user_id));
      const toEnroll = studentIds.filter(id => !existingIds.has(id));

      let activatedCount = 0;

      // Activate pending enrollments
      if (toActivate.length > 0) {
        const { error: activateError } = await supabase
          .from('course_enrollments')
          .update({ 
            status: 'active',
            activated_at: new Date().toISOString(),
          })
          .eq('course_id', courseId)
          .in('user_id', toActivate);

        if (!activateError) {
          activatedCount += toActivate.length;
        }
      }

      // Create new enrollments for those not enrolled
      if (toEnroll.length > 0) {
        const newEnrollments = toEnroll.map(userId => ({
          user_id: userId,
          course_id: courseId,
          status: 'active',
          activated_at: new Date().toISOString(),
        }));

        const { error: enrollError } = await supabase
          .from('course_enrollments')
          .insert(newEnrollments);

        if (!enrollError) {
          activatedCount += toEnroll.length;
        }
      }

      return {
        activated: activatedCount,
        alreadyActive: existingActiveIds.size,
      };
    } catch (err) {
      console.error('Error activating group subscriptions:', err);
      throw err;
    }
  };

  return {
    groups,
    loading,
    error,
    refetch: fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    getGroupMembers,
    activateGroupSubscriptions,
  };
}
