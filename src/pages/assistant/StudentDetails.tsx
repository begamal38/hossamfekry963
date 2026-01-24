import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, BookOpen, Award, 
  AlertCircle, RefreshCw, Bell, FileText, Shield, ShieldOff,
  Plus, Trash2, Copy, Check, Gauge, ArrowRightLeft, MapPin
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
import { useCourseActivitySummary, CourseActivitySummary } from '@/hooks/useCourseActivitySummary';
import { CourseActivitySummaryCard } from '@/components/assistant/CourseActivitySummaryCard';
import { ActivityGuidePanel } from '@/components/assistant/ActivityGuidePanel';
import { AISuggestionCard } from '@/components/assistant/AISuggestionCard';
import { StudentGroupTransferDialog } from '@/components/assistant/StudentGroupTransferDialog';
import { ForceMoveToCenter } from '@/components/assistant/ForceMoveToCenter';
import { StudentIdentityCard } from '@/components/assistant/StudentIdentityCard';
import { StudentProgressOverview } from '@/components/assistant/StudentProgressOverview';
import { StudentFocusSummary } from '@/components/assistant/StudentFocusSummary';
import { StudentEnrollmentsList } from '@/components/assistant/StudentEnrollmentsList';

interface StudentProfile {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  grade: string | null;
  academic_year: string | null;
  language_track: string | null;
  attendance_mode: 'online' | 'center' | 'hybrid' | null;
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

interface FocusSessionStats {
  totalSessions: number;
  totalActiveMinutes: number;
  totalPausedMinutes: number;
  completedSessions: number;
  avgSessionMinutes: number;
  lessonsWatched: number;
}

interface LessonFocusDetail {
  lessonId: string;
  lessonTitle: string;
  lessonTitleAr: string;
  watchMinutes: number;
  lessonDuration: number;
  isCompleted: boolean;
  sessions: number;
}

const ACADEMIC_YEAR_LABELS: Record<string, { ar: string; en: string }> = {
  'second_secondary': { ar: 'تانية ثانوي', en: '2nd Secondary' },
  'third_secondary': { ar: 'تالته ثانوي', en: '3rd Secondary' },
};

const LANGUAGE_TRACK_LABELS: Record<string, { ar: string; en: string }> = {
  'arabic': { ar: 'عربي', en: 'Arabic' },
  'languages': { ar: 'لغات', en: 'Languages' },
};

export default function StudentDetails() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { canAccessDashboard, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const isArabic = language === 'ar';

  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({ online_count: 0, center_count: 0, total_count: 0 });
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [notes, setNotes] = useState<StudentNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [activitySummaries, setActivitySummaries] = useState<Map<string, CourseActivitySummary>>(new Map());
  const { getSummary } = useCourseActivitySummary();
  
  // Focus session stats
  const [focusStats, setFocusStats] = useState<FocusSessionStats>({
    totalSessions: 0,
    totalActiveMinutes: 0,
    totalPausedMinutes: 0,
    completedSessions: 0,
    avgSessionMinutes: 0,
    lessonsWatched: 0
  });
  const [lessonFocusDetails, setLessonFocusDetails] = useState<LessonFocusDetail[]>([]);

  // Center group info
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
  const [currentGroupName, setCurrentGroupName] = useState<string | null>(null);

  // Action dialogs
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [resetProgressDialogOpen, setResetProgressDialogOpen] = useState(false);
  const [selectedCourseForReset, setSelectedCourseForReset] = useState<string | null>(null);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [forceMoveDialogOpen, setForceMoveDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState<CourseActivitySummary | null>(null);

  const copyStudentLink = async () => {
    const shortUrl = `${window.location.origin}/assistant/students/${studentId}`;
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      toast({
        title: isArabic ? 'تم نسخ الرابط!' : 'Link copied!',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        variant: 'destructive',
        title: isArabic ? 'فشل نسخ الرابط' : 'Failed to copy link',
      });
    }
  };

  useEffect(() => {
    if (!roleLoading && !canAccessDashboard()) {
      navigate('/');
      return;
    }

    if (studentId) {
      resolveAndFetchStudent();
    }
  }, [studentId, roleLoading]);

  // Subscribe to realtime updates for this student's data
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`student-details-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'course_enrollments', filter: `user_id=eq.${userId}` },
        () => fetchStudentData(userId)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lesson_completions', filter: `user_id=eq.${userId}` },
        () => fetchStudentData(userId)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'focus_sessions', filter: `user_id=eq.${userId}` },
        () => fetchStudentData(userId)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'exam_attempts', filter: `user_id=eq.${userId}` },
        () => fetchStudentData(userId)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Resolve short_id to user_id
  const resolveAndFetchStudent = async () => {
    if (!studentId) return;
    
    // Check if studentId is a number (short_id) or UUID
    const isShortId = /^\d+$/.test(studentId);
    
    let resolvedUserId: string | null = null;
    
    if (isShortId) {
      // Lookup by short_id
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('short_id', parseInt(studentId, 10))
        .maybeSingle();
      
      if (error || !data) {
        console.error('Student not found by short_id:', error);
        setLoading(false);
        return;
      }
      resolvedUserId = data.user_id;
    } else {
      // It's already a UUID
      resolvedUserId = studentId;
    }
    
    setUserId(resolvedUserId);
    fetchStudentData(resolvedUserId);
  };

  const fetchStudentData = async (targetUserId: string) => {
    if (!targetUserId) return;

    try {
      // Fetch student profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (profileError) throw profileError;
      setStudent(profileData);

      // Fetch center group membership if center student
      if (profileData?.attendance_mode === 'center') {
        const { data: membership } = await supabase
          .from('center_group_members')
          .select('group_id, center_groups!inner(id, name)')
          .eq('student_id', targetUserId)
          .eq('is_active', true)
          .maybeSingle();
        
        if (membership) {
          setCurrentGroupId(membership.group_id);
          setCurrentGroupName((membership.center_groups as any)?.name || null);
        } else {
          setCurrentGroupId(null);
          setCurrentGroupName(null);
        }
      } else {
        setCurrentGroupId(null);
        setCurrentGroupName(null);
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
        .eq('user_id', targetUserId);

      if (enrollmentError) throw enrollmentError;
      
      const formattedEnrollments = (enrollmentData || []).map(e => ({
        ...e,
        course: e.courses as any
      }));
      setEnrollments(formattedEnrollments);

      // Fetch activity summaries for expired enrollments
      const expiredEnrollments = formattedEnrollments.filter(e => e.status === 'expired');
      const summariesMap = new Map<string, CourseActivitySummary>();
      for (const enrollment of expiredEnrollments) {
        const summary = await getSummary(targetUserId, enrollment.course_id);
        if (summary) {
          summariesMap.set(enrollment.course_id, summary);
        }
      }
      setActivitySummaries(summariesMap);

      // Fetch attendance stats
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('lesson_attendance')
        .select(`
          id,
          attendance_type
        `)
        .eq('user_id', targetUserId);

      if (attendanceError) throw attendanceError;

      const stats = (attendanceData || []).reduce((acc, att) => {
        if (att.attendance_type === 'online') acc.online_count++;
        else if (att.attendance_type === 'center') acc.center_count++;
        acc.total_count++;
        return acc;
      }, { online_count: 0, center_count: 0, total_count: 0 });

      setAttendanceStats(stats);

      // Fetch exam results from exam_attempts (auto-corrected)
      const { data: examData, error: examError } = await supabase
        .from('exam_attempts')
        .select(`
          id,
          score,
          total_questions,
          completed_at,
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
        .eq('user_id', targetUserId)
        .eq('is_completed', true)
        .order('completed_at', { ascending: false });

      if (examError) throw examError;

      const formattedExams = (examData || []).map(e => {
        const maxScore = (e.exams as any)?.max_score || 100;
        const percentageScore = Math.round((e.score / e.total_questions) * maxScore);
        return {
          id: e.id,
          score: percentageScore,
          notes: null,
          created_at: e.completed_at,
          exam: {
            ...(e.exams as any),
            course: (e.exams as any)?.courses
          }
        };
      });
      setExamResults(formattedExams);

      // Fetch student notes
      const { data: notesData, error: notesError } = await supabase
        .from('student_notes')
        .select('*')
        .eq('student_id', targetUserId)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;
      setNotes(notesData || []);
      
      // Fetch focus sessions for this student
      const { data: focusData, error: focusError } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', targetUserId);
      
      if (!focusError && focusData) {
        const sessions = focusData || [];
        const totalActive = sessions.reduce((sum, s) => sum + (s.total_active_seconds || 0), 0);
        const totalPaused = sessions.reduce((sum, s) => sum + (s.total_paused_seconds || 0), 0);
        const completed = sessions.filter(s => s.is_completed).length;
        const uniqueLessons = new Set(sessions.map(s => s.lesson_id)).size;
        
        setFocusStats({
          totalSessions: sessions.length,
          totalActiveMinutes: Math.round(totalActive / 60),
          totalPausedMinutes: Math.round(totalPaused / 60),
          completedSessions: completed,
          avgSessionMinutes: sessions.length > 0 ? Math.round((totalActive / 60) / sessions.length) : 0,
          lessonsWatched: uniqueLessons
        });
        
        // Fetch lesson details for focus sessions
        const lessonIds = [...new Set(sessions.map(s => s.lesson_id))];
        if (lessonIds.length > 0) {
          const { data: lessonsData } = await supabase
            .from('lessons')
            .select('id, title, title_ar, duration_minutes')
            .in('id', lessonIds);
          
          const lessonMap = new Map((lessonsData || []).map(l => [l.id, l]));
          
          const details: LessonFocusDetail[] = lessonIds.map(lessonId => {
            const lessonSessions = sessions.filter(s => s.lesson_id === lessonId);
            const lesson = lessonMap.get(lessonId);
            const totalWatchTime = lessonSessions.reduce((sum, s) => sum + (s.total_active_seconds || 0), 0);
            
            return {
              lessonId,
              lessonTitle: lesson?.title || 'Unknown',
              lessonTitleAr: lesson?.title_ar || 'غير معروف',
              watchMinutes: Math.round(totalWatchTime / 60),
              lessonDuration: lesson?.duration_minutes || 0,
              isCompleted: lessonSessions.some(s => s.is_completed),
              sessions: lessonSessions.length
            };
          }).sort((a, b) => b.watchMinutes - a.watchMinutes);
          
          setLessonFocusDetails(details);
        }
      }

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
    // Use unified grade labels
    const grades: Record<string, { ar: string; en: string }> = {
      'second_secondary': { ar: 'تانية ثانوي', en: '2nd Secondary' },
      'third_secondary': { ar: 'تالته ثانوي', en: '3rd Secondary' },
      'second_arabic': { ar: 'تانية ثانوي - عربي', en: '2nd Secondary - Arabic' },
      'second_languages': { ar: 'تانية ثانوي - لغات', en: '2nd Secondary - Languages' },
      'third_arabic': { ar: 'تالته ثانوي - عربي', en: '3rd Secondary - Arabic' },
      'third_languages': { ar: 'تالته ثانوي - لغات', en: '3rd Secondary - Languages' },
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
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-3.5 h-3.5 rounded-full bg-primary animate-pulse-dot"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
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

  const groupLabel = getGroupLabel();

  return (
    <div className="min-h-screen bg-muted/30 pb-mobile-nav" dir={isArabic ? 'rtl' : 'ltr'}>
      <Navbar />
      <div className="pt-20 px-4 pb-12">
        <div className="container mx-auto max-w-5xl">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/assistant/students')}>
                <ArrowRight className={`h-5 w-5 ${isArabic ? '' : 'rotate-180'}`} />
              </Button>
              <h1 className="text-2xl font-bold">{isArabic ? 'ملف الطالب' : 'Student Profile'}</h1>
            </div>
            {/* Copy Link Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={copyStudentLink}
              className="gap-2"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {copied ? (isArabic ? 'تم النسخ' : 'Copied') : (isArabic ? 'نسخ الرابط' : 'Copy Link')}
            </Button>
          </div>

          {/* Section 1 & 2: Student Identity + Study Mode */}
          <StudentIdentityCard
            fullName={student.full_name}
            email={student.email}
            phone={student.phone}
            grade={student.grade}
            languageTrack={student.language_track}
            attendanceMode={student.attendance_mode}
            centerGroupName={currentGroupName}
            isSuspended={student.is_suspended}
            createdAt={student.created_at}
            updatedAt={student.updated_at}
            isArabic={isArabic}
          />

          {/* Section 4: Learning Progress Overview */}
          <div className="mt-6">
            <StudentProgressOverview
              completedLessons={completedLessons}
              totalLessons={totalLessons}
              examsTaken={examResults.length}
              totalAttendance={attendanceStats.total_count}
              isArabic={isArabic}
            />
          </div>
          
          {/* Section 5: Focus & Behavior Summary */}
          <div className="mt-6">
            <StudentFocusSummary
              stats={focusStats}
              isArabic={isArabic}
            />
          </div>

          {/* Assistant Actions */}
          <div className="bg-card rounded-xl border border-border p-5 sm:p-6 mt-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {isArabic ? 'إجراءات المساعد' : 'Assistant Actions'}
            </h3>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Button variant="outline" size="sm" onClick={() => setResetProgressDialogOpen(true)}>
                <RefreshCw className="h-4 w-4 mr-1.5" />
                {isArabic ? 'إعادة تعيين' : 'Reset'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setNotificationDialogOpen(true)}>
                <Bell className="h-4 w-4 mr-1.5" />
                {isArabic ? 'إشعار' : 'Notify'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setNoteDialogOpen(true)}>
                <FileText className="h-4 w-4 mr-1.5" />
                {isArabic ? 'ملاحظة' : 'Note'}
              </Button>
              {/* Group Transfer - Only for center students with a group */}
              {student.attendance_mode === 'center' && currentGroupId && (
                <Button variant="outline" size="sm" onClick={() => setTransferDialogOpen(true)}>
                  <ArrowRightLeft className="h-4 w-4 mr-1.5" />
                  {isArabic ? 'نقل' : 'Transfer'}
                </Button>
              )}
              {/* Force Move to Center - Only for online students */}
              {student.attendance_mode === 'online' && (
                <Button variant="outline" size="sm" onClick={() => setForceMoveDialogOpen(true)}>
                  <MapPin className="h-4 w-4 mr-1.5" />
                  {isArabic ? 'نقل إلى سنتر' : 'Move to Center'}
                </Button>
              )}
              <Button 
                variant={student.is_suspended ? "default" : "destructive"} 
                size="sm" 
                onClick={() => setSuspendDialogOpen(true)}
              >
                {student.is_suspended ? (
                  <>
                    <Shield className="h-4 w-4 mr-1.5" />
                    {isArabic ? 'تفعيل' : 'Activate'}
                  </>
                ) : (
                  <>
                    <ShieldOff className="h-4 w-4 mr-1.5" />
                    {isArabic ? 'تعليق' : 'Suspend'}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Section 3: Enrollments + Exam Results Grid */}
          <div className="grid lg:grid-cols-2 gap-6 mt-6">
            {/* Enrollments List */}
            <StudentEnrollmentsList
              enrollments={enrollments}
              activitySummaries={activitySummaries}
              onViewSummary={(summary) => {
                setSelectedSummary(summary);
                setSummaryDialogOpen(true);
              }}
              isArabic={isArabic}
            />

            {/* Exam Results */}
            <div className="bg-card rounded-xl border border-border p-5 sm:p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                {isArabic ? 'نتائج الامتحانات' : 'Exam Results'}
                <Badge variant="secondary" className="mr-auto text-xs">
                  {examResults.length}
                </Badge>
              </h3>
              
              {examResults.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                    <Award className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {isArabic ? 'لا توجد نتائج بعد' : 'No exam results yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {examResults.slice(0, 5).map(result => (
                    <div key={result.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="min-w-0">
                        <p className="font-medium truncate text-sm">{isArabic ? result.exam?.title_ar : result.exam?.title}</p>
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
          <div className="bg-card rounded-xl border border-border p-5 sm:p-6 mt-6">
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

      {/* Activity Summary Dialog */}
      <Dialog open={summaryDialogOpen} onOpenChange={setSummaryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-primary" />
              {isArabic ? 'ملخص نشاط الطالب' : 'Student Activity Summary'}
            </DialogTitle>
            <DialogDescription>
              {isArabic 
                ? 'ملخص مجمد لنشاط الطالب عند انتهاء الاشتراك'
                : 'Frozen summary of student activity when course ended'}
            </DialogDescription>
          </DialogHeader>
          {selectedSummary && (
            <div className="space-y-4">
              <AISuggestionCard 
                summary={selectedSummary}
                examAttempts={examResults.length}
                avgExamScore={examResults.length > 0 
                  ? Math.round(examResults.reduce((sum, r) => sum + (r.score / r.exam.max_score) * 100, 0) / examResults.length)
                  : undefined
                }
              />
              <CourseActivitySummaryCard summary={selectedSummary} />
              <ActivityGuidePanel />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSummaryDialogOpen(false)}>
              {isArabic ? 'إغلاق' : 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Group Transfer Dialog */}
      <StudentGroupTransferDialog
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        studentId={userId || ''}
        studentName={student?.full_name || ''}
        studentGrade={student?.academic_year || student?.grade || null}
        studentLanguageTrack={student?.language_track || null}
        currentGroupId={currentGroupId}
        currentGroupName={currentGroupName}
        onTransferComplete={() => {
          if (userId) fetchStudentData(userId);
        }}
      />

      {/* Force Move to Center Dialog - Admin action for online students */}
      <ForceMoveToCenter
        open={forceMoveDialogOpen}
        onOpenChange={setForceMoveDialogOpen}
        studentId={userId || ''}
        studentName={student?.full_name || ''}
        studentGrade={student?.academic_year || student?.grade || null}
        studentLanguageTrack={student?.language_track || null}
        onMoveComplete={() => {
          if (userId) fetchStudentData(userId);
        }}
      />
    </div>
  );
}
