/**
 * Student Group Transfer Dialog
 * 
 * Allows admin/assistant teachers to transfer center students between groups.
 * Validates same grade/track requirement and preserves all student data.
 */

import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, AlertTriangle, Users, CheckCircle } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
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

interface StudentGroupTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
  studentGrade: string | null;
  studentLanguageTrack: string | null;
  currentGroupId: string | null;
  currentGroupName: string | null;
  onTransferComplete: () => void;
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

export function StudentGroupTransferDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
  studentGrade,
  studentLanguageTrack,
  currentGroupId,
  currentGroupName,
  onTransferComplete,
}: StudentGroupTransferDialogProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const isArabic = language === 'ar';

  const [availableGroups, setAvailableGroups] = useState<CenterGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingGroups, setFetchingGroups] = useState(true);

  // Fetch eligible groups (same grade/track, excluding current group)
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

        // Filter out current group
        const filtered = (data || []).filter(g => g.id !== currentGroupId);
        setAvailableGroups(filtered);
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
  }, [open, studentGrade, studentLanguageTrack, currentGroupId, isArabic, toast]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedGroupId('');
      setReason('');
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

  const handleTransfer = async () => {
    if (!selectedGroupId || !user) return;

    setLoading(true);
    try {
      // 1. Deactivate current group membership
      if (currentGroupId) {
        await supabase
          .from('center_group_members')
          .update({ is_active: false })
          .eq('student_id', studentId)
          .eq('group_id', currentGroupId);
      }

      // 2. Check if membership record exists for new group
      const { data: existingMembership } = await supabase
        .from('center_group_members')
        .select('id')
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
        await supabase
          .from('center_group_members')
          .insert({
            group_id: selectedGroupId,
            student_id: studentId,
            is_active: true,
          });
      }

      // 3. Log the transfer event
      const { error: transferLogError } = await supabase
        .from('center_group_transfers')
        .insert({
          student_id: studentId,
          previous_group_id: currentGroupId,
          new_group_id: selectedGroupId,
          performed_by: user.id,
          reason: reason.trim() || null,
        });

      if (transferLogError) {
        console.error('Failed to log transfer:', transferLogError);
        // Non-blocking - transfer already succeeded
      }

      // 4. Log action for assistant dashboard
      await supabase.from('assistant_action_logs').insert({
        assistant_id: user.id,
        student_id: studentId,
        action_type: 'group_transfer',
        action_details: {
          previous_group_id: currentGroupId,
          previous_group_name: currentGroupName,
          new_group_id: selectedGroupId,
          new_group_name: availableGroups.find(g => g.id === selectedGroupId)?.name,
          reason: reason.trim() || null,
        },
      });

      toast({
        title: isArabic ? 'تم النقل بنجاح!' : 'Transfer Successful!',
        description: isArabic 
          ? 'تم نقل الطالب للمجموعة الجديدة مع الحفاظ على كل بياناته'
          : 'Student transferred to new group with all data preserved',
      });

      onTransferComplete();
      onOpenChange(false);
    } catch (error) {
      console.error('Error transferring student:', error);
      toast({
        variant: 'destructive',
        title: isArabic ? 'فشل النقل' : 'Transfer Failed',
        description: isArabic ? 'حدث خطأ أثناء نقل الطالب' : 'An error occurred during transfer',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedGroup = availableGroups.find(g => g.id === selectedGroupId);

  // Cannot transfer if student doesn't have grade/track
  const canTransfer = studentGrade && studentLanguageTrack && currentGroupId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir={isArabic ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            {isArabic ? 'نقل الطالب لمجموعة أخرى' : 'Transfer Student to Another Group'}
          </DialogTitle>
          <DialogDescription>
            {isArabic 
              ? 'سيتم الحفاظ على كل تقدم الطالب والاشتراكات والامتحانات'
              : 'All student progress, enrollments, and exam results will be preserved'}
          </DialogDescription>
        </DialogHeader>

        {!canTransfer ? (
          <div className="py-6 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
            <p className="text-muted-foreground">
              {!currentGroupId
                ? (isArabic ? 'هذا الطالب غير منضم لأي مجموعة حالياً' : 'This student is not assigned to any group')
                : (isArabic ? 'بيانات الطالب غير مكتملة (الصف أو الشعبة)' : 'Student data incomplete (grade or track missing)')}
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
              </div>
            </div>

            {/* Current Group */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                {isArabic ? 'المجموعة الحالية' : 'Current Group'}
              </label>
              <div className="flex items-center gap-2 p-2 border rounded-lg bg-background">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{currentGroupName || (isArabic ? 'غير محدد' : 'Unknown')}</span>
              </div>
            </div>

            {/* Target Group Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {isArabic ? 'نقل إلى مجموعة' : 'Transfer to Group'}
              </label>
              {fetchingGroups ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  {isArabic ? 'جاري التحميل...' : 'Loading...'}
                </div>
              ) : availableGroups.length === 0 ? (
                <div className="text-center py-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {isArabic 
                      ? 'لا توجد مجموعات أخرى متاحة بنفس الصف والشعبة'
                      : 'No other groups available for the same grade and track'}
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

            {/* Transfer Reason (optional) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {isArabic ? 'سبب النقل (اختياري)' : 'Transfer Reason (optional)'}
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={isArabic ? 'مثال: تغيير موعد الطالب...' : 'e.g., Schedule change...'}
                rows={2}
              />
            </div>

            {/* Warning Notice */}
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-700">
                  {isArabic ? 'ملاحظة مهمة' : 'Important Note'}
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  {isArabic 
                    ? 'سيتم الاحتفاظ بكل تقدم الطالب وسجل الامتحانات والاشتراكات. جلسات التركيز السابقة ستظل مرتبطة بالمجموعة القديمة للتقارير.'
                    : 'All student progress, exam records, and enrollments will be preserved. Past focus sessions will remain linked to the original group for historical reporting.'}
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {isArabic ? 'إلغاء' : 'Cancel'}
          </Button>
          {canTransfer && availableGroups.length > 0 && (
            <Button 
              onClick={handleTransfer} 
              disabled={!selectedGroupId || loading}
            >
              {loading 
                ? (isArabic ? 'جاري النقل...' : 'Transferring...')
                : (isArabic ? 'تأكيد النقل' : 'Confirm Transfer')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
