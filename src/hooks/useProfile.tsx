/**
 * Centralized Profile Hook
 * 
 * Provides cached profile data to avoid duplicate fetches across components.
 * Profile is fetched once per session and cached in memory.
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
  attendance_mode: 'online' | 'center' | 'hybrid';
  is_suspended: boolean;
  theme_preference: string | null;
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
    if (authLoading) return;

    if (!user) {
      profileCache = null;
      setProfile(null);
      setLoading(false);
      return;
    }

    // Check cache first
    const cachedForUser = profileCache?.userId === user.id ? profileCache : null;
    const cacheFresh = cachedForUser && Date.now() - cachedForUser.fetchedAt < PROFILE_CACHE_TTL_MS;

    if (cacheFresh && !forceRefresh) {
      setProfile(cachedForUser.profile);
      setLoading(false);
      return;
    }

    // If we have stale cached data, use it while refreshing
    if (cachedForUser && !forceRefresh) {
      setProfile(cachedForUser.profile);
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
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
          attendance_mode: data.attendance_mode || 'online',
          is_suspended: data.is_suspended || false,
          theme_preference: data.theme_preference,
        };

        profileCache = { userId: user.id, profile: userProfile, fetchedAt: Date.now() };
        setProfile(userProfile);
        setError(null);
      } else {
        // Profile not found - may happen briefly after signup
        setProfile(null);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err as Error);
      // Keep stale data if we have it
      if (!profile && cachedForUser) {
        setProfile(cachedForUser.profile);
      }
    } finally {
      setLoading(false);
    }
  }, [authLoading, user, profile]);

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

  return {
    profile,
    loading,
    error,
    firstName,
    academicPath,
    refreshProfile: () => fetchProfile(true),
  };
};

// Clear cache on sign out (called from useAuth)
export const clearProfileCache = () => {
  profileCache = null;
};
