import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  BookOpen, 
  Check, 
  Loader2, 
  X, 
  AlertCircle, 
  Layers,
  User,
  Phone,
  GraduationCap,
  CheckCircle,
  XCircle,
  PauseCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
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
import { cn } from '@/lib/utils';

interface Student {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  grade: string | null;
  academic_year: string | null;
  language_track: string | null;
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

interface Enrollment {
  id: string;
  course_id: string;
  status: string;
  course?: Course;
}

interface ChapterEnrollment {
  id: string;
  chapter_id: string;
  course_id: string;
  status: string;
  chapter?: Chapter;
}

type ActionType = 'course' | 'chapter' | 'disable';

interface QuickEnrollmentDrawerProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  isArabic?: boolean;
}

export const QuickEnrollmentDrawer: React.FC<QuickEnrollmentDrawerProps> = ({
  student,
  isOpen,
  onClose,
  onComplete,
  isArabic = true
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [chapterEnrollments, setChapterEnrollments] = useState<ChapterEnrollment[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [actionType, setActionType] = useState<ActionType>('course');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [enrollmentToDisable, setEnrollmentToDisable] = useState<string>('');

  // Fetch data when drawer opens
  useEffect(() => {
    if (isOpen && student) {
      fetchData();
    }
  }, [isOpen, student]);

  // Fetch chapters when course is selected
  useEffect(() => {
    if (selectedCourseId && actionType === 'chapter') {
      fetchChapters(selectedCourseId);
    } else {
      setChapters([]);
    }
  }, [selectedCourseId, actionType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch only visible courses (hidden courses are closed for new enrollments)
      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, title, title_ar, grade')
        .eq('is_hidden', false)
        .order('grade');
      
      setCourses(coursesData || []);

      // Fetch student's active course enrollments
      const { data: enrollmentsData } = await supabase
        .from('course_enrollments')
        .select('id, course_id, status, courses:course_id(id, title, title_ar, grade)')
        .eq('user_id', student.user_id)
        .in('status', ['active', 'pending', 'suspended']);

      const formattedEnrollments = (enrollmentsData || []).map(e => ({
        id: e.id,
        course_id: e.course_id,
        status: e.status,
        course: e.courses as unknown as Course
      }));
      setEnrollments(formattedEnrollments);

      // Fetch student's active chapter enrollments
      const { data: chapterEnrollmentsData } = await supabase
        .from('chapter_enrollments')
        .select('id, chapter_id, course_id, status, chapters:chapter_id(id, title, title_ar, order_index)')
        .eq('user_id', student.user_id)
        .in('status', ['active', 'pending', 'suspended']);

      const formattedChapterEnrollments = (chapterEnrollmentsData || []).map(e => ({
        id: e.id,
        chapter_id: e.chapter_id,
        course_id: e.course_id,
        status: e.status,
        chapter: e.chapters as unknown as Chapter
      }));
      setChapterEnrollments(formattedChapterEnrollments);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChapters = async (courseId: string) => {
    try {
      const { data } = await supabase
        .from('chapters')
        .select('id, title, title_ar, order_index')
        .eq('course_id', courseId)
        .order('order_index');
      
      setChapters(data || []);
    } catch (error) {
      console.error('Error fetching chapters:', error);
    }
  };

  const handleActivateCourse = async () => {
    if (!selectedCourseId || !user) return;

    setActionLoading(true);
    try {
      // Check existing enrollment
      const { data: existing } = await supabase
        .from('course_enrollments')
        .select('id, status')
        .eq('user_id', student.user_id)
        .eq('course_id', selectedCourseId)
        .maybeSingle();

      if (existing) {
        if (existing.status === 'active') {
          toast({
            variant: 'destructive',
            title: isArabic ? 'الطالب مشترك بالفعل' : 'Already enrolled',
          });
          setActionLoading(false);
          return;
        }

        // Reactivate
        await supabase
          .from('course_enrollments')
          .update({
            status: 'active',
            activated_at: new Date().toISOString(),
            activated_by: user.id,
            suspended_at: null,
            suspended_by: null,
            suspended_reason: null,
          })
          .eq('id', existing.id);
      } else {
        // Create new enrollment
        await supabase
          .from('course_enrollments')
          .insert({
            user_id: student.user_id,
            course_id: selectedCourseId,
            status: 'active',
            activated_at: new Date().toISOString(),
            activated_by: user.id,
          });
      }

      toast({
        title: isArabic ? 'تم تفعيل الاشتراك بنجاح' : 'Enrollment activated',
        description: student.full_name || '',
      });

      handleSuccess();
    } catch (error) {
      console.error('Error activating course:', error);
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ في التفعيل' : 'Activation failed',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivateChapter = async () => {
    if (!selectedCourseId || !selectedChapterId || !user) return;

    setActionLoading(true);
    try {
      // Check existing enrollment
      const { data: existing } = await supabase
        .from('chapter_enrollments')
        .select('id, status')
        .eq('user_id', student.user_id)
        .eq('chapter_id', selectedChapterId)
        .maybeSingle();

      if (existing) {
        if (existing.status === 'active') {
          toast({
            variant: 'destructive',
            title: isArabic ? 'الطالب مشترك بالفعل في هذا الباب' : 'Already enrolled in this chapter',
          });
          setActionLoading(false);
          return;
        }

        // Reactivate
        await supabase
          .from('chapter_enrollments')
          .update({
            status: 'active',
            activated_at: new Date().toISOString(),
            activated_by: user.id,
          })
          .eq('id', existing.id);
      } else {
        // Create new enrollment
        await supabase
          .from('chapter_enrollments')
          .insert({
            user_id: student.user_id,
            chapter_id: selectedChapterId,
            course_id: selectedCourseId,
            status: 'active',
            activated_at: new Date().toISOString(),
            activated_by: user.id,
          });
      }

      toast({
        title: isArabic ? 'تم تفعيل الباب بنجاح' : 'Chapter activated',
        description: student.full_name || '',
      });

      handleSuccess();
    } catch (error) {
      console.error('Error activating chapter:', error);
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ في التفعيل' : 'Activation failed',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisableEnrollment = async () => {
    if (!enrollmentToDisable || !user) return;

    setActionLoading(true);
    try {
      // Determine if it's a course or chapter enrollment
      const isCourse = enrollments.some(e => e.id === enrollmentToDisable);
      
      if (isCourse) {
        await supabase
          .from('course_enrollments')
          .update({
            status: 'suspended',
            suspended_at: new Date().toISOString(),
            suspended_by: user.id,
            suspended_reason: 'Manual suspension by assistant',
          })
          .eq('id', enrollmentToDisable);
      } else {
        await supabase
          .from('chapter_enrollments')
          .update({
            status: 'suspended',
            suspended_at: new Date().toISOString(),
            suspended_by: user.id,
            suspended_reason: 'Manual suspension by assistant',
          })
          .eq('id', enrollmentToDisable);
      }

      toast({
        title: isArabic ? 'تم تعطيل الوصول' : 'Access disabled',
        description: student.full_name || '',
      });

      handleSuccess();
    } catch (error) {
      console.error('Error disabling enrollment:', error);
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ في التعطيل' : 'Disable failed',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuccess = () => {
    setSelectedCourseId('');
    setSelectedChapterId('');
    setEnrollmentToDisable('');
    onComplete?.();
    onClose();
  };

  const getGradeLabel = (grade: string | null, academicYear: string | null, languageTrack: string | null) => {
    if (academicYear && languageTrack) {
      const yearLabels: Record<string, string> = {
        'second_secondary': isArabic ? 'تانية ثانوي' : '2nd Sec',
        'third_secondary': isArabic ? 'تالته ثانوي' : '3rd Sec',
      };
      const trackLabels: Record<string, string> = {
        'arabic': isArabic ? 'عربي' : 'AR',
        'languages': isArabic ? 'لغات' : 'Lang',
      };
      return `${yearLabels[academicYear] || ''} - ${trackLabels[languageTrack] || ''}`;
    }
    return grade || (isArabic ? 'غير محدد' : 'Not set');
  };

  const getStatusInfo = () => {
    if (enrollments.length > 0) {
      const activeCourses = enrollments.filter(e => e.status === 'active');
      if (activeCourses.length > 0) {
        return {
          label: isArabic 
            ? `مشترك في ${activeCourses.length} كورس` 
            : `Enrolled in ${activeCourses.length} course(s)`,
          variant: 'success' as const
        };
      }
    }
    
    if (chapterEnrollments.length > 0) {
      const activeChapters = chapterEnrollments.filter(e => e.status === 'active');
      if (activeChapters.length > 0) {
        return {
          label: isArabic 
            ? `مشترك في ${activeChapters.length} باب` 
            : `Enrolled in ${activeChapters.length} chapter(s)`,
          variant: 'accent' as const
        };
      }
    }

    return {
      label: isArabic ? 'غير مشترك' : 'Not enrolled',
      variant: 'secondary' as const
    };
  };

  const statusInfo = getStatusInfo();

  const allActiveEnrollments = [
    ...enrollments.filter(e => e.status === 'active').map(e => ({
      id: e.id,
      label: isArabic ? e.course?.title_ar : e.course?.title,
      type: 'course' as const
    })),
    ...chapterEnrollments.filter(e => e.status === 'active').map(e => ({
      id: e.id,
      label: isArabic ? e.chapter?.title_ar : e.chapter?.title,
      type: 'chapter' as const
    }))
  ];

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side={isArabic ? 'right' : 'left'} 
        className="w-full sm:max-w-md overflow-y-auto"
      >
        <SheetHeader className="text-start">
          <SheetTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <span>{isArabic ? 'تفعيل / إدارة الاشتراك' : 'Quick Enrollment'}</span>
          </SheetTitle>
          <SheetDescription>
            {isArabic ? 'تفعيل أو تعطيل اشتراك سريع' : 'Quickly activate or disable access'}
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Student Info */}
            <div className="bg-muted/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">
                  {student.full_name || (isArabic ? 'بدون اسم' : 'No name')}
                </h3>
                <Badge 
                  variant="secondary"
                  className={cn(
                    statusInfo.variant === 'success' && 'bg-green-500/10 text-green-600',
                    statusInfo.variant === 'accent' && 'bg-primary/10 text-primary'
                  )}
                >
                  {statusInfo.label}
                </Badge>
              </div>
              
              <div className="space-y-1 text-sm text-muted-foreground">
                {student.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3" />
                    <span dir="ltr">{student.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-3 h-3" />
                  <span>{getGradeLabel(student.grade, student.academic_year, student.language_track)}</span>
                </div>
              </div>
            </div>

            {/* Action Type Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">
                {isArabic ? 'اختر الإجراء' : 'Select Action'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={actionType === 'course' ? 'default' : 'outline'}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                  onClick={() => setActionType('course')}
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="text-xs">{isArabic ? 'كورس' : 'Course'}</span>
                </Button>
                <Button
                  variant={actionType === 'chapter' ? 'default' : 'outline'}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                  onClick={() => setActionType('chapter')}
                >
                  <Layers className="w-4 h-4" />
                  <span className="text-xs">{isArabic ? 'باب' : 'Chapter'}</span>
                </Button>
                <Button
                  variant={actionType === 'disable' ? 'destructive' : 'outline'}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                  onClick={() => setActionType('disable')}
                  disabled={allActiveEnrollments.length === 0}
                >
                  <XCircle className="w-4 h-4" />
                  <span className="text-xs">{isArabic ? 'تعطيل' : 'Disable'}</span>
                </Button>
              </div>
            </div>

            {/* Course Activation */}
            {actionType === 'course' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {isArabic ? 'اختر الكورس' : 'Select Course'}
                  </label>
                  <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                    <SelectTrigger>
                      <SelectValue placeholder={isArabic ? 'اختر الكورس...' : 'Select course...'} />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map(course => (
                        <SelectItem key={course.id} value={course.id}>
                          {isArabic ? course.title_ar : course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full gap-2"
                  disabled={!selectedCourseId || actionLoading}
                  onClick={handleActivateCourse}
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {isArabic ? 'تفعيل الكورس' : 'Activate Course'}
                </Button>
              </div>
            )}

            {/* Chapter Activation */}
            {actionType === 'chapter' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {isArabic ? 'اختر الكورس' : 'Select Course'}
                  </label>
                  <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                    <SelectTrigger>
                      <SelectValue placeholder={isArabic ? 'اختر الكورس...' : 'Select course...'} />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map(course => (
                        <SelectItem key={course.id} value={course.id}>
                          {isArabic ? course.title_ar : course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCourseId && chapters.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {isArabic ? 'اختر الباب' : 'Select Chapter'}
                    </label>
                    <Select value={selectedChapterId} onValueChange={setSelectedChapterId}>
                      <SelectTrigger>
                        <SelectValue placeholder={isArabic ? 'اختر الباب...' : 'Select chapter...'} />
                      </SelectTrigger>
                      <SelectContent>
                        {chapters.map(chapter => (
                          <SelectItem key={chapter.id} value={chapter.id}>
                            {isArabic ? chapter.title_ar : chapter.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedCourseId && chapters.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {isArabic ? 'لا توجد أبواب في هذا الكورس' : 'No chapters in this course'}
                  </p>
                )}

                <Button
                  className="w-full gap-2"
                  disabled={!selectedCourseId || !selectedChapterId || actionLoading}
                  onClick={handleActivateChapter}
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {isArabic ? 'تفعيل الباب' : 'Activate Chapter'}
                </Button>
              </div>
            )}

            {/* Disable Enrollment */}
            {actionType === 'disable' && (
              <div className="space-y-4">
                {allActiveEnrollments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {isArabic ? 'لا يوجد اشتراكات نشطة' : 'No active enrollments'}
                  </p>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        {isArabic ? 'اختر الاشتراك للتعطيل' : 'Select Enrollment to Disable'}
                      </label>
                      <div className="space-y-2">
                        {allActiveEnrollments.map(enrollment => (
                          <button
                            key={enrollment.id}
                            className={cn(
                              "w-full p-3 rounded-lg border text-start transition-all",
                              enrollmentToDisable === enrollment.id
                                ? "border-destructive bg-destructive/10"
                                : "border-border hover:border-muted-foreground/30"
                            )}
                            onClick={() => setEnrollmentToDisable(enrollment.id)}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{enrollment.label}</span>
                              <Badge variant="outline" className="text-xs">
                                {enrollment.type === 'course' 
                                  ? (isArabic ? 'كورس' : 'Course') 
                                  : (isArabic ? 'باب' : 'Chapter')}
                              </Badge>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button
                      variant="destructive"
                      className="w-full gap-2"
                      disabled={!enrollmentToDisable || actionLoading}
                      onClick={handleDisableEnrollment}
                    >
                      {actionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <PauseCircle className="w-4 h-4" />
                      )}
                      {isArabic ? 'تعطيل الوصول' : 'Disable Access'}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      {isArabic 
                        ? 'هذا سيمنع الطالب من الوصول للمحتوى' 
                        : 'This will prevent the student from accessing content'}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
