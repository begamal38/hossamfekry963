import React, { useState, useEffect, useCallback } from 'react';
import { Search, UserPlus, BookOpen, Check, Loader2, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const GRADE_OPTIONS: Record<string, { ar: string; en: string }> = {
  'second_arabic': { ar: 'تانية ثانوي عربي', en: '2nd Secondary - Arabic' },
  'second_languages': { ar: 'تانية ثانوي لغات', en: '2nd Secondary - Languages' },
  'third_arabic': { ar: 'تالتة ثانوي عربي', en: '3rd Secondary - Arabic' },
  'third_languages': { ar: 'تالتة ثانوي لغات', en: '3rd Secondary - Languages' },
};

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isValidUUID = (id: string | null | undefined): boolean => {
  if (!id) return false;
  return UUID_REGEX.test(id);
};

interface Student {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  grade: string | null;
}

interface Course {
  id: string;
  title: string;
  title_ar: string;
  grade: string;
}

interface ManualEnrollmentProps {
  isArabic?: boolean;
  onEnrollmentComplete?: () => void;
}

export const ManualEnrollment: React.FC<ManualEnrollmentProps> = ({ 
  isArabic = true,
  onEnrollmentComplete
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Get selected student object from ID
  const selectedStudent = students.find(s => s.user_id === selectedStudentId) || null;

  // Fetch courses on dialog open
  useEffect(() => {
    const fetchCourses = async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, title_ar, grade')
        .order('grade');
      
      if (error) {
        console.error('Error fetching courses:', error);
        return;
      }
      
      // Validate that all courses have valid UUIDs
      const validCourses = (data || []).filter(c => isValidUUID(c.id));
      setCourses(validCourses);
    };

    if (open) {
      fetchCourses();
    }
  }, [open]);

  // Clear validation error when selections change
  useEffect(() => {
    setValidationError(null);
  }, [selectedStudentId, selectedCourseId]);

  // Search students
  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) return;
    
    setSearchLoading(true);
    setValidationError(null);
    
    try {
      // First get student user IDs
      const { data: studentRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'student');

      if (rolesError) throw rolesError;

      const studentUserIds = studentRoles?.map(r => r.user_id) || [];

      if (studentUserIds.length === 0) {
        setStudents([]);
        setSearchLoading(false);
        return;
      }

      // Search profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone, email, grade')
        .in('user_id', studentUserIds)
        .or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) throw error;
      
      // Validate that all students have valid UUIDs
      const validStudents = (data || []).filter(s => isValidUUID(s.user_id));
      setStudents(validStudents);
    } catch (error) {
      console.error('Error searching students:', error);
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ في البحث' : 'Search error',
        description: isArabic ? 'حدث خطأ أثناء البحث' : 'An error occurred while searching',
      });
    } finally {
      setSearchLoading(false);
    }
  }, [searchTerm, isArabic, toast]);

  // Select student - locks the ID immediately
  const handleSelectStudent = useCallback((studentId: string) => {
    if (!isValidUUID(studentId)) {
      setValidationError(isArabic ? 'معرف الطالب غير صالح' : 'Invalid student ID');
      return;
    }
    setSelectedStudentId(studentId);
    setValidationError(null);
  }, [isArabic]);

  // Select course - locks the ID immediately
  const handleSelectCourse = useCallback((courseId: string) => {
    if (!isValidUUID(courseId)) {
      setValidationError(isArabic ? 'معرف الكورس غير صالح' : 'Invalid course ID');
      return;
    }
    setSelectedCourseId(courseId);
    setValidationError(null);
  }, [isArabic]);

  // Validate before enrollment
  const validateEnrollment = (): boolean => {
    // Check user/assistant is authenticated
    if (!user?.id) {
      setValidationError(isArabic ? 'يجب تسجيل الدخول أولاً' : 'You must be logged in');
      return false;
    }

    // Check student is selected and valid
    if (!selectedStudentId) {
      setValidationError(isArabic ? 'يجب اختيار الطالب' : 'Student not selected');
      return false;
    }
    
    if (!isValidUUID(selectedStudentId)) {
      setValidationError(isArabic ? 'معرف الطالب غير صالح' : 'Invalid student ID');
      return false;
    }

    // Check course is selected and valid
    if (!selectedCourseId) {
      setValidationError(isArabic ? 'يجب اختيار الكورس' : 'Course not selected');
      return false;
    }
    
    if (!isValidUUID(selectedCourseId)) {
      setValidationError(isArabic ? 'معرف الكورس غير صالح' : 'Invalid course ID');
      return false;
    }

    return true;
  };

  // Handle enrollment
  const handleEnroll = async () => {
    // Frontend validation
    if (!validateEnrollment()) {
      return;
    }

    // TypeScript safety - we've validated these are non-null above
    const studentId = selectedStudentId!;
    const courseId = selectedCourseId!;
    const assistantId = user!.id;

    setEnrolling(true);
    setValidationError(null);

    try {
      // Check if already enrolled
      const { data: existing, error: checkError } = await supabase
        .from('course_enrollments')
        .select('id, status')
        .eq('user_id', studentId)
        .eq('course_id', courseId)
        .maybeSingle();

      if (checkError) {
        throw new Error(isArabic ? 'خطأ في التحقق من الاشتراك' : 'Error checking enrollment');
      }

      if (existing) {
        if (existing.status === 'active') {
          setValidationError(isArabic ? 'هذا الطالب مشترك بالفعل في الكورس' : 'Student already enrolled');
          setEnrolling(false);
          return;
        }
        
        // Reactivate existing enrollment
        const { error: updateError } = await supabase
          .from('course_enrollments')
          .update({
            status: 'active',
            activated_at: new Date().toISOString(),
            activated_by: assistantId,
          })
          .eq('id', existing.id);

        if (updateError) {
          if (updateError.code === '42501') {
            throw new Error(isArabic ? 'ليس لديك صلاحية لتعديل الاشتراكات' : 'Permission denied');
          }
          throw updateError;
        }
      } else {
        // Create new enrollment with explicit UUID values
        const { error: insertError } = await supabase
          .from('course_enrollments')
          .insert({
            user_id: studentId,
            course_id: courseId,
            status: 'active',
            activated_at: new Date().toISOString(),
            activated_by: assistantId,
          });

        if (insertError) {
          if (insertError.code === '42501') {
            throw new Error(isArabic ? 'ليس لديك صلاحية لإضافة اشتراكات' : 'Permission denied');
          }
          if (insertError.code === '23503') {
            throw new Error(isArabic ? 'الطالب أو الكورس غير موجود' : 'Student or course not found');
          }
          throw insertError;
        }
      }

      // Success
      const studentName = selectedStudent?.full_name || '';
      toast({
        title: isArabic ? 'تم التسجيل بنجاح' : 'Enrollment successful',
        description: isArabic 
          ? `تم تسجيل ${studentName} في الكورس`
          : `${studentName} has been enrolled in the course`,
      });

      // Reset and close
      resetState();
      setOpen(false);
      onEnrollmentComplete?.();
    } catch (error) {
      console.error('Error enrolling student:', error);
      const errorMessage = error instanceof Error ? error.message : (isArabic ? 'حدث خطأ أثناء تسجيل الطالب' : 'An error occurred while enrolling the student');
      
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ في التسجيل' : 'Enrollment error',
        description: errorMessage,
      });
    } finally {
      setEnrolling(false);
    }
  };

  const resetState = useCallback(() => {
    setSelectedStudentId(null);
    setSelectedCourseId(null);
    setSearchTerm('');
    setStudents([]);
    setValidationError(null);
  }, []);

  const handleOpenChange = useCallback((v: boolean) => {
    setOpen(v);
    if (!v) resetState();
  }, [resetState]);

  // Check if submit should be enabled
  const canSubmit = Boolean(selectedStudentId && selectedCourseId && !enrolling);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <UserPlus className="w-4 h-4" />
          {isArabic ? 'تسجيل طالب يدوياً' : 'Manual Enrollment'}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {isArabic ? 'تسجيل طالب في كورس' : 'Enroll Student in Course'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4 px-1">
          {/* Validation Error */}
          {validationError && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Step 1: Search Student */}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              {isArabic ? '1. البحث عن الطالب' : '1. Search for Student'}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={isArabic ? 'اسم الطالب أو رقم الموبايل...' : 'Student name or phone...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} disabled={searchLoading || !searchTerm.trim()}>
                {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isArabic ? 'بحث' : 'Search'}
              </Button>
            </div>

            {/* Search Results */}
            {students.length > 0 && (
              <div className="border rounded-lg divide-y max-h-48 overflow-y-auto bg-background">
                {students.map((student) => (
                  <button
                    key={student.user_id}
                    type="button"
                    onClick={() => handleSelectStudent(student.user_id)}
                    className={`w-full p-3 text-right hover:bg-muted/50 transition-colors ${
                      selectedStudentId === student.user_id ? 'bg-primary/10' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{student.full_name || 'بدون اسم'}</p>
                        <p className="text-sm text-muted-foreground" dir="ltr">
                          {student.phone || student.email}
                        </p>
                      </div>
                      {selectedStudentId === student.user_id && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {searchTerm && !searchLoading && students.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                {isArabic ? 'لم يتم العثور على طلاب' : 'No students found'}
              </p>
            )}
          </div>

          {/* Step 2: Select Course */}
          {selectedStudent && (
            <div className="space-y-3">
              <label className="text-sm font-medium">
                {isArabic ? '2. اختيار الكورس' : '2. Select Course'}
              </label>
              
              <div className="bg-muted/50 rounded-lg p-3 mb-3">
                <p className="text-sm text-muted-foreground">
                  {isArabic ? 'الطالب المختار:' : 'Selected student:'}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-medium">{selectedStudent.full_name}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    type="button"
                    onClick={() => setSelectedStudentId(null)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Select 
                value={selectedCourseId || ''} 
                onValueChange={handleSelectCourse}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={isArabic ? 'اختر الكورس...' : 'Select course...'} />
                </SelectTrigger>
                <SelectContent 
                  position="popper" 
                  side="bottom" 
                  align="start"
                  className="max-h-60 overflow-y-auto z-[100]"
                >
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{isArabic ? course.title_ar : course.title}</span>
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {GRADE_OPTIONS[course.grade]?.ar || course.grade}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Step 3: Confirm */}
          {selectedStudent && (
            <div className="pt-4 border-t">
              <Button 
                onClick={handleEnroll} 
                className="w-full gap-2" 
                disabled={!canSubmit}
                type="button"
              >
                {enrolling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                {isArabic ? 'تأكيد التسجيل' : 'Confirm Enrollment'}
              </Button>
              
              {!selectedCourseId && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  {isArabic ? 'اختر الكورس أولاً للمتابعة' : 'Select a course to continue'}
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
