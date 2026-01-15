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
  X,
  UserX,
  Loader2
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

type TargetType = 'all' | 'course' | 'lesson' | 'user' | 'grade' | 'attendance_mode' | 'custom' | 'not_enrolled';

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
  labelAr: string;
  icon: typeof Bell;
}[] = [
  { value: 'course_announcement', labelAr: 'إعلان كورس', icon: BookOpen },
  { value: 'lesson_available', labelAr: 'حصة متاحة', icon: Video },
  { value: 'lesson_reminder', labelAr: 'تذكير حصة', icon: Bell },
  { value: 'exam_available', labelAr: 'امتحان متاح', icon: FileText },
  { value: 'exam_reminder', labelAr: 'تذكير امتحان', icon: Bell },
  { value: 'attendance_followup', labelAr: 'متابعة حضور', icon: Users },
  { value: 'system_message', labelAr: 'رسالة من النظام', icon: MessageSquare },
];

const MESSAGE_TEMPLATES: {
  type: NotificationType;
  titleAr: string;
  messageAr: string;
}[] = [
  {
    type: 'course_announcement',
    titleAr: 'كورس جديد متاح',
    messageAr: 'تم إضافة كورس جديد. شوفه دلوقتي!',
  },
  {
    type: 'lesson_available',
    titleAr: 'حصة جديدة متاحة',
    messageAr: 'حصة جديدة مستنياك.',
  },
  {
    type: 'lesson_reminder',
    titleAr: 'تذكير بالحصة',
    messageAr: 'متنساش تخلص الحصة.',
  },
  {
    type: 'exam_available',
    titleAr: 'الامتحان جاهز',
    messageAr: 'الامتحان بتاعك جاهز. بالتوفيق!',
  },
  {
    type: 'exam_reminder',
    titleAr: 'تذكير بالامتحان',
    messageAr: 'متنساش الامتحان.',
  },
  {
    type: 'attendance_followup',
    titleAr: 'تحديث الحضور',
    messageAr: 'تم تسجيل حضورك.',
  },
  {
    type: 'system_message',
    titleAr: 'إشعار مهم',
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
  
  // Only Arabic fields - English will be auto-translated
  const [titleAr, setTitleAr] = useState('');
  const [messageAr, setMessageAr] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [notEnrolledStudents, setNotEnrolledStudents] = useState<Student[]>([]);

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
    } else if (targetType === 'not_enrolled') {
      fetchNotEnrolledStudents();
    }
  }, [studentSearch, allStudents, targetType, filterExam, filterCondition, filterScore]);

  const fetchData = async () => {
    try {
      // Fetch staff user IDs to exclude from student lists
      const { data: staffRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['assistant_teacher', 'admin']);
      
      const staffUserIds = new Set((staffRoles || []).map(r => r.user_id));

      const [coursesRes, studentsRes] = await Promise.all([
        supabase.from('courses').select('id, title, title_ar'),
        supabase.from('profiles').select('user_id, full_name, email, grade, attendance_mode, phone'),
      ]);

      // Filter out staff from student lists
      const studentsOnly = (studentsRes.data || []).filter(s => !staffUserIds.has(s.user_id));

      setCourses(coursesRes.data || []);
      setAllStudents(studentsOnly);
      setFilteredStudents(studentsOnly);
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

  // Fetch students who are NOT enrolled in any course
  const fetchNotEnrolledStudents = async () => {
    setLoadingStudents(true);
    try {
      // Get all enrolled user IDs
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('user_id');
      
      const enrolledUserIds = new Set((enrollments || []).map(e => e.user_id));
      
      // Filter students who are not enrolled
      const notEnrolled = allStudents.filter(s => !enrolledUserIds.has(s.user_id));
      
      // Apply search filter
      let filtered = notEnrolled;
      if (studentSearch) {
        const search = studentSearch.toLowerCase();
        filtered = notEnrolled.filter(s => 
          s.full_name?.toLowerCase().includes(search) ||
          s.email?.toLowerCase().includes(search) ||
          s.phone?.includes(search)
        );
      }
      
      setNotEnrolledStudents(filtered);
      setFilteredStudents(filtered);
    } catch (error) {
      console.error('Error fetching not enrolled students:', error);
    } finally {
      setLoadingStudents(false);
    }
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
      setTitleAr(template.titleAr);
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
    const labels: Record<string, string> = {
      'second_arabic': 'تانية ثانوي - عربي',
      'second_languages': 'تانية ثانوي - لغات',
      'third_arabic': 'تالته ثانوي - عربي',
      'third_languages': 'تالته ثانوي - لغات',
    };
    return labels[grade] || grade;
  };

  const getModeLabel = (mode: string) => {
    const labels: Record<string, string> = {
      'online': 'أونلاين',
      'center': 'سنتر',
      'hybrid': 'هجين',
    };
    return labels[mode] || mode;
  };

  // Translate Arabic text to English
  const translateToEnglish = async (text: string): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke('translate-content', {
        body: { text, targetLanguage: 'en' }
      });
      
      if (error) {
        console.error('Translation error:', error);
        return text; // Fallback to original
      }
      
      return data?.translatedText || text;
    } catch (err) {
      console.error('Translation failed:', err);
      return text;
    }
  };

  const sendEmailNotifications = async (
    studentIds: string[],
    targetType: string,
    titleEn: string,
    messageEn: string,
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
            title: 'تم إرسال البريد',
            description: `تم إرسال ${data.emails_sent} بريد إلكتروني`,
          });
        }
      }
    } catch (emailError) {
      // Email failure should not block the notification
      console.error('[SendNotifications] Email sending failed:', emailError);
    }
  };

  const handleSend = async () => {
    if (!titleAr || !messageAr) {
      toast({
        title: 'خطأ',
        description: 'من فضلك املأ العنوان والرسالة',
        variant: 'destructive',
      });
      return;
    }

    // Validate target selection
    if (targetType === 'user' && selectedStudents.length === 0) {
      toast({
        title: 'خطأ',
        description: 'من فضلك اختار طالب واحد على الأقل',
        variant: 'destructive',
      });
      return;
    }

    if (targetType === 'custom' && selectedStudents.length === 0) {
      toast({
        title: 'خطأ',
        description: 'من فضلك اختار طلاب من القائمة',
        variant: 'destructive',
      });
      return;
    }

    if (targetType === 'not_enrolled' && selectedStudents.length === 0) {
      toast({
        title: 'خطأ',
        description: 'من فضلك اختار طلاب غير مشتركين',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    setIsTranslating(true);

    try {
      // Auto-translate to English
      const [titleEn, messageEn] = await Promise.all([
        translateToEnglish(titleAr),
        translateToEnglish(messageAr)
      ]);
      
      setIsTranslating(false);

      // For multiple students, we need to create multiple notifications or use target_type 'user' with multiple inserts
      if ((targetType === 'user' || targetType === 'custom' || targetType === 'not_enrolled') && selectedStudents.length > 0) {
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
        sendEmailNotifications(selectedStudents, 'user', titleEn, messageEn);

        toast({
          title: 'تم الإرسال',
          description: `تم إرسال الإشعار لـ ${selectedStudents.length} طالب`,
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
        sendEmailNotifications([], emailTargetType, titleEn, messageEn, emailTargetValue);

        toast({
          title: 'تم الإرسال',
          description: 'تم إرسال الإشعار بنجاح',
        });
      }

      // Reset form
      setTitleAr('');
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
        title: 'خطأ',
        description: 'فشل إرسال الإشعار',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
      setIsTranslating(false);
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
    <div className="min-h-screen bg-background pb-mobile-nav" dir="rtl">
      <Navbar />

      <main className="container mx-auto px-4 py-8 pt-24 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/assistant')}>
            <ArrowLeft className="h-5 w-5 rotate-180" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Send className="h-6 w-6 text-primary" />
              إرسال إشعار
            </h1>
            <p className="text-sm text-muted-foreground">
              أرسل إشعارات للطلاب
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Notification Type */}
          <div className="bg-card border rounded-xl p-4">
            <label className="block text-sm font-medium mb-3">
              نوع الإشعار
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
                    <span className="truncate">{type.labelAr}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Selection */}
          <div className="bg-card border rounded-xl p-4">
            <label className="block text-sm font-medium mb-3">
              أرسل إلى
            </label>
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { value: 'all', labelAr: 'كل الطلاب', icon: Users },
                { value: 'not_enrolled', labelAr: 'غير المشتركين', icon: UserX },
                { value: 'grade', labelAr: 'المرحلة', icon: GraduationCap },
                { value: 'attendance_mode', labelAr: 'نوع الحضور', icon: MapPin },
                { value: 'course', labelAr: 'كورس', icon: BookOpen },
                { value: 'lesson', labelAr: 'حصة', icon: Video },
                { value: 'user', labelAr: 'طلاب', icon: User },
                { value: 'custom', labelAr: 'فلتر مخصص', icon: AlertTriangle },
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
                    {target.labelAr}
                  </button>
                );
              })}
            </div>

            {/* Not Enrolled Info */}
            {targetType === 'not_enrolled' && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-4">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  سيتم إرسال الإشعار للطلاب المسجلين في المنصة ولكن غير مشتركين في أي كورس. 
                  عدد الطلاب: <strong>{notEnrolledStudents.length}</strong>
                </p>
              </div>
            )}

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
                <option value="">اختار الكورس</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.title_ar}
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
                <option value="">اختار الحصة</option>
                {lessons.map(lesson => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.title_ar}
                  </option>
                ))}
              </select>
            )}

            {/* Custom filter - Exam based */}
            {targetType === 'custom' && selectedCourse && (
              <div className="space-y-3 border-t pt-3 mt-3">
                <p className="text-sm font-medium text-muted-foreground">
                  فلترة حسب الامتحان
                </p>
                <select
                  value={filterExam}
                  onChange={(e) => setFilterExam(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-input rounded-lg"
                >
                  <option value="">اختار الامتحان</option>
                  {exams.map(exam => (
                    <option key={exam.id} value={exam.id}>
                      {exam.title_ar}
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
                      ما دخلوش الامتحان
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
                      درجة أقل من
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
                      درجة أعلى من
                    </button>
                  </div>
                )}

                {filterExam && (filterCondition === 'below_score' || filterCondition === 'above_score') && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm">النسبة:</span>
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

            {/* Student selector for user/custom/not_enrolled target */}
            {(targetType === 'user' || targetType === 'custom' || targetType === 'not_enrolled') && (
              <div className="mt-4 border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium">
                    اختار الطلاب
                    {selectedStudents.length > 0 && (
                      <Badge variant="secondary" className="mr-2">
                        {selectedStudents.length}
                      </Badge>
                    )}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAllFiltered}>
                      <Check className="h-3 w-3 ml-1" />
                      اختار الكل
                    </Button>
                    {selectedStudents.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearSelection}>
                        <X className="h-3 w-3 ml-1" />
                        إلغاء
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="relative mb-3">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="ابحث بالاسم أو الإيميل أو التليفون..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pr-10"
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
                        لا توجد نتائج
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
                              {student.full_name || 'بدون اسم'}
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

          {/* Message Content - Arabic Only */}
          <div className="bg-card border rounded-xl p-4 space-y-4">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                اكتب الرسالة بالعربي وهيتم ترجمتها للإنجليزي تلقائياً عند الإرسال
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                العنوان
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
                الرسالة
              </label>
              <textarea
                value={messageAr}
                onChange={(e) => setMessageAr(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-input rounded-lg min-h-[100px]"
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
                <Loader2 className="h-4 w-4 animate-spin" />
                {isTranslating ? 'جاري الترجمة...' : 'جاري الإرسال...'}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                إرسال الإشعار
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
