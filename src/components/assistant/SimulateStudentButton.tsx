/**
 * Simulate Student Button
 * 
 * Allows assistant teachers to simulate the student experience
 * for a specific student. Useful for debugging profile completion
 * and onboarding flows.
 */

import { useState } from 'react';
import { Eye, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface SimulateStudentButtonProps {
  studentId: string;
  studentName: string;
  grade: string | null;
  languageTrack: string | null;
  attendanceMode: 'online' | 'center' | 'hybrid' | null;
  isArabic?: boolean;
}

interface SimulationResult {
  profileComplete: boolean;
  hasActiveGroup: boolean | null;
  studyModeConfirmed: boolean;
  availableGroups: number;
  warnings: string[];
  details: {
    attendanceMode: string | null;
    grade: string | null;
    languageTrack: string | null;
    groupId: string | null;
    groupName: string | null;
  };
}

export function SimulateStudentButton({
  studentId,
  studentName,
  grade,
  languageTrack,
  attendanceMode,
  isArabic = true,
}: SimulateStudentButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const runSimulation = async () => {
    setLoading(true);
    setResult(null);

    try {
      // 1. Fetch profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('attendance_mode, grade, language_track, study_mode_confirmed')
        .eq('user_id', studentId)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      // 2. Check center group membership
      let hasActiveGroup: boolean | null = null;
      let groupId: string | null = null;
      let groupName: string | null = null;

      if (profile?.attendance_mode === 'center') {
        const { data: membership } = await supabase
          .from('center_group_members')
          .select('group_id, center_groups!inner(name)')
          .eq('student_id', studentId)
          .eq('is_active', true)
          .maybeSingle();

        hasActiveGroup = !!membership;
        if (membership) {
          groupId = membership.group_id;
          groupName = (membership.center_groups as any)?.name || null;
        }
      }

      // 3. Check available groups
      let availableGroups = 0;
      if (profile?.grade && profile?.language_track) {
        const { data: groups } = await supabase
          .rpc('get_center_groups_for_registration', {
            p_grade: profile.grade,
            p_language_track: profile.language_track,
          });
        availableGroups = groups?.length || 0;
      }

      // 4. Determine warnings
      const warnings: string[] = [];

      if (!profile?.attendance_mode) {
        warnings.push(isArabic ? 'لم يحدد نظام الدراسة' : 'Study mode not selected');
      }

      if (profile?.attendance_mode === 'hybrid') {
        warnings.push(isArabic ? 'نظام hybrid قديم - يحتاج تأكيد' : 'Legacy hybrid mode - needs confirmation');
      }

      if (profile?.attendance_mode === 'center' && !hasActiveGroup) {
        warnings.push(isArabic ? 'طالب سنتر بدون مجموعة نشطة!' : 'Center student without active group!');
      }

      if (profile?.attendance_mode === 'online' && !profile?.study_mode_confirmed) {
        warnings.push(isArabic ? 'طالب أونلاين لم يؤكد اختياره' : 'Online student not confirmed');
      }

      if (!profile?.grade) {
        warnings.push(isArabic ? 'لم يحدد الصف الدراسي' : 'Grade not selected');
      }

      if (!profile?.language_track) {
        warnings.push(isArabic ? 'لم يحدد نوع التعليم' : 'Track not selected');
      }

      // 5. Determine if profile is complete (using same logic as ProfileCompletionCheck)
      const profileComplete = Boolean(
        profile?.attendance_mode &&
        profile?.grade &&
        (profile?.attendance_mode !== 'center' || hasActiveGroup)
      );

      setResult({
        profileComplete,
        hasActiveGroup,
        studyModeConfirmed: profile?.study_mode_confirmed || false,
        availableGroups,
        warnings,
        details: {
          attendanceMode: profile?.attendance_mode || null,
          grade: profile?.grade || null,
          languageTrack: profile?.language_track || null,
          groupId,
          groupName,
        },
      });
    } catch (error) {
      console.error('[SimulateStudent] Error:', error);
      setResult({
        profileComplete: false,
        hasActiveGroup: null,
        studyModeConfirmed: false,
        availableGroups: 0,
        warnings: [isArabic ? 'فشل في تحميل البيانات' : 'Failed to load data'],
        details: {
          attendanceMode: null,
          grade: null,
          languageTrack: null,
          groupId: null,
          groupName: null,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    runSimulation();
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpen}
        className="gap-2"
      >
        <Eye className="h-4 w-4" />
        {isArabic ? 'معاينة كطالب' : 'Simulate Student'}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          // Extra top padding prevents the global close button (absolute top-right)
          // from overlapping/truncating the header on mobile.
          className="max-h-[85vh] rounded-t-2xl overflow-y-auto pt-10 pb-6"
        >
          <SheetHeader className="text-right">
            <SheetTitle className="flex items-center gap-2 justify-end">
              {isArabic ? 'معاينة تجربة الطالب' : 'Student Experience Simulation'}
              <Eye className="h-5 w-5 text-primary" />
            </SheetTitle>
            <SheetDescription className="text-right">
              {studentName}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : result ? (
              <div className="space-y-4">
                {/* Overall Status */}
                <div
                  className={cn(
                    'p-4 rounded-lg flex items-center gap-3',
                    result.profileComplete
                      ? 'bg-green-50 dark:bg-green-950/30'
                      : 'bg-red-50 dark:bg-red-950/30'
                  )}
                >
                  {result.profileComplete ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">
                      {result.profileComplete
                        ? isArabic ? 'الملف مكتمل ✅' : 'Profile Complete ✅'
                        : isArabic ? 'الملف غير مكتمل ❌' : 'Profile Incomplete ❌'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {result.profileComplete
                        ? isArabic ? 'الطالب سيدخل للمنصة مباشرة' : 'Student will enter platform directly'
                        : isArabic ? 'سيظهر للطالب نموذج استكمال البيانات' : 'Profile completion form will appear'}
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isArabic ? 'نظام الدراسة:' : 'Study Mode:'}</span>
                    <span className="font-medium">
                      {result.details.attendanceMode === 'center' ? (isArabic ? 'سنتر' : 'Center') :
                       result.details.attendanceMode === 'online' ? (isArabic ? 'أونلاين' : 'Online') :
                       result.details.attendanceMode === 'hybrid' ? (isArabic ? 'هجين (قديم)' : 'Hybrid (legacy)') :
                       isArabic ? 'غير محدد' : 'Not set'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isArabic ? 'تأكيد النظام:' : 'Mode Confirmed:'}</span>
                    <span className={cn('font-medium', result.studyModeConfirmed ? 'text-green-600' : 'text-amber-600')}>
                      {result.studyModeConfirmed ? (isArabic ? 'نعم ✓' : 'Yes ✓') : (isArabic ? 'لا' : 'No')}
                    </span>
                  </div>

                  {result.details.attendanceMode === 'center' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{isArabic ? 'المجموعة:' : 'Group:'}</span>
                        <span className={cn('font-medium', result.hasActiveGroup ? 'text-green-600' : 'text-red-600')}>
                          {result.details.groupName || (isArabic ? 'بدون مجموعة!' : 'No group!')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{isArabic ? 'مجموعات متاحة:' : 'Available Groups:'}</span>
                        <span className="font-medium">{result.availableGroups}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Warnings */}
                {result.warnings.length > 0 && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg space-y-1">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-medium">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {isArabic ? 'تحذيرات:' : 'Warnings:'}
                    </div>
                    <ul className="text-sm text-amber-600 dark:text-amber-400 space-y-1 pr-6">
                      {result.warnings.map((warning, i) => (
                        <li key={i}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Refresh Button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={runSimulation}
                >
                  {isArabic ? 'تحديث المعاينة' : 'Refresh Simulation'}
                </Button>
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
