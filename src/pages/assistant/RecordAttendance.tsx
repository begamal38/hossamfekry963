import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Video, Building, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';

interface Course {
  id: string;
  title: string;
  title_ar: string;
}

interface Lesson {
  id: string;
  title: string;
  title_ar: string;
  lesson_type: string;
}

interface Student {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  isPresent: boolean;
}

export default function RecordAttendance() {
  const navigate = useNavigate();
  const { language, isRTL } = useLanguage();
  const { canAccessDashboard, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const isArabic = language === 'ar';

  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedLesson, setSelectedLesson] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!roleLoading && !canAccessDashboard()) {
      navigate('/');
      return;
    }
    fetchCourses();
  }, [roleLoading]);

  useEffect(() => {
    if (selectedCourse) {
      fetchLessons();
      fetchStudents();
    }
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedLesson) {
      fetchExistingAttendance();
    }
  }, [selectedLesson]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, title_ar')
        .order('created_at');

      if (error) throw error;
      setCourses(data || []);
      if (data && data.length > 0) {
        setSelectedCourse(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('id, title, title_ar, lesson_type')
        .eq('course_id', selectedCourse)
        .order('order_index');

      if (error) throw error;
      setLessons(data || []);
      if (data && data.length > 0) {
        setSelectedLesson(data[0].id);
      } else {
        setSelectedLesson('');
      }
    } catch (error) {
      console.error('Error fetching lessons:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      // Get enrolled students for this course
      const { data: enrollments, error: enrollError } = await supabase
        .from('course_enrollments')
        .select('user_id')
        .eq('course_id', selectedCourse)
        .eq('status', 'active');

      if (enrollError) throw enrollError;

      const userIds = (enrollments || []).map(e => e.user_id);

      if (userIds.length === 0) {
        setStudents([]);
        return;
      }

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone')
        .in('user_id', userIds);

      if (profileError) throw profileError;

      setStudents((profiles || []).map(p => ({ ...p, isPresent: false })));
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchExistingAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from('lesson_attendance')
        .select('user_id')
        .eq('lesson_id', selectedLesson);

      if (error) throw error;

      const presentIds = (data || []).map(a => a.user_id);
      
      setStudents(prev => prev.map(s => ({
        ...s,
        isPresent: presentIds.includes(s.user_id)
      })));
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const toggleAttendance = (userId: string) => {
    setStudents(prev => prev.map(s => 
      s.user_id === userId ? { ...s, isPresent: !s.isPresent } : s
    ));
  };

  const handleSaveAttendance = async () => {
    if (!selectedLesson) {
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'يرجى اختيار درس' : 'Please select a lesson',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      // Delete existing attendance for this lesson
      await supabase
        .from('lesson_attendance')
        .delete()
        .eq('lesson_id', selectedLesson);

      // Insert new attendance records
      const presentStudents = students.filter(s => s.isPresent);
      
      if (presentStudents.length > 0) {
        const { error } = await supabase
          .from('lesson_attendance')
          .insert(presentStudents.map(s => ({
            user_id: s.user_id,
            lesson_id: selectedLesson
          })));

        if (error) throw error;
      }

      toast({
        title: isArabic ? 'تم بنجاح' : 'Success',
        description: isArabic ? `تم تسجيل حضور ${presentStudents.length} طالب` : `Recorded attendance for ${presentStudents.length} students`
      });
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'فشل في حفظ الحضور' : 'Failed to save attendance',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedLessonData = lessons.find(l => l.id === selectedLesson);

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
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/assistant')}>
            <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
          </Button>
          <h1 className="text-2xl font-bold">{isArabic ? 'تسجيل الحضور' : 'Record Attendance'}</h1>
        </div>

        {/* Selectors */}
        <div className="bg-card border rounded-xl p-4 mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">{isArabic ? 'الكورس' : 'Course'}</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-input rounded-lg"
            >
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {isArabic ? course.title_ar : course.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{isArabic ? 'الدرس' : 'Lesson'}</label>
            <select
              value={selectedLesson}
              onChange={(e) => setSelectedLesson(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-input rounded-lg"
            >
              {lessons.length === 0 ? (
                <option value="">{isArabic ? 'لا توجد دروس' : 'No lessons'}</option>
              ) : (
                lessons.map(lesson => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.lesson_type === 'online' ? '🖥️' : '🏫'} {isArabic ? lesson.title_ar : lesson.title}
                  </option>
                ))
              )}
            </select>
          </div>

          {selectedLessonData && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {selectedLessonData.lesson_type === 'online' ? (
                <>
                  <Video className="h-4 w-4 text-blue-500" />
                  {isArabic ? 'درس أونلاين' : 'Online Lesson'}
                </>
              ) : (
                <>
                  <Building className="h-4 w-4 text-green-500" />
                  {isArabic ? 'درس في السنتر' : 'Center Lesson'}
                </>
              )}
            </div>
          )}
        </div>

        {/* Students List */}
        <div className="bg-card border rounded-xl overflow-hidden mb-6">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="font-medium">{isArabic ? 'الطلاب المشتركين' : 'Enrolled Students'}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {students.filter(s => s.isPresent).length} / {students.length}
            </span>
          </div>

          {students.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {isArabic ? 'لا يوجد طلاب مشتركين في هذا الكورس' : 'No students enrolled in this course'}
            </div>
          ) : (
            <div className="divide-y">
              {students.map(student => (
                <div
                  key={student.user_id}
                  onClick={() => toggleAttendance(student.user_id)}
                  className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${
                    student.isPresent ? 'bg-green-500/10' : 'hover:bg-muted/30'
                  }`}
                >
                  <div>
                    <p className="font-medium">{student.full_name || (isArabic ? 'بدون اسم' : 'No name')}</p>
                    <p className="text-sm text-muted-foreground" dir="ltr">{student.phone}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    student.isPresent 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : 'border-muted-foreground'
                  }`}>
                    {student.isPresent && <Check className="h-4 w-4" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save Button */}
        <Button 
          onClick={handleSaveAttendance} 
          className="w-full" 
          size="lg"
          disabled={saving || !selectedLesson}
        >
          {saving ? (isArabic ? 'جاري الحفظ...' : 'Saving...') : (isArabic ? 'حفظ الحضور' : 'Save Attendance')}
        </Button>
      </main>
    </div>
  );
}