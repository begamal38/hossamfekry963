/**
 * Center Group Selector
 * 
 * Component for students to select a center group during registration
 * or profile completion. Dynamically filters groups by grade and track.
 * 
 * SMART VALIDATION: Auto-resets invalid group selections and provides
 * contextual guidance instead of generic errors.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, Calendar, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CenterGroup {
  id: string;
  name: string;
  grade: string;
  language_track: string;
  days_of_week: string[];
  time_slot: string;
  is_active: boolean;
}

interface CenterGroupSelectorProps {
  grade: string;
  languageTrack: string;
  value: string | null;
  onChange: (groupId: string | null) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

// Day labels
const DAY_LABELS: Record<string, { ar: string; en: string }> = {
  saturday: { ar: 'سبت', en: 'Sat' },
  sunday: { ar: 'أحد', en: 'Sun' },
  monday: { ar: 'اثنين', en: 'Mon' },
  tuesday: { ar: 'ثلاثاء', en: 'Tue' },
  wednesday: { ar: 'أربعاء', en: 'Wed' },
  thursday: { ar: 'خميس', en: 'Thu' },
  friday: { ar: 'جمعة', en: 'Fri' },
};

export function CenterGroupSelector({
  grade,
  languageTrack,
  value,
  onChange,
  error,
  disabled,
  className,
}: CenterGroupSelectorProps) {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [groups, setGroups] = useState<CenterGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const previousParamsRef = useRef({ grade: '', languageTrack: '' });

  const tr = (ar: string, en: string) => isArabic ? ar : en;

  // Fetch groups when grade/track changes using secure RPC function
  const fetchGroups = useCallback(async () => {
    if (!grade || !languageTrack) {
      setGroups([]);
      return;
    }

    // Avoid duplicate fetches for same params
    if (previousParamsRef.current.grade === grade && 
        previousParamsRef.current.languageTrack === languageTrack &&
        groups.length > 0) {
      return;
    }

    previousParamsRef.current = { grade, languageTrack };
    setLoading(true);
    setFetchError(null);

    try {
      console.log('[CenterGroupSelector] Fetching groups via RPC for:', { grade, languageTrack });
      
      const { data, error } = await supabase
        .rpc('get_center_groups_for_registration', {
          p_grade: grade,
          p_language_track: languageTrack
        });

      if (error) {
        console.error('[CenterGroupSelector] RPC error:', error);
        throw error;
      }
      
      // Map RPC result to CenterGroup interface
      const mappedGroups: CenterGroup[] = (data || []).map((g: any) => ({
        id: g.id,
        name: g.name,
        grade: g.grade,
        language_track: g.language_track,
        days_of_week: g.days_of_week,
        time_slot: g.time_slot,
        is_active: true,
      }));
      
      console.log('[CenterGroupSelector] Found groups:', mappedGroups.length);
      setGroups(mappedGroups);
    } catch (err) {
      console.error('[CenterGroupSelector] Error fetching center groups:', err);
      setFetchError(tr(
        'تعذر تحميل المجموعات. يرجى المحاولة مرة أخرى.',
        'Failed to load groups. Please try again.'
      ));
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [grade, languageTrack, groups.length, tr]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // SMART AUTO-RESET: Reset selection if the selected group is no longer valid
  useEffect(() => {
    if (value && groups.length > 0) {
      const selectedGroupStillValid = groups.some(g => g.id === value);
      if (!selectedGroupStillValid) {
        console.log('[CenterGroupSelector] Auto-resetting invalid group selection:', value);
        onChange(null);
      }
    }
  }, [groups, value, onChange]);

  // Handle retry on fetch error
  const handleRetry = () => {
    previousParamsRef.current = { grade: '', languageTrack: '' }; // Force refetch
    fetchGroups();
  };

  // Format days for display
  const formatDays = (days: string[]) => {
    return days
      .map(day => DAY_LABELS[day]?.[isArabic ? 'ar' : 'en'] || day)
      .join(' - ');
  };

  // Format time for display
  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? (isArabic ? 'م' : 'PM') : (isArabic ? 'ص' : 'AM');
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch {
      return time;
    }
  };

  if (!grade || !languageTrack) {
    return null;
  }

  const selectedGroup = groups.find(g => g.id === value);

  return (
    <div className={cn("space-y-2", className)}>
      <label className="flex items-center gap-2 text-sm font-medium">
        <Users className="h-4 w-4 text-muted-foreground" />
        {tr('مجموعة السنتر', 'Center Group')}
      </label>

      {loading ? (
        <div className="h-12 flex items-center justify-center border rounded-lg bg-muted/50">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
        </div>
      ) : fetchError ? (
        // Error state with retry option
        <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/50 bg-destructive/10">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="text-sm">{fetchError}</span>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="flex items-center gap-1 text-sm text-primary hover:underline transition-all duration-150 active:scale-[0.98]"
          >
            <RefreshCw className="h-3 w-3" />
            {tr('إعادة المحاولة', 'Retry')}
          </button>
        </div>
      ) : groups.length === 0 ? (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="text-sm">
            {tr(
              'لا توجد مجموعات متاحة حالياً للصف والمسار المحدد',
              'No groups available for the selected grade and track'
            )}
          </span>
        </div>
      ) : (
        <>
          <Select value={value || ''} onValueChange={onChange} disabled={disabled}>
            <SelectTrigger className={cn("h-12 rounded-lg", error && "border-destructive")}>
              <SelectValue placeholder={tr('اختر مجموعة السنتر', 'Select center group')} />
            </SelectTrigger>
            <SelectContent>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id} className="py-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{group.name}</span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDays(group.days_of_week)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(group.time_slot)}
                      </span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Selected group details */}
          {selectedGroup && (
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDays(selectedGroup.days_of_week)}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {formatTime(selectedGroup.time_slot)}
              </Badge>
            </div>
          )}
        </>
      )}

      {/* Contextual error message instead of generic */}
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}
