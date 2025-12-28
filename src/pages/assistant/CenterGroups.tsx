import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Users, Calendar, Clock, Edit, Trash2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/layout/Navbar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { canJoinCenterGroup } from '@/lib/academicValidation';

interface CenterGroup {
  id: string;
  name: string;
  grade: string;
  language_track: string;
  days_of_week: string[];
  time_slot: string;
  assistant_teacher_id: string;
  is_active: boolean;
  member_count?: number;
}

interface Student {
  user_id: string;
  full_name: string | null;
  attendance_mode: string;
  academic_year: string | null;
  language_track: string | null;
}

const DAYS_OPTIONS = [
  { value: 'saturday', labelAr: 'السبت', labelEn: 'Saturday' },
  { value: 'sunday', labelAr: 'الأحد', labelEn: 'Sunday' },
  { value: 'monday', labelAr: 'الاثنين', labelEn: 'Monday' },
  { value: 'tuesday', labelAr: 'الثلاثاء', labelEn: 'Tuesday' },
  { value: 'wednesday', labelAr: 'الأربعاء', labelEn: 'Wednesday' },
  { value: 'thursday', labelAr: 'الخميس', labelEn: 'Thursday' },
  { value: 'friday', labelAr: 'الجمعة', labelEn: 'Friday' },
];

const GRADE_OPTIONS = [
  { value: 'second_secondary', labelAr: 'تانية ثانوي', labelEn: '2nd Secondary' },
  { value: 'third_secondary', labelAr: 'تالته ثانوي', labelEn: '3rd Secondary' },
];

const TRACK_OPTIONS = [
  { value: 'arabic', labelAr: 'عربي', labelEn: 'Arabic' },
  { value: 'languages', labelAr: 'لغات', labelEn: 'Languages' },
];

export default function CenterGroups() {
  const navigate = useNavigate();
  const { language, isRTL } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const isArabic = language === 'ar';

  const [groups, setGroups] = useState<CenterGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isManageMembersOpen, setIsManageMembersOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<CenterGroup | null>(null);
  const [eligibleStudents, setEligibleStudents] = useState<Student[]>([]);
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    grade: '',
    language_track: '',
    days_of_week: [] as string[],
    time_slot: '09:00',
  });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('center_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch member counts
      const groupsWithCounts = await Promise.all(
        (data || []).map(async (group) => {
          const { count } = await supabase
            .from('center_group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id)
            .eq('is_active', true);
          return { ...group, member_count: count || 0 };
        })
      );

      setGroups(groupsWithCounts);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!formData.name || !formData.grade || !formData.language_track || formData.days_of_week.length === 0) {
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'يرجى ملء جميع الحقول' : 'Please fill all fields',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('center_groups').insert({
        name: formData.name,
        grade: formData.grade,
        language_track: formData.language_track,
        days_of_week: formData.days_of_week,
        time_slot: formData.time_slot,
        assistant_teacher_id: user?.id,
      });

      if (error) throw error;

      toast({
        title: isArabic ? 'تم بنجاح' : 'Success',
        description: isArabic ? 'تم إنشاء المجموعة' : 'Group created successfully',
      });

      setIsCreateOpen(false);
      setFormData({ name: '', grade: '', language_track: '', days_of_week: [], time_slot: '09:00' });
      fetchGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'فشل في إنشاء المجموعة' : 'Failed to create group',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const openManageMembers = async (group: CenterGroup) => {
    setSelectedGroup(group);
    setIsManageMembersOpen(true);

    try {
      // Fetch eligible students (center or hybrid, matching grade and track)
      const { data: students, error: studentsError } = await supabase
        .from('profiles')
        .select('user_id, full_name, attendance_mode, academic_year, language_track')
        .in('attendance_mode', ['center', 'hybrid'])
        .eq('academic_year', group.grade)
        .eq('language_track', group.language_track);

      if (studentsError) throw studentsError;
      setEligibleStudents(students || []);

      // Fetch current members
      const { data: members, error: membersError } = await supabase
        .from('center_group_members')
        .select('student_id')
        .eq('group_id', group.id)
        .eq('is_active', true);

      if (membersError) throw membersError;
      setGroupMembers((members || []).map((m) => m.student_id));
    } catch (error) {
      console.error('Error fetching members data:', error);
    }
  };

  const toggleMember = (studentId: string) => {
    const student = eligibleStudents.find(s => s.user_id === studentId);
    if (!student || !selectedGroup) return;
    
    // VALIDATION: Verify student can join this group
    const validation = canJoinCenterGroup(
      { 
        academic_year: student.academic_year, 
        language_track: student.language_track, 
        attendance_mode: student.attendance_mode 
      },
      { grade: selectedGroup.grade, language_track: selectedGroup.language_track }
    );
    
    if (!validation.allowed) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'غير مسموح' : 'Not Allowed',
        description: isArabic ? validation.messageAr : validation.message,
      });
      return;
    }
    
    setGroupMembers((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const saveMembers = async () => {
    if (!selectedGroup) return;

    setSaving(true);
    try {
      // Remove all existing members for this group
      await supabase.from('center_group_members').delete().eq('group_id', selectedGroup.id);

      // Insert new members
      if (groupMembers.length > 0) {
        const membersData = groupMembers.map((studentId) => ({
          group_id: selectedGroup.id,
          student_id: studentId,
        }));

        const { error } = await supabase.from('center_group_members').insert(membersData);
        if (error) throw error;
      }

      toast({
        title: isArabic ? 'تم بنجاح' : 'Success',
        description: isArabic ? 'تم تحديث الأعضاء' : 'Members updated successfully',
      });

      setIsManageMembersOpen(false);
      fetchGroups();
    } catch (error) {
      console.error('Error saving members:', error);
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'فشل في حفظ الأعضاء' : 'Failed to save members',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteGroup = async (groupId: string) => {
    if (!confirm(isArabic ? 'هل تريد حذف هذه المجموعة؟' : 'Delete this group?')) return;

    try {
      const { error } = await supabase.from('center_groups').delete().eq('id', groupId);
      if (error) throw error;

      toast({
        title: isArabic ? 'تم بنجاح' : 'Success',
        description: isArabic ? 'تم حذف المجموعة' : 'Group deleted',
      });

      fetchGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  const getDaysLabel = (days: string[]) => {
    return days
      .map((d) => {
        const day = DAYS_OPTIONS.find((opt) => opt.value === d);
        return isArabic ? day?.labelAr : day?.labelEn;
      })
      .join(' - ');
  };

  const getGradeLabel = (grade: string) => {
    const opt = GRADE_OPTIONS.find((g) => g.value === grade);
    return isArabic ? opt?.labelAr : opt?.labelEn;
  };

  const getTrackLabel = (track: string) => {
    const opt = TRACK_OPTIONS.find((t) => t.value === track);
    return isArabic ? opt?.labelAr : opt?.labelEn;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />

      <main className="container mx-auto px-4 py-8 pt-24 max-w-4xl">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/assistant')}>
              <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{isArabic ? 'مجموعات السنتر' : 'Center Groups'}</h1>
              <p className="text-sm text-muted-foreground">
                {isArabic ? 'إدارة مجموعات الحضور في السنتر' : 'Manage center attendance groups'}
              </p>
            </div>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                {isArabic ? 'مجموعة جديدة' : 'New Group'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{isArabic ? 'إنشاء مجموعة جديدة' : 'Create New Group'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">{isArabic ? 'اسم المجموعة' : 'Group Name'}</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={isArabic ? 'مثال: المجموعة أ - 9 صباحاً' : 'e.g. Group A - 9 AM'}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">{isArabic ? 'الصف' : 'Grade'}</label>
                  <Select value={formData.grade} onValueChange={(v) => setFormData({ ...formData, grade: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder={isArabic ? 'اختر الصف' : 'Select grade'} />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {isArabic ? opt.labelAr : opt.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">{isArabic ? 'المسار' : 'Track'}</label>
                  <Select value={formData.language_track} onValueChange={(v) => setFormData({ ...formData, language_track: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder={isArabic ? 'اختر المسار' : 'Select track'} />
                    </SelectTrigger>
                    <SelectContent>
                      {TRACK_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {isArabic ? opt.labelAr : opt.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">{isArabic ? 'أيام الحضور' : 'Days'}</label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OPTIONS.map((day) => (
                      <Button
                        key={day.value}
                        type="button"
                        size="sm"
                        variant={formData.days_of_week.includes(day.value) ? 'default' : 'outline'}
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            days_of_week: prev.days_of_week.includes(day.value)
                              ? prev.days_of_week.filter((d) => d !== day.value)
                              : [...prev.days_of_week, day.value],
                          }));
                        }}
                      >
                        {isArabic ? day.labelAr : day.labelEn}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">{isArabic ? 'الوقت' : 'Time'}</label>
                  <Input
                    type="time"
                    value={formData.time_slot}
                    onChange={(e) => setFormData({ ...formData, time_slot: e.target.value })}
                  />
                </div>
                <Button className="w-full" onClick={handleCreateGroup} disabled={saving}>
                  {saving ? (isArabic ? 'جاري الحفظ...' : 'Saving...') : isArabic ? 'إنشاء' : 'Create'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Groups List */}
        <div className="space-y-4">
          {groups.length === 0 ? (
            <div className="bg-card border rounded-xl p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">{isArabic ? 'لا توجد مجموعات' : 'No groups yet'}</h3>
              <p className="text-muted-foreground">{isArabic ? 'أنشئ أول مجموعة للبدء' : 'Create your first group to get started'}</p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.id} className="bg-card border rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{group.name}</h3>
                      {!group.is_active && (
                        <Badge variant="secondary">{isArabic ? 'غير نشط' : 'Inactive'}</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mb-3">
                      <Badge variant="outline">{getGradeLabel(group.grade)}</Badge>
                      <Badge variant="outline">{getTrackLabel(group.language_track)}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {getDaysLabel(group.days_of_week)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {group.time_slot}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {group.member_count} {isArabic ? 'طالب' : 'students'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openManageMembers(group)}>
                      <UserPlus className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteGroup(group.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Manage Members Dialog */}
        <Dialog open={isManageMembersOpen} onOpenChange={setIsManageMembersOpen}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isArabic ? 'إدارة أعضاء المجموعة' : 'Manage Group Members'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
              {isArabic
                  ? `الطلاب المؤهلين (${selectedGroup?.grade === 'second_secondary' ? 'تانية ثانوي' : 'تالته ثانوي'} - ${selectedGroup?.language_track === 'arabic' ? 'عربي' : 'لغات'})`
                  : `Eligible students (${selectedGroup?.grade === 'second_secondary' ? '2nd Secondary' : '3rd Secondary'} - ${selectedGroup?.language_track === 'arabic' ? 'Arabic' : 'Languages'})`}
              </p>

              {eligibleStudents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {isArabic ? 'لا يوجد طلاب مؤهلين' : 'No eligible students'}
                </p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {eligibleStudents.map((student) => (
                    <div
                      key={student.user_id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        groupMembers.includes(student.user_id)
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => toggleMember(student.user_id)}
                    >
                      <div className="flex items-center justify-between">
                        <span>{student.full_name || (isArabic ? 'بدون اسم' : 'No name')}</span>
                        <Badge variant="outline" className="text-xs">
                          {student.attendance_mode === 'center'
                            ? isArabic ? 'سنتر' : 'Center'
                            : isArabic ? 'هجين' : 'Hybrid'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button className="w-full" onClick={saveMembers} disabled={saving}>
                {saving
                  ? isArabic ? 'جاري الحفظ...' : 'Saving...'
                  : isArabic ? `حفظ (${groupMembers.length} طالب)` : `Save (${groupMembers.length} students)`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
