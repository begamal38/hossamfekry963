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
  CheckCircle2
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

type TargetType = 'all' | 'course' | 'lesson' | 'user';

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

interface Student {
  user_id: string;
  full_name: string | null;
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

export default function SendNotifications() {
  const navigate = useNavigate();
  const { t, language, isRTL } = useLanguage();
  const { canAccessDashboard, loading: roleLoading } = useUserRole();
  const { user } = useAuth();
  const { toast } = useToast();
  const isArabic = language === 'ar';

  const [notificationType, setNotificationType] = useState<NotificationType>('system_message');
  const [targetType, setTargetType] = useState<TargetType>('all');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedLesson, setSelectedLesson] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  
  const [titleEn, setTitleEn] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [messageEn, setMessageEn] = useState('');
  const [messageAr, setMessageAr] = useState('');
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!roleLoading && !canAccessDashboard()) {
      navigate('/');
      return;
    }
    fetchData();
  }, [roleLoading]);

  useEffect(() => {
    if (selectedCourse) {
      fetchLessons();
    }
  }, [selectedCourse]);

  const fetchData = async () => {
    try {
      const [coursesRes, studentsRes] = await Promise.all([
        supabase.from('courses').select('id, title, title_ar'),
        supabase.from('profiles').select('user_id, full_name'),
      ]);

      setCourses(coursesRes.data || []);
      setStudents(studentsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLessons = async () => {
    const { data } = await supabase
      .from('lessons')
      .select('id, title, title_ar, course_id')
      .eq('course_id', selectedCourse)
      .order('order_index');
    
    setLessons(data || []);
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

  const handleSend = async () => {
    if (!titleEn || !titleAr || !messageEn || !messageAr) {
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'من فضلك املأ كل الحقول' : 'Please fill all fields',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      const notification: any = {
        type: notificationType,
        title: titleEn,
        title_ar: titleAr,
        message: messageEn,
        message_ar: messageAr,
        target_type: targetType,
        sender_id: user?.id,
      };

      if (targetType === 'course' && selectedCourse) {
        notification.target_id = selectedCourse;
        notification.course_id = selectedCourse;
      } else if (targetType === 'lesson' && selectedLesson) {
        notification.target_id = selectedLesson;
        notification.lesson_id = selectedLesson;
        notification.course_id = selectedCourse;
      } else if (targetType === 'user' && selectedStudent) {
        notification.target_id = selectedStudent;
      }

      const { data: insertedNotification, error } = await supabase
        .from('notifications')
        .insert(notification)
        .select()
        .single();

      if (error) throw error;

      // Send email notifications in background
      supabase.functions.invoke('send-notification-email', {
        body: {
          notification_id: insertedNotification.id,
          target_type: targetType,
          target_value: targetType === 'course' ? selectedCourse : 
                        targetType === 'lesson' ? selectedLesson : 
                        targetType === 'user' ? selectedStudent : null,
          title: titleEn,
          title_ar: titleAr,
          message: messageEn,
          message_ar: messageAr,
          type: notificationType,
        }
      }).then(({ data, error: emailError }) => {
        if (emailError) {
          console.error('Email notification error:', emailError);
        } else if (data?.emails_sent > 0) {
          console.log(`${data.emails_sent} email(s) sent`);
        }
      });

      toast({
        title: isArabic ? 'تم الإرسال' : 'Sent',
        description: isArabic ? 'تم إرسال الإشعار بنجاح' : 'Notification sent successfully',
      });

      // Reset form
      setTitleEn('');
      setTitleAr('');
      setMessageEn('');
      setMessageAr('');
      setTargetType('all');
      setSelectedCourse('');
      setSelectedLesson('');
      setSelectedStudent('');
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

      <main className="container mx-auto px-4 py-8 pt-24 max-w-2xl">
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
                { value: 'course', labelEn: 'Course', labelAr: 'كورس', icon: BookOpen },
                { value: 'lesson', labelEn: 'Lesson', labelAr: 'حصة', icon: Video },
                { value: 'user', labelEn: 'Student', labelAr: 'طالب', icon: User },
              ].map(target => {
                const Icon = target.icon;
                return (
                  <button
                    key={target.value}
                    onClick={() => setTargetType(target.value as TargetType)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all",
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

            {/* Course selector */}
            {(targetType === 'course' || targetType === 'lesson') && (
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

            {/* Student selector */}
            {targetType === 'user' && (
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-input rounded-lg"
              >
                <option value="">{isArabic ? 'اختار الطالب' : 'Select Student'}</option>
                {students.map(student => (
                  <option key={student.user_id} value={student.user_id}>
                    {student.full_name || (isArabic ? 'بدون اسم' : 'No name')}
                  </option>
                ))}
              </select>
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
              <>{isArabic ? 'جاري الإرسال...' : 'Sending...'}</>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {isArabic ? 'إرسال الإشعار' : 'Send Notification'}
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
