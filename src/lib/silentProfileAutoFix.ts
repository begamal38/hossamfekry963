/**
 * Silent Profile Auto-Fix Layer
 * 
 * Runs on login to silently fix incomplete/inconsistent profiles.
 * Students never see errors or prompts unless absolutely necessary.
 * 
 * RULES:
 * 1. If fix succeeds → no message, no prompt
 * 2. If fix fails → show ProfileCompletionPrompt only (no error toast)
 */

import { supabase } from '@/integrations/supabase/client';

interface AutoFixResult {
  fixed: boolean;
  stillIncomplete: boolean;
  actions: string[];
}

/**
 * Attempt to silently fix a student's profile inconsistencies.
 * Called on login before showing any prompts.
 */
export async function attemptSilentProfileFix(userId: string): Promise<AutoFixResult> {
  const result: AutoFixResult = {
    fixed: false,
    stillIncomplete: false,
    actions: [],
  };

  try {
    // Fetch current profile state
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('attendance_mode, grade, language_track, study_mode_confirmed')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError || !profile) {
      result.stillIncomplete = true;
      return result;
    }

    // ========== FIX 1: Normalize legacy 'hybrid' to 'online' ==========
    if (profile.attendance_mode === 'hybrid') {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          attendance_mode: 'online',
          study_mode_confirmed: true // Lock it
        })
        .eq('user_id', userId);

      if (!updateError) {
        result.fixed = true;
        result.actions.push('normalized_hybrid_to_online');
      }
    }

    // ========== FIX 2: Online student with orphan group membership ==========
    if (profile.attendance_mode === 'online') {
      // Deactivate any leftover group memberships
      const { data: memberships } = await supabase
        .from('center_group_members')
        .select('id')
        .eq('student_id', userId)
        .eq('is_active', true);

      if (memberships && memberships.length > 0) {
        await supabase
          .from('center_group_members')
          .update({ is_active: false })
          .eq('student_id', userId);

        result.fixed = true;
        result.actions.push('deactivated_orphan_memberships');
      }
    }

    // ========== FIX 3: Center student without active membership ==========
    if (profile.attendance_mode === 'center') {
      const { data: activeMembership } = await supabase
        .from('center_group_members')
        .select('id, group_id')
        .eq('student_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (!activeMembership) {
        // Check if they have an inactive membership we can reactivate
        const { data: inactiveMembership } = await supabase
          .from('center_group_members')
          .select('id, group_id')
          .eq('student_id', userId)
          .eq('is_active', false)
          .order('enrolled_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (inactiveMembership) {
          // Verify the group is still valid
          const { data: group } = await supabase
            .rpc('get_center_groups_for_registration', {
              p_grade: profile.grade || '',
              p_language_track: profile.language_track || '',
            });

          const groupStillValid = group?.some((g: { id: string }) => g.id === inactiveMembership.group_id);

          if (groupStillValid) {
            await supabase
              .from('center_group_members')
              .update({ is_active: true })
              .eq('id', inactiveMembership.id);

            result.fixed = true;
            result.actions.push('reactivated_membership');
          } else {
            // Group no longer valid - student must re-select
            result.stillIncomplete = true;
          }
        } else {
          // No membership at all - needs to select group
          result.stillIncomplete = true;
        }
      }
    }

    // ========== FIX 4: Missing study_mode_confirmed for online students ==========
    if (profile.attendance_mode === 'online' && !profile.study_mode_confirmed) {
      // Online students with valid attendance_mode can be auto-confirmed
      const { error: confirmError } = await supabase
        .from('profiles')
        .update({ study_mode_confirmed: true })
        .eq('user_id', userId);

      if (!confirmError) {
        result.fixed = true;
        result.actions.push('auto_confirmed_online_student');
      }
    }

    // ========== Determine final state ==========
    if (!profile.attendance_mode || !profile.grade) {
      result.stillIncomplete = true;
    }

  } catch (error) {
    console.warn('[SilentAutoFix] Exception:', error);
    // On error, assume profile needs completion check
    result.stillIncomplete = true;
  }

  return result;
}

/**
 * Re-fetch and validate group availability.
 * Used before save to prevent "group no longer available" errors.
 */
export async function refreshGroupAvailability(
  grade: string,
  languageTrack: string,
  selectedGroupId: string
): Promise<{ available: boolean; groups: Array<{ id: string; name: string }> }> {
  try {
    const { data, error } = await supabase
      .rpc('get_center_groups_for_registration', {
        p_grade: grade,
        p_language_track: languageTrack,
      });

    if (error) {
      console.error('[refreshGroupAvailability] RPC error:', error);
      return { available: false, groups: [] };
    }

    const groups = data || [];
    const available = groups.some((g: { id: string }) => g.id === selectedGroupId);

    return { available, groups };
  } catch (error) {
    console.error('[refreshGroupAvailability] Exception:', error);
    return { available: false, groups: [] };
  }
}
