/**
 * Force Move to Center Dialog
 * 
 * TEMPORARY ADMIN EMERGENCY ACTION
 * Allows assistant teachers to move online students to center mode.
 * This is an administrative correction that does NOT touch enrollments, progress, or focus data.
 */

import React, { useState, useEffect } from 'react';
import { MapPin, AlertTriangle, Users, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface CenterGroup {
  id: string;
  name: string;
  grade: string;
  language_track: string;
  days_of_week: string[];
  time_slot: string;
  is_active: boolean;
}

interface ForceMoveToCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
  studentGrade: string | null;
  studentLanguageTrack: string | null;
  onMoveComplete: () => void;
}

const GRADE_LABELS: Record<string, { ar: string; en: string }> = {
  'second_secondary': { ar: 'تانية ثانوي', en: '2nd Secondary' },
  'third_secondary': { ar: 'تالته ثانوي', en: '3rd Secondary' },
};

const TRACK_LABELS: Record<string, { ar: string; en: string }> = {
  'arabic': { ar: 'عربي', en: 'Arabic' },
  'languages': { ar: 'لغات', en: 'Languages' },
};

const DAY_LABELS: Record<string, { ar: string; en: string }> = {
  'saturday': { ar: 'السبت', en: 'Sat' },
  'sunday': { ar: 'الأحد', en: 'Sun' },
  'monday': { ar: 'الاثنين', en: 'Mon' },
  'tuesday': { ar: 'الثلاثاء', en: 'Tue' },
  'wednesday': { ar: 'الأربعاء', en: 'Wed' },
  'thursday': { ar: 'الخميس', en: 'Thu' },
  'friday': { ar: 'الجمعة', en: 'Fri' },
};

export function ForceMoveToCenter({
  open,
  onOpenChange,
  studentId,
  studentName,
  studentGrade,
  studentLanguageTrack,
  onMoveComplete,
}: ForceMoveToCenterProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const isArabic = language === 'ar';

  const [availableGroups, setAvailableGroups] = useState<CenterGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fetchingGroups, setFetchingGroups] = useState(true);

  // Fetch eligible groups (matching grade/track)
  useEffect(() => {
    if (!open || !studentGrade || !studentLanguageTrack) return;

    const fetchEligibleGroups = async () => {
      setFetchingGroups(true);
      try {
        const { data, error } = await supabase
          .from('center_groups')
          .select('*')
          .eq('grade', studentGrade)
          .eq('language_track', studentLanguageTrack)
          .eq('is_active', true)
          .order('name');

        if (error) throw error;

        setAvailableGroups(data || []);
      } catch (error) {
        console.error('Error fetching eligible groups:', error);
        toast({
          variant: 'destructive',
          title: isArabic ? 'خطأ' : 'Error',
          description: isArabic ? 'فشل تحميل المجموعات' : 'Failed to load groups',
        });
      } finally {
        setFetchingGroups(false);
      }
    };

    fetchEligibleGroups();
  }, [open, studentGrade, studentLanguageTrack, isArabic, toast]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedGroupId('');
    }
  }, [open]);

  const formatDays = (days: string[]) => {
    return days.map(d => DAY_LABELS[d]?.[isArabic ? 'ar' : 'en'] || d).join(', ');
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? (isArabic ? 'م' : 'PM') : (isArabic ? 'ص' : 'AM');
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleMove = async () => {
    if (!selectedGroupId || !user) return;

    setLoading(true);
    try {
      // 1. Update profile: attendance_mode = 'center', study_mode_confirmed = true
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          attendance_mode: 'center',
          study_mode_confirmed: true
        })
        .eq('user_id', studentId);

      if (profileError) throw profileError;

      // 2. Check if membership record already exists for this group
      const { data: existingMembership } = await supabase
        .from('center_group_members')
        .select('id, is_active')
        .eq('student_id', studentId)
        .eq('group_id', selectedGroupId)
        .maybeSingle();

      if (existingMembership) {
        // Reactivate existing membership
        await supabase
          .from('center_group_members')
          .update({ is_active: true, enrolled_at: new Date().toISOString() })
          .eq('id', existingMembership.id);
      } else {
        // Create new membership
        const { error: memberError } = await supabase
          .from('center_group_members')
          .insert({
            group_id: selectedGroupId,
            student_id: studentId,
            is_active: true,
          });

        if (memberError) throw memberError;
      }

      // 3. Log action in assistant_action_logs
      await supabase.from('assistant_action_logs').insert({
        assistant_id: user.id,
        student_id: studentId,
        action_type: 'FORCE_MOVE_TO_CENTER',
        action_details: {
          previous_mode: 'online',
          new_mode: 'center',
          new_group_id: selectedGroupId,
          new_group_name: availableGroups.find(g => g.id === selectedGroupId)?.name,
        },
      });

      toast({
        title: isArabic ? 'تم النقل بنجاح!' : 'Move Successful!',
        description: isArabic 
          ? 'تم نقل الطالب للسنتر بنجاح'
          : 'Student moved to center successfully',
      });

      onMoveComplete();
      onOpenChange(false);
    } catch (error) {
      console.error('Error moving student to center:', error);
      toast({
        variant: 'destructive',
        title: isArabic ? 'فشل النقل' : 'Move Failed',
        description: isArabic ? 'حدث خطأ أثناء نقل الطالب' : 'An error occurred during move',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedGroup = availableGroups.find(g => g.id === selectedGroupId);

  // Cannot move if student doesn't have grade/track
  const canMove = studentGrade && studentLanguageTrack;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir={isArabic ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {isArabic ? 'نقل إلى سنتر' : 'Move to Center'}
          </DialogTitle>
          <DialogDescription>
            {isArabic 
              ? 'سيتم تحويل الطالب من أونلاين إلى حضور سنتر'
              : 'Student will be converted from online to center attendance'}
          </DialogDescription>
        </DialogHeader>

        {!canMove ? (
          <div className="py-6 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
            <p className="text-muted-foreground">
              {isArabic 
                ? 'بيانات الطالب غير مكتملة (الصف أو الشعبة)'
                : 'Student data incomplete (grade or track missing)'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Student Info */}
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="font-medium">{studentName}</p>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {GRADE_LABELS[studentGrade]?.[isArabic ? 'ar' : 'en'] || studentGrade}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {TRACK_LABELS[studentLanguageTrack]?.[isArabic ? 'ar' : 'en'] || studentLanguageTrack}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {isArabic ? 'أونلاين' : 'Online'}
                </Badge>
              </div>
            </div>

            {/* Target Group Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {isArabic ? 'اختر المجموعة' : 'Select Group'}
              </label>
              {fetchingGroups ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  {isArabic ? 'جاري التحميل...' : 'Loading...'}
                </div>
              ) : availableGroups.length === 0 ? (
                <div className="text-center py-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {isArabic 
                      ? 'لا توجد مجموعات متاحة بنفس الصف والشعبة'
                      : 'No groups available for the same grade and track'}
                  </p>
                </div>
              ) : (
                <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                  <SelectTrigger>
                    <SelectValue placeholder={isArabic ? 'اختر المجموعة' : 'Select group'} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableGroups.map(group => (
                      <SelectItem key={group.id} value={group.id}>
                        <div className="flex flex-col">
                          <span>{group.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDays(group.days_of_week)} - {formatTime(group.time_slot)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Selected Group Preview */}
            {selectedGroup && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="font-medium">{selectedGroup.name}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDays(selectedGroup.days_of_week)} - {formatTime(selectedGroup.time_slot)}
                </p>
              </div>
            )}

            {/* Admin Notice */}
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-700">
                  {isArabic ? 'إجراء إداري' : 'Administrative Action'}
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  {isArabic 
                    ? 'هذا الإجراء لن يؤثر على اشتراكات الطالب أو تقدمه أو بيانات التركيز. سيظهر الطالب فوراً في قوائم المجموعة.'
                    : 'This action will NOT affect enrollments, progress, or focus data. Student will appear immediately in group lists.'}
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {isArabic ? 'إلغاء' : 'Cancel'}
          </Button>
          {canMove && availableGroups.length > 0 && (
            <Button 
              onClick={handleMove} 
              disabled={!selectedGroupId || loading}
            >
              {loading 
                ? (isArabic ? 'جاري النقل...' : 'Moving...')
                : (isArabic ? 'تأكيد النقل' : 'Confirm Move')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
