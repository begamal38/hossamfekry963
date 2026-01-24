/**
 * Center Group Selector
 * 
 * Component for students to select a center group during registration
 * or profile completion. Dynamically filters groups by grade and track.
 */

import React, { useState, useEffect } from 'react';
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
import { Users, Clock, Calendar, AlertCircle } from 'lucide-react';
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
  grade: string; // second_secondary or third_secondary
  languageTrack: string; // arabic or languages
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
  const { language, isRTL } = useLanguage();
  const isArabic = language === 'ar';
  const [groups, setGroups] = useState<CenterGroup[]>([]);
  const [loading, setLoading] = useState(false);

  const tr = (ar: string, en: string) => isArabic ? ar : en;

  // Fetch groups when grade/track changes
  useEffect(() => {
    const fetchGroups = async () => {
      if (!grade || !languageTrack) {
        setGroups([]);
        return;
      }

      setLoading(true);
      try {
        console.log('[CenterGroupSelector] Fetching groups for:', { grade, languageTrack });
        
        const { data, error } = await supabase
          .from('center_groups')
          .select('*')
          .eq('grade', grade)
          .eq('language_track', languageTrack)
          .eq('is_active', true)
          .order('name');

        if (error) {
          console.error('[CenterGroupSelector] Query error:', error);
          throw error;
        }
        
        console.log('[CenterGroupSelector] Found groups:', data?.length || 0);
        setGroups(data || []);
      } catch (err) {
        console.error('[CenterGroupSelector] Error fetching center groups:', err);
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [grade, languageTrack]);

  // Reset selection when groups change
  useEffect(() => {
    if (value && !groups.find(g => g.id === value)) {
      onChange(null);
    }
  }, [groups, value, onChange]);

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
        {tr('مجموعة السنتر', 'مجموعة السنتر')}
      </label>

      {loading ? (
        <div className="h-12 flex items-center justify-center border rounded-xl bg-muted/50">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
        </div>
      ) : groups.length === 0 ? (
        <div className="flex items-center gap-2 p-3 rounded-xl border border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="text-sm">
            {tr(
              'لا توجد مجموعات متاحة حالياً للصف والمسار المحدد',
              'لا توجد مجموعات متاحة حالياً للصف والمسار المحدد'
            )}
          </span>
        </div>
      ) : (
        <>
          <Select value={value || ''} onValueChange={onChange} disabled={disabled}>
            <SelectTrigger className={cn("h-12", error && "border-destructive")}>
              <SelectValue placeholder={tr('اختر مجموعة السنتر', 'اختر مجموعة السنتر')} />
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

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
