import React, { useState, useEffect } from 'react';
import { Search, UserPlus, BookOpen, Check, Loader2, X } from 'lucide-react';
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
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  // Fetch courses on mount
  useEffect(() => {
    const fetchCourses = async () => {
      const { data } = await supabase
        .from('courses')
        .select('id, title, title_ar, grade')
        .order('grade');
      
      setCourses(data || []);
    };

    if (open) {
      fetchCourses();
    }
  }, [open]);

  // Search students
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setSearchLoading(true);
    try {
      // First get student user IDs
      const { data: studentRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'student');

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
      setStudents(data || []);
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
  };

  // Handle enrollment
  const handleEnroll = async () => {
    if (!selectedStudent || !selectedCourseId || !user) return;

    setEnrolling(true);
    try {
      // Check if already enrolled
      const { data: existing } = await supabase
        .from('course_enrollments')
        .select('id, status')
        .eq('user_id', selectedStudent.user_id)
        .eq('course_id', selectedCourseId)
        .maybeSingle();

      if (existing) {
        if (existing.status === 'active') {
          toast({
            title: isArabic ? 'مشترك بالفعل' : 'Already enrolled',
            description: isArabic ? 'هذا الطالب مشترك بالفعل في الكورس' : 'This student is already enrolled in the course',
          });
          setEnrolling(false);
          return;
        }
        
        // Reactivate existing enrollment
        const { error } = await supabase
          .from('course_enrollments')
          .update({
            status: 'active',
            activated_at: new Date().toISOString(),
            activated_by: user.id,
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new enrollment
        const { error } = await supabase
          .from('course_enrollments')
          .insert({
            user_id: selectedStudent.user_id,
            course_id: selectedCourseId,
            status: 'active',
            activated_at: new Date().toISOString(),
            activated_by: user.id,
          });

        if (error) throw error;
      }

      toast({
        title: isArabic ? 'تم التسجيل بنجاح' : 'Enrollment successful',
        description: isArabic 
          ? `تم تسجيل ${selectedStudent.full_name} في الكورس`
          : `${selectedStudent.full_name} has been enrolled in the course`,
      });

      // Reset and close
      setSelectedStudent(null);
      setSelectedCourseId('');
      setSearchTerm('');
      setStudents([]);
      setOpen(false);
      onEnrollmentComplete?.();
    } catch (error) {
      console.error('Error enrolling student:', error);
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ في التسجيل' : 'Enrollment error',
        description: isArabic ? 'حدث خطأ أثناء تسجيل الطالب' : 'An error occurred while enrolling the student',
      });
    } finally {
      setEnrolling(false);
    }
  };

  const resetState = () => {
    setSelectedStudent(null);
    setSelectedCourseId('');
    setSearchTerm('');
    setStudents([]);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetState(); }}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <UserPlus className="w-4 h-4" />
          {isArabic ? 'تسجيل طالب يدوياً' : 'Manual Enrollment'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isArabic ? 'تسجيل طالب في كورس' : 'Enroll Student in Course'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
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
              <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                {students.map((student) => (
                  <button
                    key={student.user_id}
                    onClick={() => setSelectedStudent(student)}
                    className={`w-full p-3 text-right hover:bg-muted/50 transition-colors ${
                      selectedStudent?.user_id === student.user_id ? 'bg-primary/10' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{student.full_name || 'بدون اسم'}</p>
                        <p className="text-sm text-muted-foreground" dir="ltr">
                          {student.phone || student.email}
                        </p>
                      </div>
                      {selectedStudent?.user_id === student.user_id && (
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
                    onClick={() => setSelectedStudent(null)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder={isArabic ? 'اختر الكورس...' : 'Select course...'} />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                        <span>{isArabic ? course.title_ar : course.title}</span>
                        <Badge variant="outline" className="text-xs">
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
          {selectedStudent && selectedCourseId && (
            <div className="pt-4 border-t">
              <Button 
                onClick={handleEnroll} 
                className="w-full gap-2" 
                disabled={enrolling}
              >
                {enrolling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                {isArabic ? 'تأكيد التسجيل' : 'Confirm Enrollment'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
