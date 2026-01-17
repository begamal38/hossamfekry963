import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Video, Building, Users, Globe, MapPin, Layers, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/Navbar';
import { Badge } from '@/components/ui/badge';
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

type AttendanceMode = 'online' | 'center' | 'hybrid';
type AttendanceType = 'center' | 'online';

interface Student {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  attendance_mode: AttendanceMode;
  centerAttended: boolean;
  onlineCompleted: boolean;
}

interface ExistingAttendance {
  user_id: string;
  attendance_type: AttendanceType;
}

const ATTENDANCE_MODE_LABELS: Record<AttendanceMode, { ar: string; en: string; icon: typeof Globe }> = {
  online: { ar: 'أونلاين', en: 'Online', icon: Globe },
  center: { ar: 'سنتر', en: 'Center', icon: MapPin },
  hybrid: { ar: 'هجين', en: 'Hybrid', icon: Layers },
};

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
  const [filterMode, setFilterMode] = useState<AttendanceMode | 'all'>('all');
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
    if (selectedLesson && students.length > 0) {
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
        .select('user_id, full_name, phone, attendance_mode')
        .in('user_id', userIds);

      if (profileError) throw profileError;

      setStudents((profiles || []).map(p => ({
        user_id: p.user_id,
        full_name: p.full_name,
        phone: p.phone,
        attendance_mode: (p.attendance_mode as AttendanceMode) || 'online',
        centerAttended: false,
        onlineCompleted: false,
      })));
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchExistingAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from('lesson_attendance')
        .select('user_id, attendance_type')
        .eq('lesson_id', selectedLesson);

      if (error) throw error;

      const attendanceMap = new Map<string, { center: boolean; online: boolean }>();
      
      (data || []).forEach((a: ExistingAttendance) => {
        const existing = attendanceMap.get(a.user_id) || { center: false, online: false };
        if (a.attendance_type === 'center') {
          existing.center = true;
        } else if (a.attendance_type === 'online') {
          existing.online = true;
        }
        attendanceMap.set(a.user_id, existing);
      });

      setStudents(prev => prev.map(s => {
        const attendance = attendanceMap.get(s.user_id);
        return {
          ...s,
          centerAttended: attendance?.center || false,
          onlineCompleted: attendance?.online || false,
        };
      }));
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const toggleCenterAttendance = (userId: string) => {
    setStudents(prev => prev.map(s =>
      s.user_id === userId ? { ...s, centerAttended: !s.centerAttended } : s
    ));
  };

  const toggleOnlineAttendance = (userId: string) => {
    setStudents(prev => prev.map(s =>
      s.user_id === userId ? { ...s, onlineCompleted: !s.onlineCompleted } : s
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

      // Build new attendance records
      const attendanceRecords: { user_id: string; lesson_id: string; attendance_type: AttendanceType }[] = [];

      students.forEach(s => {
        if (s.centerAttended) {
          attendanceRecords.push({
            user_id: s.user_id,
            lesson_id: selectedLesson,
            attendance_type: 'center'
          });
        }
        if (s.onlineCompleted) {
          attendanceRecords.push({
            user_id: s.user_id,
            lesson_id: selectedLesson,
            attendance_type: 'online'
          });
        }
      });

      if (attendanceRecords.length > 0) {
        const { error } = await supabase
          .from('lesson_attendance')
          .insert(attendanceRecords);

        if (error) throw error;
      }

      const attendedCount = students.filter(s => s.centerAttended || s.onlineCompleted).length;

      toast({
        title: isArabic ? 'تم بنجاح' : 'Success',
        description: isArabic 
          ? `تم تسجيل حضور ${attendedCount} طالب` 
          : `Recorded attendance for ${attendedCount} students`
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

  const filteredStudents = filterMode === 'all' 
    ? students 
    : students.filter(s => s.attendance_mode === filterMode);

  const getAttendanceStatus = (student: Student) => {
    if (student.centerAttended && student.onlineCompleted) {
      return { label: isArabic ? 'حضور كامل' : 'Full Attendance', color: 'bg-green-500' };
    }
    if (student.centerAttended) {
      return { label: isArabic ? 'حضور سنتر' : 'Center', color: 'bg-blue-500' };
    }
    if (student.onlineCompleted) {
      return { label: isArabic ? 'أونلاين' : 'Online', color: 'bg-purple-500' };
    }
    return { label: isArabic ? 'غائب' : 'Absent', color: 'bg-red-500' };
  };

  const getModeIcon = (mode: AttendanceMode) => {
    const Icon = ATTENDANCE_MODE_LABELS[mode].icon;
    return <Icon className="h-3 w-3" />;
  };

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-3.5 h-3.5 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: `${i * 150}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-mobile-nav" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />

      <main className="container mx-auto px-4 py-8 pt-24 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/assistant')}>
            <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{isArabic ? 'تسجيل الحضور' : 'Record Attendance'}</h1>
            <p className="text-sm text-muted-foreground">
              {isArabic ? 'سجل حضور الطلاب في السنتر أو أونلاين' : 'Record student attendance for center or online'}
            </p>
          </div>
        </div>

        {/* Selectors */}
        <div className="bg-card border rounded-xl p-4 mb-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
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
                  <option value="">{isArabic ? 'لا توجد حصص' : 'No lessons'}</option>
                ) : (
                  lessons.map(lesson => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.lesson_type === 'online' ? '🖥️' : '🏫'} {isArabic ? lesson.title_ar : lesson.title}
                    </option>
                  ))
                )}
              </select>
            </div>
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

        {/* Filter by Attendance Mode */}
        <div className="bg-card border rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{isArabic ? 'فلترة حسب نوع الحضور' : 'Filter by Attendance Mode'}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterMode === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterMode('all')}
            >
              {isArabic ? 'الكل' : 'All'} ({students.length})
            </Button>
            {(['center', 'online', 'hybrid'] as AttendanceMode[]).map(mode => {
              const count = students.filter(s => s.attendance_mode === mode).length;
              return (
                <Button
                  key={mode}
                  variant={filterMode === mode ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterMode(mode)}
                  className="gap-1"
                >
                  {getModeIcon(mode)}
                  {isArabic ? ATTENDANCE_MODE_LABELS[mode].ar : ATTENDANCE_MODE_LABELS[mode].en} ({count})
                </Button>
              );
            })}
          </div>
        </div>

        {/* Students List */}
        <div className="bg-card border rounded-xl overflow-hidden mb-6">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="font-medium">{isArabic ? 'الطلاب المشتركين' : 'Enrolled Students'}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {filteredStudents.filter(s => s.centerAttended || s.onlineCompleted).length} / {filteredStudents.length}
            </span>
          </div>

          {/* Header Row */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-muted/50 border-b text-xs font-medium text-muted-foreground">
            <div className="col-span-5">{isArabic ? 'الطالب' : 'Student'}</div>
            <div className="col-span-2 text-center">{isArabic ? 'النوع' : 'Mode'}</div>
            <div className="col-span-2 text-center">{isArabic ? 'سنتر' : 'Center'}</div>
            <div className="col-span-2 text-center">{isArabic ? 'أونلاين' : 'Online'}</div>
            <div className="col-span-1 text-center">{isArabic ? 'الحالة' : 'Status'}</div>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {isArabic ? 'لا يوجد طلاب' : 'No students found'}
            </div>
          ) : (
            <div className="divide-y max-h-[500px] overflow-y-auto">
              {filteredStudents.map(student => {
                const status = getAttendanceStatus(student);
                return (
                  <div
                    key={student.user_id}
                    className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-muted/30 transition-colors"
                  >
                    {/* Student Info */}
                    <div className="col-span-5">
                      <p className="font-medium text-sm truncate">
                        {student.full_name || (isArabic ? 'بدون اسم' : 'No name')}
                      </p>
                      <p className="text-xs text-muted-foreground" dir="ltr">{student.phone}</p>
                    </div>

                    {/* Attendance Mode Badge */}
                    <div className="col-span-2 flex justify-center">
                      <Badge variant="outline" className="text-xs gap-1">
                        {getModeIcon(student.attendance_mode)}
                        <span className="hidden sm:inline">
                          {isArabic 
                            ? ATTENDANCE_MODE_LABELS[student.attendance_mode].ar 
                            : ATTENDANCE_MODE_LABELS[student.attendance_mode].en}
                        </span>
                      </Badge>
                    </div>

                    {/* Center Attendance Toggle */}
                    <div className="col-span-2 flex justify-center">
                      <button
                        onClick={() => toggleCenterAttendance(student.user_id)}
                        className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${
                          student.centerAttended
                            ? 'bg-blue-500 border-blue-500 text-white'
                            : 'border-muted-foreground/30 hover:border-blue-500/50'
                        }`}
                        title={isArabic ? 'حضور في السنتر' : 'Center attendance'}
                      >
                        {student.centerAttended && <Check className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Online Attendance Toggle */}
                    <div className="col-span-2 flex justify-center">
                      <button
                        onClick={() => toggleOnlineAttendance(student.user_id)}
                        className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${
                          student.onlineCompleted
                            ? 'bg-purple-500 border-purple-500 text-white'
                            : 'border-muted-foreground/30 hover:border-purple-500/50'
                        }`}
                        title={isArabic ? 'مشاهدة أونلاين' : 'Online completion'}
                      >
                        {student.onlineCompleted && <Check className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Status */}
                    <div className="col-span-1 flex justify-center">
                      <div
                        className={`w-3 h-3 rounded-full ${status.color}`}
                        title={status.label}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="bg-card border rounded-xl p-4 mb-6">
          <p className="text-sm font-medium mb-3">{isArabic ? 'دليل الحالات' : 'Status Legend'}</p>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>{isArabic ? 'حضور كامل (سنتر + أونلاين)' : 'Full (Center + Online)'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>{isArabic ? 'حضور سنتر فقط' : 'Center Only'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span>{isArabic ? 'أونلاين فقط' : 'Online Only'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>{isArabic ? 'غائب' : 'Absent'}</span>
            </div>
          </div>
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
