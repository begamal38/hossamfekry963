import React, { useState, useEffect, useCallback } from 'react';
import { Users, BookOpen, Check, Loader2, AlertCircle, Upload, X, Layers, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FloatingActionButton } from '@/components/assistant/FloatingActionButton';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Types
interface Student {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  grade: string | null;
  short_id: number;
}

interface Course {
  id: string;
  title: string;
  title_ar: string;
  grade: string;
}

interface Chapter {
  id: string;
  title: string;
  title_ar: string;
  order_index: number | null;
}

interface BulkEnrollmentProps {
  isArabic?: boolean;
  onEnrollmentComplete?: () => void;
  showAsFab?: boolean;
}

type EnrollmentMode = 'select' | 'paste';
type EnrollmentTarget = 'course' | 'chapters';
type EnrollmentAction = 'activate' | 'deactivate';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const BulkEnrollment: React.FC<BulkEnrollmentProps> = ({
  isArabic = true,
  onEnrollmentComplete,
  showAsFab = false,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  // Mode states
  const [mode, setMode] = useState<EnrollmentMode>('select');
  const [enrollmentTarget, setEnrollmentTarget] = useState<EnrollmentTarget>('course');
  const [action, setAction] = useState<EnrollmentAction>('activate');

  // Data states
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedChapterIds, setSelectedChapterIds] = useState<Set<string>>(new Set());

  // Paste mode state
  const [pasteInput, setPasteInput] = useState('');
  const [resolvedStudents, setResolvedStudents] = useState<Student[]>([]);
  const [unresolvedLines, setUnresolvedLines] = useState<string[]>([]);

  // Loading states
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  // Search & filter
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all students on open
  useEffect(() => {
    if (!open) return;
    fetchStudents();
    fetchCourses();
  }, [open]);

  // Fetch chapters when course is selected
  useEffect(() => {
    if (selectedCourseId && enrollmentTarget === 'chapters') {
      fetchChapters(selectedCourseId);
    }
  }, [selectedCourseId, enrollmentTarget]);

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      // Get student user IDs
      const { data: studentRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'student');

      const studentUserIds = studentRoles?.map(r => r.user_id) || [];
      if (studentUserIds.length === 0) {
        setStudents([]);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone, email, grade, short_id')
        .in('user_id', studentUserIds)
        .order('full_name');

      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchCourses = async () => {
    setLoadingCourses(true);
    try {
      const { data } = await supabase
        .from('courses')
        .select('id, title, title_ar, grade')
        .order('grade');
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchChapters = async (courseId: string) => {
    setLoadingChapters(true);
    try {
      const { data } = await supabase
        .from('chapters')
        .select('id, title, title_ar, order_index')
        .eq('course_id', courseId)
        .order('order_index');
      setChapters(data || []);
    } catch (error) {
      console.error('Error fetching chapters:', error);
    } finally {
      setLoadingChapters(false);
    }
  };

  // Resolve pasted input (phones, emails, IDs)
  const resolvePastedInput = useCallback(async () => {
    if (!pasteInput.trim()) return;
    setResolving(true);

    const lines = pasteInput
      .split(/[\n,;]+/)
      .map(l => l.trim())
      .filter(l => l.length > 0);

    const resolved: Student[] = [];
    const unresolved: string[] = [];

    // Batch lookup by phone, email, or short_id
    for (const line of lines) {
      // Check if it's a number (short_id)
      const isNumber = /^\d+$/.test(line);
      
      let match: Student | undefined;
      
      if (isNumber) {
        match = students.find(s => s.short_id === parseInt(line));
      }
      
      if (!match) {
        match = students.find(s => 
          s.phone === line || 
          s.phone?.replace(/\s/g, '') === line.replace(/\s/g, '') ||
          s.email?.toLowerCase() === line.toLowerCase()
        );
      }

      if (match) {
        if (!resolved.some(r => r.user_id === match!.user_id)) {
          resolved.push(match);
        }
      } else {
        unresolved.push(line);
      }
    }

    setResolvedStudents(resolved);
    setUnresolvedLines(unresolved);
    setResolving(false);
  }, [pasteInput, students]);

  // Toggle student selection
  const toggleStudent = (studentId: string) => {
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  // Toggle chapter selection
  const toggleChapter = (chapterId: string) => {
    setSelectedChapterIds(prev => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  };

  // Select all visible students
  const selectAllStudents = () => {
    const filtered = filteredStudents;
    const allIds = new Set(filtered.map(s => s.user_id));
    setSelectedStudentIds(allIds);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedStudentIds(new Set());
    setResolvedStudents([]);
    setUnresolvedLines([]);
  };

  // Filter students by search term
  const filteredStudents = students.filter(s => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.full_name?.toLowerCase().includes(term) ||
      s.phone?.includes(searchTerm) ||
      s.email?.toLowerCase().includes(term) ||
      s.short_id.toString().includes(searchTerm)
    );
  });

  // Get final list of students to enroll
  const getStudentsToEnroll = (): string[] => {
    if (mode === 'paste') {
      return resolvedStudents.map(s => s.user_id);
    }
    return Array.from(selectedStudentIds);
  };

  // Handle bulk enrollment
  const handleBulkEnroll = async () => {
    const studentIds = getStudentsToEnroll();
    
    if (studentIds.length === 0) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'يجب اختيار طالب واحد على الأقل' : 'Select at least one student',
      });
      return;
    }

    if (!selectedCourseId) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'يجب اختيار الكورس' : 'Select a course',
      });
      return;
    }

    if (enrollmentTarget === 'chapters' && selectedChapterIds.size === 0) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'يجب اختيار باب واحد على الأقل' : 'Select at least one chapter',
      });
      return;
    }

    setEnrolling(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      const assistantId = user!.id;
      const now = new Date().toISOString();

      if (enrollmentTarget === 'course') {
        // Course-level enrollment
        for (const studentId of studentIds) {
          try {
            // Check existing enrollment
            const { data: existing } = await supabase
              .from('course_enrollments')
              .select('id, status')
              .eq('user_id', studentId)
              .eq('course_id', selectedCourseId)
              .maybeSingle();

            if (action === 'activate') {
              if (existing) {
                // Update existing
                await supabase
                  .from('course_enrollments')
                  .update({
                    status: 'active',
                    activated_at: now,
                    activated_by: assistantId,
                  })
                  .eq('id', existing.id);
              } else {
                // Create new
                await supabase.from('course_enrollments').insert({
                  user_id: studentId,
                  course_id: selectedCourseId,
                  status: 'active',
                  activated_at: now,
                  activated_by: assistantId,
                });
              }
              successCount++;
            } else {
              // Deactivate
              if (existing) {
                await supabase
                  .from('course_enrollments')
                  .update({ status: 'expired' })
                  .eq('id', existing.id);
                successCount++;
              }
            }
          } catch (e) {
            console.error('Error enrolling student:', e);
            errorCount++;
          }
        }
      } else {
        // Chapter-level enrollment
        const chapterIds = Array.from(selectedChapterIds);
        
        for (const studentId of studentIds) {
          for (const chapterId of chapterIds) {
            try {
              // Check existing
              const { data: existing } = await supabase
                .from('chapter_enrollments')
                .select('id, status')
                .eq('user_id', studentId)
                .eq('chapter_id', chapterId)
                .maybeSingle();

              if (action === 'activate') {
                if (existing) {
                  await supabase
                    .from('chapter_enrollments')
                    .update({
                      status: 'active',
                      activated_at: now,
                      activated_by: assistantId,
                    })
                    .eq('id', existing.id);
                } else {
                  await supabase.from('chapter_enrollments').insert({
                    user_id: studentId,
                    chapter_id: chapterId,
                    course_id: selectedCourseId,
                    status: 'active',
                    activated_at: now,
                    activated_by: assistantId,
                  });
                }
                successCount++;
              } else {
                if (existing) {
                  await supabase
                    .from('chapter_enrollments')
                    .update({ status: 'expired' })
                    .eq('id', existing.id);
                  successCount++;
                }
              }
            } catch (e) {
              console.error('Error with chapter enrollment:', e);
              errorCount++;
            }
          }
        }
      }

      // Show result
      if (errorCount === 0) {
        toast({
          title: isArabic ? 'تم بنجاح' : 'Success',
          description: isArabic
            ? `تم ${action === 'activate' ? 'تفعيل' : 'إلغاء تفعيل'} ${successCount} اشتراك`
            : `${successCount} enrollments ${action === 'activate' ? 'activated' : 'deactivated'}`,
        });
      } else {
        toast({
          title: isArabic ? 'تم جزئياً' : 'Partial Success',
          description: isArabic
            ? `نجح: ${successCount}، فشل: ${errorCount}`
            : `Success: ${successCount}, Failed: ${errorCount}`,
          variant: errorCount > successCount ? 'destructive' : 'default',
        });
      }

      resetState();
      setOpen(false);
      onEnrollmentComplete?.();
    } catch (error) {
      console.error('Bulk enrollment error:', error);
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'حدث خطأ أثناء العملية' : 'An error occurred',
      });
    } finally {
      setEnrolling(false);
    }
  };

  const resetState = () => {
    setMode('select');
    setEnrollmentTarget('course');
    setAction('activate');
    setSelectedStudentIds(new Set());
    setSelectedCourseId(null);
    setSelectedChapterIds(new Set());
    setPasteInput('');
    setResolvedStudents([]);
    setUnresolvedLines([]);
    setSearchTerm('');
  };

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) resetState();
  };

  const studentsToEnrollCount = mode === 'paste' ? resolvedStudents.length : selectedStudentIds.size;
  const canSubmit = studentsToEnrollCount > 0 && selectedCourseId && 
    (enrollmentTarget === 'course' || selectedChapterIds.size > 0);

  // FAB trigger - opens dialog directly
  const fabTrigger = showAsFab ? (
    <FloatingActionButton
      icon={Plus}
      onClick={() => setOpen(true)}
      label={isArabic ? 'تسجيل اشتراك' : 'Enroll'}
    />
  ) : null;

  return (
    <TooltipProvider>
      {fabTrigger}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {!showAsFab && (
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Users className="w-4 h-4" />
                  {isArabic ? 'اشتراك جماعي' : 'Bulk Enrollment'}
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isArabic ? 'تقدر تضيف أكتر من طالب في خطوة واحدة' : 'Enroll multiple students at once'}</p>
            </TooltipContent>
          </Tooltip>
        )}

      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {isArabic ? 'إضافة اشتراك جماعي' : 'Bulk Enrollment'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4 px-1">
          {/* Mode Selector */}
          <div className="flex gap-2">
            <Button
              variant={mode === 'select' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('select')}
              className="flex-1"
            >
              {isArabic ? 'اختيار من القائمة' : 'Select from List'}
            </Button>
            <Button
              variant={mode === 'paste' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('paste')}
              className="flex-1"
            >
              <Upload className="w-4 h-4 me-1" />
              {isArabic ? 'لصق البيانات' : 'Paste Data'}
            </Button>
          </div>

          {/* Select Mode */}
          {mode === 'select' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  placeholder={isArabic ? 'بحث بالاسم أو الموبايل أو الكود...' : 'Search by name, phone, or ID...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={selectAllStudents}>
                  {isArabic ? 'تحديد الكل' : 'Select All'}
                </Button>
                {selectedStudentIds.size > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearSelection}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="border rounded-lg max-h-48 overflow-y-auto bg-background">
                {loadingStudents ? (
                  <div className="p-4 text-center">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <p className="p-4 text-center text-muted-foreground text-sm">
                    {isArabic ? 'لا يوجد طلاب' : 'No students found'}
                  </p>
                ) : (
                  <div className="divide-y">
                    {filteredStudents.slice(0, 50).map((student) => (
                      <button
                        key={student.user_id}
                        type="button"
                        onClick={() => toggleStudent(student.user_id)}
                        className={`w-full p-3 text-start hover:bg-muted/50 transition-colors flex items-center justify-between ${
                          selectedStudentIds.has(student.user_id) ? 'bg-primary/10' : ''
                        }`}
                      >
                        <div>
                          <p className="font-medium text-sm">{student.full_name || 'بدون اسم'}</p>
                          <p className="text-xs text-muted-foreground" dir="ltr">
                            {student.phone || student.email} • #{student.short_id}
                          </p>
                        </div>
                        {selectedStudentIds.has(student.user_id) && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedStudentIds.size > 0 && (
                <Badge variant="secondary">
                  {isArabic ? `${selectedStudentIds.size} طالب محدد` : `${selectedStudentIds.size} selected`}
                </Badge>
              )}
            </div>
          )}

          {/* Paste Mode */}
          {mode === 'paste' && (
            <div className="space-y-3">
              <Textarea
                placeholder={isArabic 
                  ? 'الصق أرقام الموبايل أو الإيميلات أو أكواد الطلاب (سطر لكل طالب أو مفصولة بفاصلة)'
                  : 'Paste phone numbers, emails, or student IDs (one per line or comma-separated)'}
                value={pasteInput}
                onChange={(e) => setPasteInput(e.target.value)}
                rows={4}
              />
              <Button onClick={resolvePastedInput} disabled={resolving || !pasteInput.trim()}>
                {resolving ? <Loader2 className="w-4 h-4 animate-spin me-1" /> : null}
                {isArabic ? 'تحليل البيانات' : 'Resolve Students'}
              </Button>

              {resolvedStudents.length > 0 && (
                <div className="border rounded-lg p-3 bg-green-500/10 border-green-500/20">
                  <p className="text-sm font-medium text-green-700 mb-2">
                    {isArabic ? `تم التعرف على ${resolvedStudents.length} طالب` : `Resolved ${resolvedStudents.length} students`}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {resolvedStudents.map(s => (
                      <Badge key={s.user_id} variant="outline" className="text-xs">
                        {s.full_name || s.phone}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {unresolvedLines.length > 0 && (
                <div className="border rounded-lg p-3 bg-destructive/10 border-destructive/20">
                  <p className="text-sm font-medium text-destructive mb-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {isArabic ? `لم يتم التعرف على ${unresolvedLines.length} عنصر` : `${unresolvedLines.length} unresolved`}
                  </p>
                  <p className="text-xs text-muted-foreground">{unresolvedLines.join(', ')}</p>
                </div>
              )}
            </div>
          )}

          {/* Course Selection */}
          <div className="space-y-2 pt-4 border-t">
            <label className="text-sm font-medium">
              {isArabic ? 'اختر الكورس' : 'Select Course'}
            </label>
            <Select value={selectedCourseId || ''} onValueChange={setSelectedCourseId}>
              <SelectTrigger>
                <SelectValue placeholder={isArabic ? 'اختر الكورس...' : 'Select course...'} />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-muted-foreground" />
                      <span>{isArabic ? course.title_ar : course.title}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Enrollment Target */}
          {selectedCourseId && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {isArabic ? 'نوع الاشتراك' : 'Enrollment Type'}
              </label>
              <div className="flex gap-2">
                <Button
                  variant={enrollmentTarget === 'course' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEnrollmentTarget('course')}
                  className="flex-1"
                >
                  <BookOpen className="w-4 h-4 me-1" />
                  {isArabic ? 'الكورس كامل' : 'Full Course'}
                </Button>
                <Button
                  variant={enrollmentTarget === 'chapters' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEnrollmentTarget('chapters')}
                  className="flex-1"
                >
                  <Layers className="w-4 h-4 me-1" />
                  {isArabic ? 'أبواب محددة' : 'Specific Chapters'}
                </Button>
              </div>
            </div>
          )}

          {/* Chapter Selection */}
          {enrollmentTarget === 'chapters' && selectedCourseId && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {isArabic ? 'اختر الأبواب' : 'Select Chapters'}
              </label>
              <div className="border rounded-lg max-h-32 overflow-y-auto bg-background">
                {loadingChapters ? (
                  <div className="p-4 text-center">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </div>
                ) : chapters.length === 0 ? (
                  <p className="p-4 text-center text-muted-foreground text-sm">
                    {isArabic ? 'لا توجد أبواب' : 'No chapters'}
                  </p>
                ) : (
                  <div className="divide-y">
                    {chapters.map((chapter) => (
                      <button
                        key={chapter.id}
                        type="button"
                        onClick={() => toggleChapter(chapter.id)}
                        className={`w-full p-2 text-start hover:bg-muted/50 transition-colors flex items-center justify-between text-sm ${
                          selectedChapterIds.has(chapter.id) ? 'bg-primary/10' : ''
                        }`}
                      >
                        <span>{isArabic ? chapter.title_ar : chapter.title}</span>
                        {selectedChapterIds.has(chapter.id) && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Selection */}
          {selectedCourseId && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {isArabic ? 'الإجراء' : 'Action'}
              </label>
              <div className="flex gap-2">
                <Button
                  variant={action === 'activate' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAction('activate')}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {isArabic ? 'تفعيل' : 'Activate'}
                </Button>
                <Button
                  variant={action === 'deactivate' ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() => setAction('deactivate')}
                  className="flex-1"
                >
                  {isArabic ? 'إلغاء التفعيل' : 'Deactivate'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 pt-4 border-t">
          <Button
            onClick={handleBulkEnroll}
            disabled={!canSubmit || enrolling}
            className="w-full gap-2"
          >
            {enrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
            {isArabic
              ? `${action === 'activate' ? 'تفعيل' : 'إلغاء'} ${studentsToEnrollCount} طالب`
              : `${action === 'activate' ? 'Activate' : 'Deactivate'} ${studentsToEnrollCount} Students`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </TooltipProvider>
  );
};
