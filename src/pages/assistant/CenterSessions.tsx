import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Calendar, Clock, Users, CheckCircle, XCircle } from 'lucide-react';
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
import { format } from 'date-fns';
// @ts-ignore - date-fns locale import
import { ar } from 'date-fns/locale/ar.js';

interface CenterGroup {
  id: string;
  name: string;
  grade: string;
  language_track: string;
  time_slot: string;
}

interface CenterSession {
  id: string;
  group_id: string;
  session_date: string;
  session_time: string;
  is_completed: boolean;
  notes: string | null;
  group?: CenterGroup;
  attendance_count?: number;
  member_count?: number;
}

interface Student {
  user_id: string;
  full_name: string | null;
}

interface AttendanceRecord {
  student_id: string;
  status: string;
}

export default function CenterSessions() {
  const navigate = useNavigate();
  const { language, isRTL } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const isArabic = language === 'ar';

  const [groups, setGroups] = useState<CenterGroup[]>([]);
  const [sessions, setSessions] = useState<CenterSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<CenterSession | null>(null);
  const [sessionStudents, setSessionStudents] = useState<Student[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('');

  const [formData, setFormData] = useState({
    group_id: '',
    session_date: format(new Date(), 'yyyy-MM-dd'),
    session_time: '09:00',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('center_groups')
        .select('id, name, grade, language_track, time_slot')
        .eq('is_active', true)
        .order('name');

      if (groupsError) throw groupsError;
      setGroups(groupsData || []);

      // Fetch sessions with group info
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('center_sessions')
        .select(`
          *,
          group:center_groups(id, name, grade, language_track, time_slot)
        `)
        .order('session_date', { ascending: false })
        .limit(50);

      if (sessionsError) throw sessionsError;

      // Fetch attendance counts for each session
      const sessionsWithCounts = await Promise.all(
        (sessionsData || []).map(async (session) => {
          const [{ count: attendanceCount }, { count: memberCount }] = await Promise.all([
            supabase
              .from('center_session_attendance')
              .select('*', { count: 'exact', head: true })
              .eq('session_id', session.id)
              .eq('status', 'present'),
            supabase
              .from('center_group_members')
              .select('*', { count: 'exact', head: true })
              .eq('group_id', session.group_id)
              .eq('is_active', true),
          ]);
          return { ...session, attendance_count: attendanceCount || 0, member_count: memberCount || 0 };
        })
      );

      setSessions(sessionsWithCounts);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    if (!formData.group_id || !formData.session_date) {
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'يرجى ملء جميع الحقول' : 'Please fill all fields',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('center_sessions').insert({
        group_id: formData.group_id,
        session_date: formData.session_date,
        session_time: formData.session_time,
        assistant_teacher_id: user?.id,
      });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: isArabic ? 'خطأ' : 'Error',
            description: isArabic ? 'هذه الجلسة موجودة بالفعل' : 'This session already exists',
            variant: 'destructive',
          });
          return;
        }
        throw error;
      }

      toast({
        title: isArabic ? 'تم بنجاح' : 'Success',
        description: isArabic ? 'تم إنشاء الجلسة' : 'Session created successfully',
      });

      setIsCreateOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'فشل في إنشاء الجلسة' : 'Failed to create session',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const openAttendance = async (session: CenterSession) => {
    setSelectedSession(session);
    setIsAttendanceOpen(true);

    try {
      // Fetch group members
      const { data: members, error: membersError } = await supabase
        .from('center_group_members')
        .select('student_id')
        .eq('group_id', session.group_id)
        .eq('is_active', true);

      if (membersError) throw membersError;

      const studentIds = (members || []).map((m) => m.student_id);

      if (studentIds.length === 0) {
        setSessionStudents([]);
        setAttendanceMap({});
        return;
      }

      // Fetch student profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', studentIds);

      if (profilesError) throw profilesError;
      setSessionStudents(profiles || []);

      // Fetch existing attendance
      const { data: attendance, error: attendanceError } = await supabase
        .from('center_session_attendance')
        .select('student_id, status')
        .eq('session_id', session.id);

      if (attendanceError) throw attendanceError;

      const map: Record<string, string> = {};
      (attendance || []).forEach((a) => {
        map[a.student_id] = a.status;
      });
      setAttendanceMap(map);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    }
  };

  const setStudentStatus = (studentId: string, status: string) => {
    setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
  };

  const markAllPresent = () => {
    const newMap: Record<string, string> = {};
    sessionStudents.forEach((s) => {
      newMap[s.user_id] = 'present';
    });
    setAttendanceMap(newMap);
  };

  const saveAttendance = async () => {
    if (!selectedSession || !user) return;

    setSaving(true);
    try {
      // Delete existing attendance for this session
      await supabase.from('center_session_attendance').delete().eq('session_id', selectedSession.id);

      // Insert new attendance records
      const records = Object.entries(attendanceMap).map(([studentId, status]) => ({
        session_id: selectedSession.id,
        student_id: studentId,
        status,
        marked_by: user.id,
      }));

      if (records.length > 0) {
        const { error } = await supabase.from('center_session_attendance').insert(records);
        if (error) throw error;
      }

      // Mark session as completed
      await supabase.from('center_sessions').update({ is_completed: true }).eq('id', selectedSession.id);

      toast({
        title: isArabic ? 'تم بنجاح' : 'Success',
        description: isArabic ? 'تم حفظ الحضور' : 'Attendance saved successfully',
      });

      setIsAttendanceOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'فشل في حفظ الحضور' : 'Failed to save attendance',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredSessions = selectedGroup
    ? sessions.filter((s) => s.group_id === selectedGroup)
    : sessions;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-mobile-nav" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />

      <main className="container mx-auto px-4 py-8 pt-24 max-w-4xl">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/assistant')}>
              <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{isArabic ? 'جلسات السنتر' : 'Center Sessions'}</h1>
              <p className="text-sm text-muted-foreground">
                {isArabic ? 'تسجيل حضور الجلسات' : 'Record session attendance'}
              </p>
            </div>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                {isArabic ? 'جلسة جديدة' : 'New Session'}
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{isArabic ? 'إنشاء جلسة جديدة' : 'Create New Session'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">{isArabic ? 'المجموعة' : 'Group'}</label>
                  <Select value={formData.group_id} onValueChange={(v) => setFormData({ ...formData, group_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder={isArabic ? 'اختر المجموعة' : 'Select group'} />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">{isArabic ? 'التاريخ' : 'Date'}</label>
                  <Input
                    type="date"
                    value={formData.session_date}
                    onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">{isArabic ? 'الوقت' : 'Time'}</label>
                  <Input
                    type="time"
                    value={formData.session_time}
                    onChange={(e) => setFormData({ ...formData, session_time: e.target.value })}
                  />
                </div>
                <Button className="w-full" onClick={handleCreateSession} disabled={saving}>
                  {saving ? (isArabic ? 'جاري الحفظ...' : 'Saving...') : isArabic ? 'إنشاء' : 'Create'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter by Group */}
        <div className="bg-card border rounded-xl p-4 mb-6">
          <label className="text-sm font-medium mb-2 block">{isArabic ? 'فلترة حسب المجموعة' : 'Filter by Group'}</label>
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger>
              <SelectValue placeholder={isArabic ? 'كل المجموعات' : 'All groups'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">{isArabic ? 'كل المجموعات' : 'All groups'}</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sessions List */}
        <div className="space-y-4">
          {filteredSessions.length === 0 ? (
            <div className="bg-card border rounded-xl p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">{isArabic ? 'لا توجد جلسات' : 'No sessions yet'}</h3>
              <p className="text-muted-foreground">{isArabic ? 'أنشئ أول جلسة للبدء' : 'Create your first session to get started'}</p>
            </div>
          ) : (
            filteredSessions.map((session) => (
              <div key={session.id} className="bg-card border rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{session.group?.name}</h3>
                      {session.is_completed ? (
                        <Badge className="bg-green-500/10 text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {isArabic ? 'مكتمل' : 'Completed'}
                        </Badge>
                      ) : (
                        <Badge variant="outline">{isArabic ? 'في الانتظار' : 'Pending'}</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(session.session_date), 'EEEE, d MMMM yyyy', { locale: isArabic ? ar : undefined })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {session.session_time}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {session.attendance_count}/{session.member_count} {isArabic ? 'حاضر' : 'present'}
                      </span>
                    </div>
                  </div>
                  <Button onClick={() => openAttendance(session)}>
                    {isArabic ? 'تسجيل الحضور' : 'Record Attendance'}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Attendance Dialog */}
        <Dialog open={isAttendanceOpen} onOpenChange={setIsAttendanceOpen}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isArabic ? 'تسجيل الحضور' : 'Record Attendance'} - {selectedSession?.group?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {format(new Date(selectedSession?.session_date || new Date()), 'EEEE, d MMMM yyyy', {
                    locale: isArabic ? ar : undefined,
                  })}
                </span>
                <Button variant="outline" size="sm" onClick={markAllPresent}>
                  {isArabic ? 'تحضير الكل' : 'Mark All Present'}
                </Button>
              </div>

              {sessionStudents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {isArabic ? 'لا يوجد طلاب في هذه المجموعة' : 'No students in this group'}
                </p>
              ) : (
                <div className="space-y-2">
                  {sessionStudents.map((student) => {
                    const status = attendanceMap[student.user_id] || '';
                    return (
                      <div key={student.user_id} className="p-3 rounded-lg border flex items-center justify-between">
                        <span>{student.full_name || (isArabic ? 'بدون اسم' : 'No name')}</span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={status === 'present' ? 'default' : 'outline'}
                            className={status === 'present' ? 'bg-green-600 hover:bg-green-700' : ''}
                            onClick={() => setStudentStatus(student.user_id, 'present')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={status === 'absent' ? 'default' : 'outline'}
                            className={status === 'absent' ? 'bg-red-600 hover:bg-red-700' : ''}
                            onClick={() => setStudentStatus(student.user_id, 'absent')}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <Button className="w-full" onClick={saveAttendance} disabled={saving}>
                {saving
                  ? isArabic ? 'جاري الحفظ...' : 'Saving...'
                  : isArabic
                  ? `حفظ (${Object.values(attendanceMap).filter((s) => s === 'present').length} حاضر)`
                  : `Save (${Object.values(attendanceMap).filter((s) => s === 'present').length} present)`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
