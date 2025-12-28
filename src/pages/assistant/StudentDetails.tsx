import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, User, Phone, GraduationCap, Calendar, BookOpen, Video, Building, Award, 
  Mail, Globe, MapPin, Layers, AlertCircle, RefreshCw, Bell, FileText, Shield, ShieldOff,
  Clock, Plus, Trash2, Edit2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Navbar } from '@/components/layout/Navbar';

interface StudentProfile {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  grade: string | null;
  academic_year: string | null;
  language_track: string | null;
  attendance_mode: 'online' | 'center' | 'hybrid';
  is_suspended: boolean;
  created_at: string;
  updated_at: string;
}

interface Enrollment {
  id: string;
  course_id: string;
  status: string;
  progress: number | null;
  completed_lessons: number | null;
  enrolled_at: string;
  course: {
    id: string;
    title: string;
    title_ar: string;
    lessons_count: number | null;
  };
}

interface ExamResult {
  id: string;
  score: number;
  notes: string | null;
  created_at: string;
  exam: {
    id: string;
    title: string;
    title_ar: string;
    max_score: number;
    exam_date: string | null;
    course: {
      title: string;
      title_ar: string;
    };
  };
}

interface StudentNote {
  id: string;
  note: string;
  assistant_id: string;
  created_at: string;
}

interface AttendanceStats {
  online_count: number;
  center_count: number;
  total_count: number;
}

const ATTENDANCE_MODE_CONFIG = {
  online: { ar: 'أونلاين', en: 'Online', icon: Globe, color: 'text-purple-600 bg-purple-100' },
  center: { ar: 'سنتر', en: 'Center', icon: MapPin, color: 'text-blue-600 bg-blue-100' },
  hybrid: { ar: 'هجين', en: 'Hybrid', icon: Layers, color: 'text-amber-600 bg-amber-100' },
};

const ACADEMIC_YEAR_LABELS: Record<string, { ar: string; en: string }> = {
  'second_secondary': { ar: 'تانية ثانوي', en: '2nd Secondary' },
  'third_secondary': { ar: 'تالته ثانوي', en: '3rd Secondary' },
};

const LANGUAGE_TRACK_LABELS: Record<string, { ar: string; en: string }> = {
  'arabic': { ar: 'عربي', en: 'Arabic' },
  'languages': { ar: 'لغات', en: 'Languages' },
};

export default function StudentDetails() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { canAccessDashboard, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const isArabic = language === 'ar';

  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({ online_count: 0, center_count: 0, total_count: 0 });
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [notes, setNotes] = useState<StudentNote[]>([]);
  const [loading, setLoading] = useState(true);

  // Action dialogs
  const [modeDialogOpen, setModeDialogOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'online' | 'center' | 'hybrid'>('online');
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [resetProgressDialogOpen, setResetProgressDialogOpen] = useState(false);
  const [selectedCourseForReset, setSelectedCourseForReset] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!roleLoading && !canAccessDashboard()) {
      navigate('/');
      return;
    }

    if (userId) {
      fetchStudentData();
    }
  }, [userId, roleLoading]);

  const fetchStudentData = async () => {
    if (!userId) return;

    try {
      // Fetch student profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) throw profileError;
      setStudent(profileData);
      if (profileData?.attendance_mode) {
        setSelectedMode(profileData.attendance_mode);
      }

      // Fetch enrollments with course info
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select(`
          id,
          course_id,
          status,
          progress,
          completed_lessons,
          enrolled_at,
          courses:course_id (
            id,
            title,
            title_ar,
            lessons_count
          )
        `)
        .eq('user_id', userId);

      if (enrollmentError) throw enrollmentError;
      
      const formattedEnrollments = (enrollmentData || []).map(e => ({
        ...e,
        course: e.courses as any
      }));
      setEnrollments(formattedEnrollments);

      // Fetch attendance stats
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('lesson_attendance')
        .select(`
          id,
          attendance_type
        `)
        .eq('user_id', userId);

      if (attendanceError) throw attendanceError;

      const stats = (attendanceData || []).reduce((acc, att) => {
        if (att.attendance_type === 'online') acc.online_count++;
        else if (att.attendance_type === 'center') acc.center_count++;
        acc.total_count++;
        return acc;
      }, { online_count: 0, center_count: 0, total_count: 0 });

      setAttendanceStats(stats);

      // Fetch exam results
      const { data: examData, error: examError } = await supabase
        .from('exam_results')
        .select(`
          id,
          score,
          notes,
          created_at,
          exams:exam_id (
            id,
            title,
            title_ar,
            max_score,
            exam_date,
            courses:course_id (
              title,
              title_ar
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (examError) throw examError;

      const formattedExams = (examData || []).map(e => ({
        ...e,
        exam: {
          ...(e.exams as any),
          course: (e.exams as any)?.courses
        }
      }));
      setExamResults(formattedExams);

      // Fetch student notes
      const { data: notesData, error: notesError } = await supabase
        .from('student_notes')
        .select('*')
        .eq('student_id', userId)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;
      setNotes(notesData || []);

    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const logAction = async (actionType: string, actionDetails: Record<string, any>) => {
    if (!user || !userId) return;
    try {
      await supabase.from('assistant_action_logs').insert({
        assistant_id: user.id,
        student_id: userId,
        action_type: actionType,
        action_details: actionDetails,
      });
    } catch (error) {
      console.error('Error logging action:', error);
    }
  };

  const handleChangeMode = async () => {
    if (!userId || !student) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ attendance_mode: selectedMode })
        .eq('user_id', userId);

      if (error) throw error;

      await logAction('change_attendance_mode', { 
        from: student.attendance_mode, 
        to: selectedMode 
      });

      setStudent({ ...student, attendance_mode: selectedMode });
      setModeDialogOpen(false);
      toast({
        title: isArabic ? 'تم التحديث' : 'Updated',
        description: isArabic ? 'تم تغيير وضع الحضور بنجاح' : 'Attendance mode changed successfully',
      });
    } catch (error) {
      console.error('Error updating mode:', error);
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'فشل في تحديث وضع الحضور' : 'Failed to update attendance mode',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleSuspend = async () => {
    if (!userId || !student) return;
    setActionLoading(true);
    try {
      const newStatus = !student.is_suspended;
      const { error } = await supabase
        .from('profiles')
        .update({ is_suspended: newStatus })
        .eq('user_id', userId);

      if (error) throw error;

      await logAction(newStatus ? 'suspend_account' : 'reactivate_account', {});

      setStudent({ ...student, is_suspended: newStatus });
      setSuspendDialogOpen(false);
      toast({
        title: isArabic ? 'تم التحديث' : 'Updated',
        description: newStatus 
          ? (isArabic ? 'تم تعليق الحساب' : 'Account suspended')
          : (isArabic ? 'تم إعادة تفعيل الحساب' : 'Account reactivated'),
      });
    } catch (error) {
      console.error('Error toggling suspend:', error);
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'فشل في تحديث حالة الحساب' : 'Failed to update account status',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!userId || !notificationMessage.trim()) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.from('notifications').insert({
        type: 'system_message',
        target_type: 'user',
        target_id: userId,
        title: isArabic ? 'رسالة من المساعد' : 'Message from Assistant',
        title_ar: 'رسالة من المساعد',
        message: notificationMessage,
        message_ar: notificationMessage,
        sender_id: user?.id,
      });

      if (error) throw error;

      await logAction('send_notification', { message: notificationMessage });

      setNotificationDialogOpen(false);
      setNotificationMessage('');
      toast({
        title: isArabic ? 'تم الإرسال' : 'Sent',
        description: isArabic ? 'تم إرسال الإشعار بنجاح' : 'Notification sent successfully',
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'فشل في إرسال الإشعار' : 'Failed to send notification',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!userId || !newNote.trim() || !user) return;
    setActionLoading(true);
    try {
      const { data, error } = await supabase.from('student_notes').insert({
        student_id: userId,
        assistant_id: user.id,
        note: newNote,
      }).select().single();

      if (error) throw error;

      await logAction('add_note', { note: newNote });

      setNotes([data, ...notes]);
      setNoteDialogOpen(false);
      setNewNote('');
      toast({
        title: isArabic ? 'تمت الإضافة' : 'Added',
        description: isArabic ? 'تمت إضافة الملاحظة بنجاح' : 'Note added successfully',
      });
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'فشل في إضافة الملاحظة' : 'Failed to add note',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase.from('student_notes').delete().eq('id', noteId);
      if (error) throw error;
      setNotes(notes.filter(n => n.id !== noteId));
      toast({
        title: isArabic ? 'تم الحذف' : 'Deleted',
        description: isArabic ? 'تم حذف الملاحظة' : 'Note deleted',
      });
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleResetProgress = async () => {
    if (!userId || !selectedCourseForReset) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('course_enrollments')
        .update({ progress: 0, completed_lessons: 0 })
        .eq('user_id', userId)
        .eq('course_id', selectedCourseForReset);

      if (error) throw error;

      const course = enrollments.find(e => e.course_id === selectedCourseForReset);
      await logAction('reset_course_progress', { 
        course_id: selectedCourseForReset,
        course_title: course?.course?.title 
      });

      // Update local state
      setEnrollments(enrollments.map(e => 
        e.course_id === selectedCourseForReset 
          ? { ...e, progress: 0, completed_lessons: 0 }
          : e
      ));

      setResetProgressDialogOpen(false);
      setSelectedCourseForReset(null);
      toast({
        title: isArabic ? 'تم إعادة التعيين' : 'Reset',
        description: isArabic ? 'تم إعادة تعيين تقدم الكورس' : 'Course progress has been reset',
      });
    } catch (error) {
      console.error('Error resetting progress:', error);
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'فشل في إعادة تعيين التقدم' : 'Failed to reset progress',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getGradeLabel = (grade: string | null) => {
    if (!grade) return isArabic ? 'غير محدد' : 'Not specified';
    const grades: Record<string, { ar: string; en: string }> = {
      'first': { ar: 'أولى ثانوي', en: '1st Secondary' },
      'second': { ar: 'تانية ثانوي', en: '2nd Secondary' },
      'third_arabic': { ar: 'تالته ثانوي (عربي)', en: '3rd Secondary (Arabic)' },
      'third_english': { ar: 'تالته ثانوي (لغات)', en: '3rd Secondary (Languages)' },
    };
    return grades[grade]?.[isArabic ? 'ar' : 'en'] || grade;
  };

  const getGroupLabel = () => {
    if (!student?.academic_year || !student?.language_track) return null;
    const year = ACADEMIC_YEAR_LABELS[student.academic_year];
    const track = LANGUAGE_TRACK_LABELS[student.language_track];
    if (!year || !track) return null;
    return isArabic ? `${year.ar} - ${track.ar}` : `${year.en} - ${track.en}`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'active': { label: isArabic ? 'نشط' : 'Active', variant: 'default' },
      'pending': { label: isArabic ? 'معلق' : 'Pending', variant: 'secondary' },
      'expired': { label: isArabic ? 'منتهي' : 'Expired', variant: 'destructive' },
      'cancelled': { label: isArabic ? 'ملغي' : 'Cancelled', variant: 'outline' },
    };
    const config = statusConfig[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const totalLessons = enrollments.reduce((sum, e) => sum + (e.course?.lessons_count || 0), 0);
  const completedLessons = enrollments.reduce((sum, e) => sum + (e.completed_lessons || 0), 0);
  const remainingLessons = totalLessons - completedLessons;

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-background pt-20 px-4">
        <Navbar />
        <div className="container mx-auto max-w-4xl text-center py-12">
          <p className="text-muted-foreground">{isArabic ? 'الطالب غير موجود' : 'Student not found'}</p>
          <Button variant="outline" onClick={() => navigate('/assistant/students')} className="mt-4">
            {isArabic ? 'العودة للقائمة' : 'Back to List'}
          </Button>
        </div>
      </div>
    );
  }

  const modeConfig = ATTENDANCE_MODE_CONFIG[student.attendance_mode];
  const groupLabel = getGroupLabel();

  return (
    <div className="min-h-screen bg-muted/30" dir={isArabic ? 'rtl' : 'ltr'}>
      <Navbar />
      <div className="pt-20 px-4 pb-12">
        <div className="container mx-auto max-w-5xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate('/assistant/students')}>
              <ArrowRight className={`h-5 w-5 ${isArabic ? '' : 'rotate-180'}`} />
            </Button>
            <h1 className="text-2xl font-bold">{isArabic ? 'ملف الطالب' : 'Student Profile'}</h1>
          </div>

          {/* Student Info Card */}
          <div className="bg-card rounded-xl border p-6 mb-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="h-10 w-10 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-2xl font-bold">{student.full_name || (isArabic ? 'بدون اسم' : 'No Name')}</h2>
                      {student.is_suspended && (
                        <Badge variant="destructive">{isArabic ? 'موقوف' : 'Suspended'}</Badge>
                      )}
                    </div>
                    {groupLabel && (
                      <Badge variant="secondary" className="mt-2">{groupLabel}</Badge>
                    )}
                  </div>
                  <Badge className={modeConfig?.color}>
                    {React.createElement(modeConfig?.icon || Globe, { className: "w-3 h-3 mr-1" })}
                    {isArabic ? modeConfig?.ar : modeConfig?.en}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="truncate">{student.email || (isArabic ? 'لا يوجد' : 'N/A')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span dir="ltr">{student.phone || (isArabic ? 'لا يوجد' : 'N/A')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <GraduationCap className="h-4 w-4 shrink-0" />
                    <span>{getGradeLabel(student.grade)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span>{isArabic ? 'تاريخ التسجيل:' : 'Registered:'} {new Date(student.created_at).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>{isArabic ? 'آخر تحديث:' : 'Last update:'} {new Date(student.updated_at).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Assistant Actions */}
          <div className="bg-card rounded-xl border p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {isArabic ? 'إجراءات المساعد' : 'Assistant Actions'}
            </h3>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm" onClick={() => setModeDialogOpen(true)}>
                <Layers className="h-4 w-4 mr-2" />
                {isArabic ? 'تغيير وضع الحضور' : 'Change Attendance Mode'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setResetProgressDialogOpen(true)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {isArabic ? 'إعادة تعيين التقدم' : 'Reset Progress'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setNotificationDialogOpen(true)}>
                <Bell className="h-4 w-4 mr-2" />
                {isArabic ? 'إرسال إشعار' : 'Send Notification'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setNoteDialogOpen(true)}>
                <FileText className="h-4 w-4 mr-2" />
                {isArabic ? 'إضافة ملاحظة' : 'Add Note'}
              </Button>
              <Button 
                variant={student.is_suspended ? "default" : "destructive"} 
                size="sm" 
                onClick={() => setSuspendDialogOpen(true)}
              >
                {student.is_suspended ? (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    {isArabic ? 'إعادة التفعيل' : 'Reactivate'}
                  </>
                ) : (
                  <>
                    <ShieldOff className="h-4 w-4 mr-2" />
                    {isArabic ? 'تعليق الحساب' : 'Suspend'}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card rounded-xl border p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-green-500" />
                </div>
              </div>
              <p className="text-2xl font-bold">{completedLessons}</p>
              <p className="text-sm text-muted-foreground">{isArabic ? 'دروس مكتملة' : 'Lessons Completed'}</p>
            </div>

            <div className="bg-card rounded-xl border p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                </div>
              </div>
              <p className="text-2xl font-bold">{remainingLessons}</p>
              <p className="text-sm text-muted-foreground">{isArabic ? 'دروس متبقية' : 'Lessons Remaining'}</p>
            </div>

            <div className="bg-card rounded-xl border p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Award className="h-5 w-5 text-purple-500" />
                </div>
              </div>
              <p className="text-2xl font-bold">{examResults.length}</p>
              <p className="text-sm text-muted-foreground">{isArabic ? 'امتحانات مؤداة' : 'Exams Taken'}</p>
            </div>

            <div className="bg-card rounded-xl border p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Video className="h-5 w-5 text-amber-500" />
                </div>
              </div>
              <p className="text-2xl font-bold">{attendanceStats.total_count}</p>
              <p className="text-sm text-muted-foreground">{isArabic ? 'إجمالي الحضور' : 'Total Attendance'}</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Enrollments */}
            <div className="bg-card rounded-xl border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {isArabic ? 'الكورسات المشترك فيها' : 'Enrolled Courses'}
              </h3>
              
              {enrollments.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">{isArabic ? 'لا توجد اشتراكات' : 'No enrollments'}</p>
              ) : (
                <div className="space-y-4">
                  {enrollments.map(enrollment => (
                    <div key={enrollment.id} className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium">{isArabic ? enrollment.course?.title_ar : enrollment.course?.title}</p>
                        {getStatusBadge(enrollment.status)}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>
                          {enrollment.completed_lessons || 0} / {enrollment.course?.lessons_count || 0} {isArabic ? 'درس' : 'lessons'}
                        </span>
                      </div>
                      <Progress value={enrollment.progress || 0} className="mt-2 h-2" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Exam Results */}
            <div className="bg-card rounded-xl border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                {isArabic ? 'نتائج الامتحانات' : 'Exam Results'}
              </h3>
              
              {examResults.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">{isArabic ? 'لا توجد نتائج' : 'No exam results'}</p>
              ) : (
                <div className="space-y-3">
                  {examResults.slice(0, 5).map(result => (
                    <div key={result.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{isArabic ? result.exam?.title_ar : result.exam?.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {isArabic ? result.exam?.course?.title_ar : result.exam?.course?.title}
                        </p>
                      </div>
                      <div className="text-end shrink-0">
                        <p className={`text-lg font-bold ${getScoreColor(result.score, result.exam?.max_score || 100)}`}>
                          {result.score}/{result.exam?.max_score || 100}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Internal Notes */}
          <div className="bg-card rounded-xl border p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {isArabic ? 'ملاحظات داخلية' : 'Internal Notes'}
              </h3>
              <Button variant="outline" size="sm" onClick={() => setNoteDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                {isArabic ? 'إضافة' : 'Add'}
              </Button>
            </div>
            
            {notes.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">{isArabic ? 'لا توجد ملاحظات' : 'No notes yet'}</p>
            ) : (
              <div className="space-y-3">
                {notes.map(note => (
                  <div key={note.id} className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm flex-1">{note.note}</p>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="shrink-0 h-8 w-8"
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(note.created_at).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Change Attendance Mode Dialog */}
      <Dialog open={modeDialogOpen} onOpenChange={setModeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isArabic ? 'تغيير وضع الحضور' : 'Change Attendance Mode'}</DialogTitle>
            <DialogDescription>
              {isArabic ? 'اختر وضع الحضور الجديد للطالب' : 'Select the new attendance mode for this student'}
            </DialogDescription>
          </DialogHeader>
          <Select value={selectedMode} onValueChange={(v: 'online' | 'center' | 'hybrid') => setSelectedMode(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="online">{isArabic ? 'أونلاين' : 'Online'}</SelectItem>
              <SelectItem value="center">{isArabic ? 'سنتر' : 'Center'}</SelectItem>
              <SelectItem value="hybrid">{isArabic ? 'هجين' : 'Hybrid'}</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModeDialogOpen(false)}>
              {isArabic ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleChangeMode} disabled={actionLoading}>
              {actionLoading ? (isArabic ? 'جاري الحفظ...' : 'Saving...') : (isArabic ? 'حفظ' : 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend/Reactivate Dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {student?.is_suspended 
                ? (isArabic ? 'إعادة تفعيل الحساب' : 'Reactivate Account')
                : (isArabic ? 'تعليق الحساب' : 'Suspend Account')}
            </DialogTitle>
            <DialogDescription>
              {student?.is_suspended 
                ? (isArabic ? 'سيتمكن الطالب من الوصول للمنصة مجدداً' : 'The student will be able to access the platform again')
                : (isArabic ? 'لن يتمكن الطالب من الوصول للمنصة حتى إعادة التفعيل' : 'The student will not be able to access the platform until reactivated')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialogOpen(false)}>
              {isArabic ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button 
              variant={student?.is_suspended ? "default" : "destructive"}
              onClick={handleToggleSuspend} 
              disabled={actionLoading}
            >
              {actionLoading 
                ? (isArabic ? 'جاري التحديث...' : 'Updating...') 
                : (student?.is_suspended ? (isArabic ? 'إعادة التفعيل' : 'Reactivate') : (isArabic ? 'تعليق' : 'Suspend'))}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Notification Dialog */}
      <Dialog open={notificationDialogOpen} onOpenChange={setNotificationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isArabic ? 'إرسال إشعار' : 'Send Notification'}</DialogTitle>
            <DialogDescription>
              {isArabic ? 'اكتب رسالة لإرسالها للطالب' : 'Write a message to send to this student'}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={notificationMessage}
            onChange={(e) => setNotificationMessage(e.target.value)}
            placeholder={isArabic ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotificationDialogOpen(false)}>
              {isArabic ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleSendNotification} disabled={actionLoading || !notificationMessage.trim()}>
              {actionLoading ? (isArabic ? 'جاري الإرسال...' : 'Sending...') : (isArabic ? 'إرسال' : 'Send')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isArabic ? 'إضافة ملاحظة' : 'Add Note'}</DialogTitle>
            <DialogDescription>
              {isArabic ? 'هذه الملاحظة مرئية للمساعدين فقط' : 'This note is only visible to assistant teachers'}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder={isArabic ? 'اكتب ملاحظتك هنا...' : 'Write your note here...'}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
              {isArabic ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleAddNote} disabled={actionLoading || !newNote.trim()}>
              {actionLoading ? (isArabic ? 'جاري الحفظ...' : 'Saving...') : (isArabic ? 'إضافة' : 'Add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Progress Dialog */}
      <Dialog open={resetProgressDialogOpen} onOpenChange={setResetProgressDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isArabic ? 'إعادة تعيين التقدم' : 'Reset Progress'}</DialogTitle>
            <DialogDescription>
              {isArabic ? 'اختر الكورس لإعادة تعيين تقدم الطالب فيه' : 'Select a course to reset the student progress'}
            </DialogDescription>
          </DialogHeader>
          <Select value={selectedCourseForReset || ''} onValueChange={setSelectedCourseForReset}>
            <SelectTrigger>
              <SelectValue placeholder={isArabic ? 'اختر كورس' : 'Select course'} />
            </SelectTrigger>
            <SelectContent>
              {enrollments.map(e => (
                <SelectItem key={e.course_id} value={e.course_id}>
                  {isArabic ? e.course?.title_ar : e.course?.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="p-3 bg-destructive/10 rounded-lg text-sm text-destructive flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{isArabic ? 'هذا الإجراء لا يمكن التراجع عنه' : 'This action cannot be undone'}</span>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetProgressDialogOpen(false)}>
              {isArabic ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleResetProgress} 
              disabled={actionLoading || !selectedCourseForReset}
            >
              {actionLoading ? (isArabic ? 'جاري إعادة التعيين...' : 'Resetting...') : (isArabic ? 'إعادة تعيين' : 'Reset')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
