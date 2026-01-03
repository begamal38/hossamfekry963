import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Send, 
  Users, 
  BookOpen, 
  Video, 
  User,
  Bell,
  FileText,
  MessageSquare,
  GraduationCap,
  MapPin,
  AlertTriangle,
  Search,
  Check,
  X
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type NotificationType = 
  | 'course_announcement'
  | 'lesson_available'
  | 'lesson_reminder'
  | 'exam_available'
  | 'exam_reminder'
  | 'exam_completed'
  | 'attendance_center'
  | 'attendance_online'
  | 'attendance_followup'
  | 'system_message';

type TargetType = 'all' | 'course' | 'lesson' | 'user' | 'grade' | 'attendance_mode' | 'custom';

interface Course {
  id: string;
  title: string;
  title_ar: string;
}

interface Lesson {
  id: string;
  title: string;
  title_ar: string;
  course_id: string;
}

interface Exam {
  id: string;
  title: string;
  title_ar: string;
  course_id: string;
}

interface Student {
  user_id: string;
  full_name: string | null;
  email: string | null;
  grade: string | null;
  attendance_mode: string;
  phone: string | null;
}

const NOTIFICATION_TYPES: {
  value: NotificationType;
  labelEn: string;
  labelAr: string;
  icon: typeof Bell;
}[] = [
  { value: 'course_announcement', labelEn: 'Course Announcement', labelAr: 'إعلان كورس', icon: BookOpen },
  { value: 'lesson_available', labelEn: 'Lesson Available', labelAr: 'حصة متاحة', icon: Video },
  { value: 'lesson_reminder', labelEn: 'Lesson Reminder', labelAr: 'تذكير حصة', icon: Bell },
  { value: 'exam_available', labelEn: 'Exam Available', labelAr: 'امتحان متاح', icon: FileText },
  { value: 'exam_reminder', labelEn: 'Exam Reminder', labelAr: 'تذكير امتحان', icon: Bell },
  { value: 'attendance_followup', labelEn: 'Attendance Follow-up', labelAr: 'متابعة حضور', icon: Users },
  { value: 'system_message', labelEn: 'System Message', labelAr: 'رسالة من النظام', icon: MessageSquare },
];

const MESSAGE_TEMPLATES: {
  type: NotificationType;
  titleEn: string;
  titleAr: string;
  messageEn: string;
  messageAr: string;
}[] = [
  {
    type: 'course_announcement',
    titleEn: 'New Course Available',
    titleAr: 'كورس جديد متاح',
    messageEn: 'A new course has been added. Check it out!',
    messageAr: 'تم إضافة كورس جديد. شوفه دلوقتي!',
  },
  {
    type: 'lesson_available',
    titleEn: 'New Lesson Available',
    titleAr: 'حصة جديدة متاحة',
    messageEn: 'A new lesson is ready for you.',
    messageAr: 'حصة جديدة مستنياك.',
  },
  {
    type: 'lesson_reminder',
    titleEn: 'Lesson Reminder',
    titleAr: 'تذكير بالحصة',
    messageEn: "Don't forget to complete your lesson.",
    messageAr: 'متنساش تخلص الحصة.',
  },
  {
    type: 'exam_available',
    titleEn: 'Exam Ready',
    titleAr: 'الامتحان جاهز',
    messageEn: 'Your exam is now available. Good luck!',
    messageAr: 'الامتحان بتاعك جاهز. بالتوفيق!',
  },
  {
    type: 'exam_reminder',
    titleEn: 'Exam Reminder',
    titleAr: 'تذكير بالامتحان',
    messageEn: "Don't forget your upcoming exam.",
    messageAr: 'متنساش الامتحان.',
  },
  {
    type: 'attendance_followup',
    titleEn: 'Attendance Update',
    titleAr: 'تحديث الحضور',
    messageEn: 'Your attendance has been recorded.',
    messageAr: 'تم تسجيل حضورك.',
  },
  {
    type: 'system_message',
    titleEn: 'Important Notice',
    titleAr: 'إشعار مهم',
    messageEn: 'Please check this important update.',
    messageAr: 'من فضلك شوف التحديث ده.',
  },
];

const GRADES = ['second_arabic', 'second_languages', 'third_arabic', 'third_languages'];
const ATTENDANCE_MODES = ['online', 'center', 'hybrid'];

export default function SendNotifications() {
  const navigate = useNavigate();
  const { language, isRTL } = useLanguage();
  const { canAccessDashboard, loading: roleLoading } = useUserRole();
  const { user } = useAuth();
  const { toast } = useToast();
  const isArabic = language === 'ar';

  const [notificationType, setNotificationType] = useState<NotificationType>('system_message');
  const [targetType, setTargetType] = useState<TargetType>('all');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedLesson, setSelectedLesson] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedAttendanceMode, setSelectedAttendanceMode] = useState<string>('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  
  // Custom filter states
  const [filterExam, setFilterExam] = useState<string>('');
  const [filterCondition, setFilterCondition] = useState<'not_taken' | 'below_score' | 'above_score'>('not_taken');
  const [filterScore, setFilterScore] = useState<number>(50);
  
  const [titleEn, setTitleEn] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [messageEn, setMessageEn] = useState('');
  const [messageAr, setMessageAr] = useState('');
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    if (!roleLoading && !canAccessDashboard()) {
      navigate('/');
      return;
    }
    fetchData();
  }, [roleLoading]);

  useEffect(() => {
    if (selectedCourse) {
      fetchLessonsAndExams();
    }
  }, [selectedCourse]);

  // Filter students based on search and custom conditions
  useEffect(() => {
    if (targetType === 'custom' || targetType === 'user') {
      filterStudentsList();
    }
  }, [studentSearch, allStudents, targetType, filterExam, filterCondition, filterScore]);

  const fetchData = async () => {
    try {
      const [coursesRes, studentsRes] = await Promise.all([
        supabase.from('courses').select('id, title, title_ar'),
        supabase.from('profiles').select('user_id, full_name, email, grade, attendance_mode, phone'),
      ]);

      setCourses(coursesRes.data || []);
      setAllStudents(studentsRes.data || []);
      setFilteredStudents(studentsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLessonsAndExams = async () => {
    const [lessonsRes, examsRes] = await Promise.all([
      supabase.from('lessons').select('id, title, title_ar, course_id').eq('course_id', selectedCourse).order('order_index'),
      supabase.from('exams').select('id, title, title_ar, course_id').eq('course_id', selectedCourse).order('created_at'),
    ]);
    
    setLessons(lessonsRes.data || []);
    setExams(examsRes.data || []);
  };

  const filterStudentsList = async () => {
    let filtered = [...allStudents];
    
    // Search filter
    if (studentSearch) {
      const search = studentSearch.toLowerCase();
      filtered = filtered.filter(s => 
        s.full_name?.toLowerCase().includes(search) ||
        s.email?.toLowerCase().includes(search) ||
        s.phone?.includes(search)
      );
    }

    // Custom filter based on exam results
    if (targetType === 'custom' && filterExam) {
      setLoadingStudents(true);
      try {
        const { data: examResults } = await supabase
          .from('exam_results')
          .select('user_id, score, exams:exam_id(max_score)')
          .eq('exam_id', filterExam);

        const examResultsMap = new Map(
          (examResults || []).map(r => [r.user_id, { score: r.score, maxScore: (r.exams as any)?.max_score || 100 }])
        );

        if (filterCondition === 'not_taken') {
          // Students who didn't take the exam
          filtered = filtered.filter(s => !examResultsMap.has(s.user_id));
        } else if (filterCondition === 'below_score') {
          // Students with score below threshold
          filtered = filtered.filter(s => {
            const result = examResultsMap.get(s.user_id);
            if (!result) return false;
            const percentage = (result.score / result.maxScore) * 100;
            return percentage < filterScore;
          });
        } else if (filterCondition === 'above_score') {
          // Students with score above threshold
          filtered = filtered.filter(s => {
            const result = examResultsMap.get(s.user_id);
            if (!result) return false;
            const percentage = (result.score / result.maxScore) * 100;
            return percentage >= filterScore;
          });
        }
      } catch (error) {
        console.error('Error filtering students:', error);
      } finally {
        setLoadingStudents(false);
      }
    }

    setFilteredStudents(filtered);
  };

  const applyTemplate = (type: NotificationType) => {
    const template = MESSAGE_TEMPLATES.find(t => t.type === type);
    if (template) {
      setTitleEn(template.titleEn);
      setTitleAr(template.titleAr);
      setMessageEn(template.messageEn);
      setMessageAr(template.messageAr);
    }
  };

  const toggleStudentSelection = (userId: string) => {
    setSelectedStudents(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllFiltered = () => {
    setSelectedStudents(filteredStudents.map(s => s.user_id));
  };

  const clearSelection = () => {
    setSelectedStudents([]);
  };

  const getGradeLabel = (grade: string) => {
    const labels: Record<string, { en: string; ar: string }> = {
      'second_arabic': { en: '2nd Secondary (Arabic)', ar: 'تانية ثانوي عربي' },
      'second_languages': { en: '2nd Secondary (Languages)', ar: 'تانية ثانوي لغات' },
      'third_arabic': { en: '3rd Secondary (Arabic)', ar: 'تالتة ثانوي عربي' },
      'third_languages': { en: '3rd Secondary (Languages)', ar: 'تالتة ثانوي لغات' },
    };
    return isArabic ? labels[grade]?.ar : labels[grade]?.en || grade;
  };

  const getModeLabel = (mode: string) => {
    const labels: Record<string, { en: string; ar: string }> = {
      'online': { en: 'Online', ar: 'أونلاين' },
      'center': { en: 'Center', ar: 'سنتر' },
      'hybrid': { en: 'Hybrid', ar: 'هجين' },
    };
    return isArabic ? labels[mode]?.ar : labels[mode]?.en || mode;
  };

  const sendEmailNotifications = async (
    studentIds: string[],
    targetType: string,
    targetValue?: string
  ) => {
    try {
      console.log('[SendNotifications] Sending email notifications...');
      
      const emailPayload: any = {
        title: titleEn,
        title_ar: titleAr,
        message: messageEn,
        message_ar: messageAr,
        type: notificationType,
      };

      // If targeting specific students, send their IDs directly
      if (studentIds.length > 0) {
        emailPayload.student_ids = studentIds;
      } else {
        emailPayload.target_type = targetType;
        emailPayload.target_value = targetValue;
        if (selectedCourse) {
          emailPayload.course_id = selectedCourse;
        }
      }

      const { data, error } = await supabase.functions.invoke('send-notification-email', {
        body: emailPayload
      });

      if (error) {
        console.error('[SendNotifications] Email function error:', error);
      } else {
        console.log('[SendNotifications] Email result:', data);
        if (data?.emails_sent > 0) {
          toast({
            title: isArabic ? 'تم إرسال البريد' : 'Emails Sent',
            description: isArabic 
              ? `تم إرسال ${data.emails_sent} بريد إلكتروني`
              : `${data.emails_sent} emails sent successfully`,
          });
        }
      }
    } catch (emailError) {
      // Email failure should not block the notification
      console.error('[SendNotifications] Email sending failed:', emailError);
    }
  };

  const handleSend = async () => {
    if (!titleEn || !titleAr || !messageEn || !messageAr) {
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'من فضلك املأ كل الحقول' : 'Please fill all fields',
        variant: 'destructive',
      });
      return;
    }

    // Validate target selection
    if (targetType === 'user' && selectedStudents.length === 0) {
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'من فضلك اختار طالب واحد على الأقل' : 'Please select at least one student',
        variant: 'destructive',
      });
      return;
    }

    if (targetType === 'custom' && selectedStudents.length === 0) {
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'من فضلك اختار طلاب من القائمة' : 'Please select students from the list',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      // For multiple students, we need to create multiple notifications or use target_type 'user' with multiple inserts
      if ((targetType === 'user' || targetType === 'custom') && selectedStudents.length > 0) {
        // Send individual notifications to selected students
        const notifications = selectedStudents.map(studentId => ({
          type: notificationType,
          title: titleEn,
          title_ar: titleAr,
          message: messageEn,
          message_ar: messageAr,
          target_type: 'user' as const,
          target_id: studentId,
          sender_id: user?.id,
          course_id: selectedCourse || null,
          lesson_id: selectedLesson || null,
        }));

        const { error } = await supabase.from('notifications').insert(notifications);
        if (error) throw error;

        // Send email notifications to selected students (non-blocking)
        sendEmailNotifications(selectedStudents, 'user');

        toast({
          title: isArabic ? 'تم الإرسال' : 'Sent',
          description: isArabic 
            ? `تم إرسال الإشعار لـ ${selectedStudents.length} طالب`
            : `Notification sent to ${selectedStudents.length} students`,
        });
      } else {
        // Regular notification (all, course, lesson, grade, attendance_mode)
        const notification: any = {
          type: notificationType,
          title: titleEn,
          title_ar: titleAr,
          message: messageEn,
          message_ar: messageAr,
          target_type: targetType === 'custom' ? 'all' : targetType,
          sender_id: user?.id,
        };

        let emailTargetType = targetType;
        let emailTargetValue: string | undefined;

        if (targetType === 'course' && selectedCourse) {
          notification.target_id = selectedCourse;
          notification.course_id = selectedCourse;
          emailTargetValue = selectedCourse;
        } else if (targetType === 'lesson' && selectedLesson) {
          notification.target_id = selectedLesson;
          notification.lesson_id = selectedLesson;
          notification.course_id = selectedCourse;
          emailTargetType = 'course';
          emailTargetValue = selectedCourse;
        } else if (targetType === 'grade') {
          notification.target_value = selectedGrade;
          emailTargetValue = selectedGrade;
        } else if (targetType === 'attendance_mode') {
          notification.target_value = selectedAttendanceMode;
          emailTargetValue = selectedAttendanceMode;
        }

        const { error } = await supabase.from('notifications').insert(notification);
        if (error) throw error;

        // Send email notifications (non-blocking)
        sendEmailNotifications([], emailTargetType, emailTargetValue);

        toast({
          title: isArabic ? 'تم الإرسال' : 'Sent',
          description: isArabic ? 'تم إرسال الإشعار بنجاح' : 'Notification sent successfully',
        });
      }

      // Reset form
      setTitleEn('');
      setTitleAr('');
      setMessageEn('');
      setMessageAr('');
      setTargetType('all');
      setSelectedCourse('');
      setSelectedLesson('');
      setSelectedGrade('');
      setSelectedAttendanceMode('');
      setSelectedStudents([]);
      setFilterExam('');
      setStudentSearch('');
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'فشل إرسال الإشعار' : 'Failed to send notification',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />

      <main className="container mx-auto px-4 py-8 pt-24 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/assistant')}>
            <ArrowLeft className={cn("h-5 w-5", isRTL && "rotate-180")} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Send className="h-6 w-6 text-primary" />
              {isArabic ? 'إرسال إشعار' : 'Send Notification'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isArabic ? 'أرسل إشعارات للطلاب' : 'Send notifications to students'}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Notification Type */}
          <div className="bg-card border rounded-xl p-4">
            <label className="block text-sm font-medium mb-3">
              {isArabic ? 'نوع الإشعار' : 'Notification Type'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {NOTIFICATION_TYPES.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    onClick={() => {
                      setNotificationType(type.value);
                      applyTemplate(type.value);
                    }}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg border text-sm transition-all",
                      notificationType === type.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="truncate">{isArabic ? type.labelAr : type.labelEn}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Selection */}
          <div className="bg-card border rounded-xl p-4">
            <label className="block text-sm font-medium mb-3">
              {isArabic ? 'أرسل إلى' : 'Send To'}
            </label>
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { value: 'all', labelEn: 'All Students', labelAr: 'كل الطلاب', icon: Users },
                { value: 'grade', labelEn: 'By Grade', labelAr: 'المرحلة', icon: GraduationCap },
                { value: 'attendance_mode', labelEn: 'By Mode', labelAr: 'نوع الحضور', icon: MapPin },
                { value: 'course', labelEn: 'Course', labelAr: 'كورس', icon: BookOpen },
                { value: 'lesson', labelEn: 'Lesson', labelAr: 'حصة', icon: Video },
                { value: 'user', labelEn: 'Students', labelAr: 'طلاب', icon: User },
                { value: 'custom', labelEn: 'Custom Filter', labelAr: 'فلتر مخصص', icon: AlertTriangle },
              ].map(target => {
                const Icon = target.icon;
                return (
                  <button
                    key={target.value}
                    onClick={() => {
                      setTargetType(target.value as TargetType);
                      setSelectedStudents([]);
                    }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all",
                      targetType === target.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {isArabic ? target.labelAr : target.labelEn}
                  </button>
                );
              })}
            </div>

            {/* Grade selector */}
            {targetType === 'grade' && (
              <div className="flex flex-wrap gap-2">
                {GRADES.map(grade => (
                  <button
                    key={grade}
                    onClick={() => setSelectedGrade(grade)}
                    className={cn(
                      "px-4 py-2 rounded-lg border text-sm transition-all",
                      selectedGrade === grade
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {getGradeLabel(grade)}
                  </button>
                ))}
              </div>
            )}

            {/* Attendance mode selector */}
            {targetType === 'attendance_mode' && (
              <div className="flex flex-wrap gap-2">
                {ATTENDANCE_MODES.map(mode => (
                  <button
                    key={mode}
                    onClick={() => setSelectedAttendanceMode(mode)}
                    className={cn(
                      "px-4 py-2 rounded-lg border text-sm transition-all",
                      selectedAttendanceMode === mode
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {getModeLabel(mode)}
                  </button>
                ))}
              </div>
            )}

            {/* Course selector */}
            {(targetType === 'course' || targetType === 'lesson' || targetType === 'custom') && (
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-input rounded-lg mb-3"
              >
                <option value="">{isArabic ? 'اختار الكورس' : 'Select Course'}</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {isArabic ? course.title_ar : course.title}
                  </option>
                ))}
              </select>
            )}

            {/* Lesson selector */}
            {targetType === 'lesson' && selectedCourse && (
              <select
                value={selectedLesson}
                onChange={(e) => setSelectedLesson(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-input rounded-lg"
              >
                <option value="">{isArabic ? 'اختار الحصة' : 'Select Lesson'}</option>
                {lessons.map(lesson => (
                  <option key={lesson.id} value={lesson.id}>
                    {isArabic ? lesson.title_ar : lesson.title}
                  </option>
                ))}
              </select>
            )}

            {/* Custom filter - Exam based */}
            {targetType === 'custom' && selectedCourse && (
              <div className="space-y-3 border-t pt-3 mt-3">
                <p className="text-sm font-medium text-muted-foreground">
                  {isArabic ? 'فلترة حسب الامتحان' : 'Filter by Exam'}
                </p>
                <select
                  value={filterExam}
                  onChange={(e) => setFilterExam(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-input rounded-lg"
                >
                  <option value="">{isArabic ? 'اختار الامتحان' : 'Select Exam'}</option>
                  {exams.map(exam => (
                    <option key={exam.id} value={exam.id}>
                      {isArabic ? exam.title_ar : exam.title}
                    </option>
                  ))}
                </select>

                {filterExam && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setFilterCondition('not_taken')}
                      className={cn(
                        "px-3 py-2 rounded-lg border text-sm transition-all",
                        filterCondition === 'not_taken'
                          ? "border-destructive bg-destructive/10 text-destructive"
                          : "border-border hover:border-destructive/50"
                      )}
                    >
                      {isArabic ? 'ما دخلوش الامتحان' : "Didn't take exam"}
                    </button>
                    <button
                      onClick={() => setFilterCondition('below_score')}
                      className={cn(
                        "px-3 py-2 rounded-lg border text-sm transition-all",
                        filterCondition === 'below_score'
                          ? "border-orange-500 bg-orange-500/10 text-orange-600"
                          : "border-border hover:border-orange-500/50"
                      )}
                    >
                      {isArabic ? 'درجة أقل من' : 'Score below'}
                    </button>
                    <button
                      onClick={() => setFilterCondition('above_score')}
                      className={cn(
                        "px-3 py-2 rounded-lg border text-sm transition-all",
                        filterCondition === 'above_score'
                          ? "border-green-500 bg-green-500/10 text-green-600"
                          : "border-border hover:border-green-500/50"
                      )}
                    >
                      {isArabic ? 'درجة أعلى من' : 'Score above'}
                    </button>
                  </div>
                )}

                {filterExam && (filterCondition === 'below_score' || filterCondition === 'above_score') && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm">{isArabic ? 'النسبة:' : 'Percentage:'}</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={filterScore}
                      onChange={(e) => setFilterScore(Number(e.target.value))}
                      className="w-20 px-3 py-2 bg-background border border-input rounded-lg text-center"
                    />
                    <span className="text-sm">%</span>
                  </div>
                )}
              </div>
            )}

            {/* Student selector for user/custom target */}
            {(targetType === 'user' || targetType === 'custom') && (
              <div className="mt-4 border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium">
                    {isArabic ? 'اختار الطلاب' : 'Select Students'}
                    {selectedStudents.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {selectedStudents.length}
                      </Badge>
                    )}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAllFiltered}>
                      <Check className="h-3 w-3 mr-1" />
                      {isArabic ? 'اختار الكل' : 'Select All'}
                    </Button>
                    {selectedStudents.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearSelection}>
                        <X className="h-3 w-3 mr-1" />
                        {isArabic ? 'إلغاء' : 'Clear'}
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={isArabic ? 'ابحث بالاسم أو الإيميل أو التليفون...' : 'Search by name, email, or phone...'}
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {loadingStudents ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto border rounded-lg divide-y">
                    {filteredStudents.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground text-sm">
                        {isArabic ? 'لا توجد نتائج' : 'No results found'}
                      </div>
                    ) : (
                      filteredStudents.map(student => (
                        <button
                          key={student.user_id}
                          onClick={() => toggleStudentSelection(student.user_id)}
                          className={cn(
                            "w-full flex items-center justify-between p-3 text-start hover:bg-muted/50 transition-colors",
                            selectedStudents.includes(student.user_id) && "bg-primary/10"
                          )}
                        >
                          <div>
                            <p className="font-medium text-sm">
                              {student.full_name || (isArabic ? 'بدون اسم' : 'No name')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {student.email} {student.phone && `• ${student.phone}`}
                            </p>
                            <div className="flex gap-1 mt-1">
                              {student.grade && (
                                <Badge variant="outline" className="text-xs">
                                  {getGradeLabel(student.grade)}
                                </Badge>
                              )}
                              <Badge variant="secondary" className="text-xs">
                                {getModeLabel(student.attendance_mode)}
                              </Badge>
                            </div>
                          </div>
                          {selectedStudents.includes(student.user_id) && (
                            <Check className="h-5 w-5 text-primary" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Message Content */}
          <div className="bg-card border rounded-xl p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {isArabic ? 'العنوان (إنجليزي)' : 'Title (English)'}
              </label>
              <input
                type="text"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-input rounded-lg"
                placeholder="Notification title..."
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {isArabic ? 'العنوان (عربي)' : 'Title (Arabic)'}
              </label>
              <input
                type="text"
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-input rounded-lg"
                placeholder="عنوان الإشعار..."
                dir="rtl"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {isArabic ? 'الرسالة (إنجليزي)' : 'Message (English)'}
              </label>
              <textarea
                value={messageEn}
                onChange={(e) => setMessageEn(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-input rounded-lg min-h-[80px]"
                placeholder="Your message..."
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {isArabic ? 'الرسالة (عربي)' : 'Message (Arabic)'}
              </label>
              <textarea
                value={messageAr}
                onChange={(e) => setMessageAr(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-input rounded-lg min-h-[80px]"
                placeholder="رسالتك..."
                dir="rtl"
              />
            </div>
          </div>

          {/* Send Button */}
          <Button 
            onClick={handleSend} 
            className="w-full" 
            size="lg"
            disabled={sending}
          >
            {sending ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {isArabic ? 'جاري الإرسال...' : 'Sending...'}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                {isArabic ? 'إرسال الإشعار' : 'Send Notification'}
                {selectedStudents.length > 0 && (
                  <Badge variant="secondary" className="bg-white/20">
                    {selectedStudents.length}
                  </Badge>
                )}
              </div>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
