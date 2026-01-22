/**
 * Group Members Sheet
 * 
 * Shows members of a center group in a mobile-friendly bottom sheet.
 * Allows viewing student info and initiating transfers.
 */

import React, { useState, useEffect } from 'react';
import { Users, Phone, GraduationCap, ArrowRightLeft, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { CenterGroup, CenterGroupMember, useCenterGroups } from '@/hooks/useCenterGroups';
import { StudentGroupTransferDialog } from './StudentGroupTransferDialog';

interface GroupMembersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: CenterGroup | null;
  onMemberUpdated?: () => void;
}

const GRADE_LABELS: Record<string, { ar: string; en: string }> = {
  'second_secondary': { ar: 'تانية ثانوي', en: '2nd Secondary' },
  'third_secondary': { ar: 'تالته ثانوي', en: '3rd Secondary' },
};

const TRACK_LABELS: Record<string, { ar: string; en: string }> = {
  'arabic': { ar: 'عربي', en: 'Arabic' },
  'languages': { ar: 'لغات', en: 'Languages' },
};

export function GroupMembersSheet({
  open,
  onOpenChange,
  group,
  onMemberUpdated,
}: GroupMembersSheetProps) {
  const { language } = useLanguage();
  const { getGroupMembers } = useCenterGroups();
  const isArabic = language === 'ar';

  const [members, setMembers] = useState<CenterGroupMember[]>([]);
  const [loading, setLoading] = useState(false);

  // Transfer dialog state
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<CenterGroupMember | null>(null);

  // Fetch members when sheet opens
  useEffect(() => {
    if (open && group) {
      fetchMembers();
    }
  }, [open, group]);

  const fetchMembers = async () => {
    if (!group) return;

    setLoading(true);
    try {
      const data = await getGroupMembers(group.id);
      setMembers(data);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransferClick = (member: CenterGroupMember) => {
    setSelectedMember(member);
    setTransferDialogOpen(true);
  };

  const handleTransferComplete = () => {
    fetchMembers();
    onMemberUpdated?.();
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'active':
        return isArabic ? 'مفعل' : 'Active';
      case 'pending':
        return isArabic ? 'معلق' : 'Pending';
      default:
        return isArabic ? 'غير مشترك' : 'Not enrolled';
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent 
          side="bottom" 
          className="h-[85vh] rounded-t-2xl"
          dir={isArabic ? 'rtl' : 'ltr'}
        >
          <SheetHeader className="text-start pb-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {group?.name || (isArabic ? 'طلاب المجموعة' : 'Group Members')}
            </SheetTitle>
            <SheetDescription>
              {group ? (
                <span className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {GRADE_LABELS[group.grade]?.[isArabic ? 'ar' : 'en'] || group.grade}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {TRACK_LABELS[group.language_track]?.[isArabic ? 'ar' : 'en'] || group.language_track}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    • {members.length} {isArabic ? 'طالب' : 'students'}
                  </span>
                </span>
              ) : null}
            </SheetDescription>
          </SheetHeader>

          <div className="py-4 overflow-y-auto max-h-[calc(85vh-120px)]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse-dot"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {isArabic ? 'لا يوجد طلاب في هذه المجموعة' : 'No students in this group'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="bg-card border rounded-xl p-3 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <GraduationCap className="h-5 w-5 text-primary" />
                        </div>

                        {/* Info */}
                        <div className="min-w-0">
                          <h4 className="font-medium truncate">
                            {member.student?.full_name || (isArabic ? 'طالب' : 'Student')}
                          </h4>
                          {member.student?.phone && (
                            <a 
                              href={`tel:${member.student.phone}`}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mt-1"
                            >
                              <Phone className="h-3 w-3" />
                              <span dir="ltr">{member.student.phone}</span>
                            </a>
                          )}
                          <div className="flex items-center gap-1.5 mt-1.5">
                            {getStatusIcon(member.enrollment_status)}
                            <span className="text-xs text-muted-foreground">
                              {getStatusLabel(member.enrollment_status)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Transfer Button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="shrink-0 text-muted-foreground hover:text-primary"
                        onClick={() => handleTransferClick(member)}
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                        <span className="hidden sm:inline ms-1">
                          {isArabic ? 'نقل' : 'Transfer'}
                        </span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Transfer Dialog */}
      {selectedMember && group && (
        <StudentGroupTransferDialog
          open={transferDialogOpen}
          onOpenChange={setTransferDialogOpen}
          studentId={selectedMember.student_id}
          studentName={selectedMember.student?.full_name || ''}
          studentGrade={group.grade}
          studentLanguageTrack={group.language_track}
          currentGroupId={group.id}
          currentGroupName={group.name}
          onTransferComplete={handleTransferComplete}
        />
      )}
    </>
  );
}
