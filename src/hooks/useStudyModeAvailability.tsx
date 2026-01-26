/**
 * Study Mode Availability Hook
 * 
 * Pre-fetches center group availability to determine which study modes
 * are selectable for a given grade and language track combination.
 * 
 * This prevents students from selecting a study mode that has no valid groups,
 * avoiding dead-end states during registration/profile completion.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StudyModeAvailability {
  online: {
    available: boolean;
    reason?: string;
  };
  center: {
    available: boolean;
    groupCount: number;
    reason?: string;
  };
}

interface UseStudyModeAvailabilityProps {
  grade: string | null;
  languageTrack: string | null;
}

interface UseStudyModeAvailabilityReturn {
  availability: StudyModeAvailability;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const DEFAULT_AVAILABILITY: StudyModeAvailability = {
  online: { available: true },
  center: { available: false, groupCount: 0 },
};

export function useStudyModeAvailability({
  grade,
  languageTrack,
}: UseStudyModeAvailabilityProps): UseStudyModeAvailabilityReturn {
  const [availability, setAvailability] = useState<StudyModeAvailability>(DEFAULT_AVAILABILITY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAvailability = useCallback(async () => {
    // Online is always available
    // Center requires checking for active groups matching grade/track
    
    if (!grade || !languageTrack) {
      setAvailability({
        online: { available: true },
        center: { 
          available: false, 
          groupCount: 0,
          reason: 'يرجى اختيار الصف الدراسي والمسار أولاً'
        },
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use the same RPC function as CenterGroupSelector for consistency
      const { data, error: rpcError } = await supabase
        .rpc('get_center_groups_for_registration', {
          p_grade: grade,
          p_language_track: languageTrack,
        });

      if (rpcError) {
        console.error('[useStudyModeAvailability] RPC error:', rpcError);
        throw rpcError;
      }

      const groupCount = data?.length || 0;
      const centerAvailable = groupCount > 0;

      setAvailability({
        online: { available: true },
        center: {
          available: centerAvailable,
          groupCount,
          reason: centerAvailable 
            ? undefined 
            : 'لا توجد مجموعات متاحة حالياً لهذا النظام',
        },
      });
    } catch (err) {
      console.error('[useStudyModeAvailability] Error:', err);
      setError(err as Error);
      // On error, default to showing center as unavailable
      setAvailability({
        online: { available: true },
        center: { 
          available: false, 
          groupCount: 0,
          reason: 'تعذر التحقق من المجموعات المتاحة'
        },
      });
    } finally {
      setLoading(false);
    }
  }, [grade, languageTrack]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  return {
    availability,
    loading,
    error,
    refetch: fetchAvailability,
  };
}
