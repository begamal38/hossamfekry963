/**
 * Centralized Profile Hook
 * 
 * Provides cached profile data to avoid duplicate fetches across components.
 * Profile is fetched once per session and cached in memory.
 * 
 * CRITICAL: isProfileComplete is the SINGLE SOURCE OF TRUTH for profile completion.
 * All components MUST use this flag instead of re-deriving completion logic.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserProfile {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  grade: string | null;
  academic_year: string | null;
  language_track: string | null;
  governorate: string | null;
  avatar_url: string | null;
  // CRITICAL: Can be null - forces ProfileCompletionPrompt for new/Google users
  attendance_mode: 'online' | 'center' | 'hybrid' | null;
  is_suspended: boolean;
  theme_preference: string | null;
  // Center group membership (fetched separately for center students)
  center_group_id?: string | null;
  center_group_name?: string | null;
}

// In-memory cache to avoid re-fetching on route changes
let profileCache: { userId: string; profile: UserProfile; fetchedAt: number } | null = null;
const PROFILE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const useProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async (forceRefresh = false) => {
    // PHASE GUARD: Do not fetch until auth is resolved
    if (authLoading) return;

    const userId = user?.id;
    
    if (!userId) {
      profileCache = null;
      setProfile(null);
      setLoading(false);
      return;
    }

    // Check cache first (using userId for stable comparison)
    const cachedForUser = profileCache?.userId === userId ? profileCache : null;
    const cacheFresh = cachedForUser && Date.now() - cachedForUser.fetchedAt < PROFILE_CACHE_TTL_MS;

    if (cacheFresh && !forceRefresh) {
      setProfile(cachedForUser.profile);
      setLoading(false);
      return;
    }

    // If we have stale cached data, use it while refreshing (no loading state)
    if (cachedForUser && !forceRefresh) {
      setProfile(cachedForUser.profile);
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        // Fetch center group membership for center students
        let centerGroupId: string | null = null;
        let centerGroupName: string | null = null;
        
        if (data.attendance_mode === 'center') {
          const { data: membership } = await supabase
            .from('center_group_members')
            .select('group_id, center_groups!inner(name)')
            .eq('student_id', userId)
            .eq('is_active', true)
            .maybeSingle();
          
          if (membership) {
            centerGroupId = membership.group_id || null;
            // Type assertion for nested join
            const groupData = membership.center_groups as unknown as { name: string } | null;
            centerGroupName = groupData?.name || null;
          }
        }

        const userProfile: UserProfile = {
          user_id: data.user_id,
          full_name: data.full_name,
          phone: data.phone,
          email: data.email,
          grade: data.grade,
          academic_year: data.academic_year,
          language_track: data.language_track,
          governorate: data.governorate,
          avatar_url: data.avatar_url,
          // CRITICAL: Do NOT default to 'online' - preserve null to trigger ProfileCompletionPrompt
          // Note: hybrid is stored in DB but normalized to 'online' in UI via normalizeAttendanceMode()
          attendance_mode: data.attendance_mode as 'online' | 'center' | 'hybrid',
          is_suspended: data.is_suspended || false,
          theme_preference: data.theme_preference,
          center_group_id: centerGroupId,
          center_group_name: centerGroupName,
        };

        profileCache = { userId, profile: userProfile, fetchedAt: Date.now() };
        setProfile(userProfile);
        setError(null);
      } else {
        // Profile not found - may happen briefly after signup
        setProfile(null);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err as Error);
      // Keep stale data if we have it (graceful degradation)
      if (cachedForUser) {
        setProfile(cachedForUser.profile);
      }
    } finally {
      setLoading(false);
    }
  // STABLE DEPS: Use user?.id instead of user object to prevent reference instability
  }, [authLoading, user?.id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Derived values
  const firstName = useMemo(() => {
    const name = profile?.full_name || '';
    return name.split(' ')[0] || '';
  }, [profile]);

  const academicPath = useMemo(() => {
    if (!profile?.academic_year || !profile?.language_track) return null;
    return {
      year: profile.academic_year,
      track: profile.language_track,
      grade: profile.grade,
    };
  }, [profile]);

  /**
   * SINGLE SOURCE OF TRUTH for profile completion.
   * Profile is complete if:
   * - attendance_mode is set
   * - grade is set
   * - IF attendance_mode === 'center' → must have active center group membership
   * 
   * Note: hybrid is legacy and treated as online (complete without group)
   */
  const isProfileComplete = useMemo(() => {
    if (!profile) return false;
    
    // Must have attendance_mode and grade
    if (!profile.attendance_mode || !profile.grade) return false;
    
    // For center students only, must have active group membership
    // hybrid and online students are complete without group
    if (profile.attendance_mode === 'center') {
      return Boolean(profile.center_group_id);
    }
    
    // Online students are complete if they have grade and attendance_mode
    return true;
  }, [profile]);

  return {
    profile,
    loading,
    error,
    firstName,
    academicPath,
    isProfileComplete,
    refreshProfile: () => fetchProfile(true),
  };
};

// Clear cache on sign out (called from useAuth)
export const clearProfileCache = () => {
  profileCache = null;
};
