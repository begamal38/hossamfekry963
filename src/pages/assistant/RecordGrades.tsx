import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Award, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface Exam {
  id: string;
  title: string;
  title_ar: string;
  max_score: number;
  exam_date: string | null;
}

interface StudentResult {
  user_id: string;
  full_name: string | null;
  score: number | null;
  result_id: string | null;
}

export default function RecordGrades() {
  const navigate = useNavigate();
  const { language, isRTL } = useLanguage();
  const { canAccessDashboard, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const isArabic = language === 'ar';

  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<StudentResult[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddExam, setShowAddExam] = useState(false);
  const [newExam, setNewExam] = useState({
    title: '',
    title_ar: '',
    max_score: 100,
    exam_date: ''
  });

  useEffect(() => {
    if (!roleLoading && !canAccessDashboard()) {
      navigate('/');
      return;
    }
    fetchCourses();
  }, [roleLoading]);

  useEffect(() => {
    if (selectedCourse) {
      fetchExams();
      fetchStudents();
    }
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedExam && students.length > 0) {
      fetchExistingResults();
    }
  }, [selectedExam, students.length]);

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

  const fetchExams = async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('course_id', selectedCourse)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExams(data || []);
      if (data && data.length > 0) {
        setSelectedExam(data[0].id);
      } else {
        setSelectedExam('');
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
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
        .select('user_id, full_name')
        .in('user_id', userIds);

      if (profileError) throw profileError;

      setStudents((profiles || []).map(p => ({ 
        ...p, 
        score: null,
        result_id: null
      })));
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchExistingResults = async () => {
    try {
      const { data, error } = await supabase
        .from('exam_results')
        .select('id, user_id, score')
        .eq('exam_id', selectedExam);

      if (error) throw error;

      const resultsMap = new Map((data || []).map(r => [r.user_id, { score: r.score, id: r.id }]));

      setStudents(prev => prev.map(s => ({
        ...s,
        score: resultsMap.get(s.user_id)?.score ?? null,
        result_id: resultsMap.get(s.user_id)?.id ?? null
      })));
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  const handleAddExam = async () => {
    if (!newExam.title || !newExam.title_ar) {
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'يرجى ملء جميع الحقول' : 'Please fill all fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('exams')
        .insert({
          course_id: selectedCourse,
          title: newExam.title,
          title_ar: newExam.title_ar,
          max_score: newExam.max_score,
          exam_date: newExam.exam_date || null
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: isArabic ? 'تم بنجاح' : 'Success',
        description: isArabic ? 'تم إضافة الامتحان' : 'Exam added successfully'
      });

      setNewExam({ title: '', title_ar: '', max_score: 100, exam_date: '' });
      setShowAddExam(false);
      fetchExams();
      if (data) setSelectedExam(data.id);
    } catch (error) {
      console.error('Error adding exam:', error);
    }
  };

  const updateScore = (userId: string, score: string) => {
    const numScore = score === '' ? null : parseInt(score);
    setStudents(prev => prev.map(s => 
      s.user_id === userId ? { ...s, score: numScore } : s
    ));
  };

  const handleSaveResults = async () => {
    if (!selectedExam) return;

    setSaving(true);
    try {
      const studentsWithScores = students.filter(s => s.score !== null);

      for (const student of studentsWithScores) {
        if (student.result_id) {
          // Update existing
          await supabase
            .from('exam_results')
            .update({ score: student.score! })
            .eq('id', student.result_id);
        } else {
          // Insert new
          await supabase
            .from('exam_results')
            .insert({
              user_id: student.user_id,
              exam_id: selectedExam,
              score: student.score!
            });
        }
      }

      toast({
        title: isArabic ? 'تم بنجاح' : 'Success',
        description: isArabic ? 'تم حفظ الدرجات' : 'Grades saved successfully'
      });

      fetchExistingResults();
    } catch (error) {
      console.error('Error saving results:', error);
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'فشل في حفظ الدرجات' : 'Failed to save grades',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedExamData = exams.find(e => e.id === selectedExam);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-mobile-nav" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 pt-24 max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/assistant')}>
            <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
          </Button>
          <h1 className="text-2xl font-bold">{isArabic ? 'تسجيل الدرجات' : 'Record Grades'}</h1>
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
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">{isArabic ? 'الامتحان' : 'Exam'}</label>
              <Button variant="ghost" size="sm" onClick={() => setShowAddExam(true)} className="gap-1">
                <Plus className="h-4 w-4" />
                {isArabic ? 'امتحان جديد' : 'New Exam'}
              </Button>
            </div>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-input rounded-lg"
            >
              {exams.length === 0 ? (
                <option value="">{isArabic ? 'لا توجد امتحانات' : 'No exams'}</option>
              ) : (
                exams.map(exam => (
                  <option key={exam.id} value={exam.id}>
                    {isArabic ? exam.title_ar : exam.title} ({exam.max_score})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Add Exam Form */}
        {showAddExam && (
          <div className="bg-card border rounded-xl p-6 mb-6">
            <h3 className="font-semibold mb-4">{isArabic ? 'امتحان جديد' : 'New Exam'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Input
                placeholder={isArabic ? 'اسم الامتحان (إنجليزي)' : 'Exam Name (English)'}
                value={newExam.title}
                onChange={(e) => setNewExam({ ...newExam, title: e.target.value })}
              />
              <Input
                placeholder={isArabic ? 'اسم الامتحان (عربي)' : 'Exam Name (Arabic)'}
                value={newExam.title_ar}
                onChange={(e) => setNewExam({ ...newExam, title_ar: e.target.value })}
              />
              <Input
                type="number"
                placeholder={isArabic ? 'الدرجة العظمى' : 'Max Score'}
                value={newExam.max_score}
                onChange={(e) => setNewExam({ ...newExam, max_score: parseInt(e.target.value) || 100 })}
              />
              <Input
                type="date"
                value={newExam.exam_date}
                onChange={(e) => setNewExam({ ...newExam, exam_date: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddExam}>{isArabic ? 'إضافة' : 'Add'}</Button>
              <Button variant="outline" onClick={() => setShowAddExam(false)}>{isArabic ? 'إلغاء' : 'Cancel'}</Button>
            </div>
          </div>
        )}

        {/* Students Grades */}
        {selectedExam && (
          <div className="bg-card border rounded-xl overflow-hidden mb-6">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <span className="font-medium">{isArabic ? 'درجات الطلاب' : 'Student Grades'}</span>
              </div>
              {selectedExamData && (
                <span className="text-sm text-muted-foreground">
                  {isArabic ? 'الدرجة العظمى:' : 'Max:'} {selectedExamData.max_score}
                </span>
              )}
            </div>

            {students.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {isArabic ? 'لا يوجد طلاب مشتركين' : 'No enrolled students'}
              </div>
            ) : (
              <div className="divide-y">
                {students.map(student => (
                  <div key={student.user_id} className="flex items-center justify-between p-4">
                    <span className="font-medium">{student.full_name || (isArabic ? 'بدون اسم' : 'No name')}</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={selectedExamData?.max_score || 100}
                        value={student.score ?? ''}
                        onChange={(e) => updateScore(student.user_id, e.target.value)}
                        placeholder="--"
                        className="w-20 text-center"
                      />
                      <span className="text-muted-foreground">/ {selectedExamData?.max_score || 100}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Save Button */}
        {selectedExam && students.length > 0 && (
          <Button 
            onClick={handleSaveResults} 
            className="w-full gap-2" 
            size="lg"
            disabled={saving}
          >
            <Save className="h-4 w-4" />
            {saving ? (isArabic ? 'جاري الحفظ...' : 'Saving...') : (isArabic ? 'حفظ الدرجات' : 'Save Grades')}
          </Button>
        )}
      </main>
    </div>
  );
}