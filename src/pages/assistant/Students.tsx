import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, GraduationCap, TrendingUp, Award, Download, Upload, Wifi, Building2, Shuffle, FileSpreadsheet, FileText, ChevronLeft, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { StudentImport } from '@/components/assistant/StudentImport';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useStudentExport } from '@/hooks/useStudentExport';
import { EGYPTIAN_GOVERNORATES, getGovernorateLabel } from '@/constants/governorates';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Database } from '@/integrations/supabase/types';
import { AssistantPageHeader } from '@/components/assistant/AssistantPageHeader';
import { MobileDataCard } from '@/components/assistant/MobileDataCard';
import { FloatingActionButton } from '@/components/assistant/FloatingActionButton';
import { EmptyState } from '@/components/assistant/EmptyState';
import { SearchFilterBar } from '@/components/assistant/SearchFilterBar';
import { StatusSummaryCard } from '@/components/dashboard/StatusSummaryCard';
import { QuickEnrollmentDrawer } from '@/components/assistant/QuickEnrollmentDrawer';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
type AttendanceMode = Database['public']['Enums']['attendance_mode'];

interface Profile {
  user_id: string;
  short_id: number;
  full_name: string | null;
  phone: string | null;
  grade: string | null;
  academic_year: string | null;
  language_track: string | null;
  governorate: string | null;
  attendance_mode: AttendanceMode;
  created_at: string;
}

interface EnrichedStudent extends Profile {
  avgProgress: number;
  avgExamScore: number;
  totalExams: number;
  enrollmentCount: number;
}

const getGroupLabel = (academicYear: string | null, languageTrack: string | null, isArabic: boolean): string | null => {
  if (!academicYear || !languageTrack) return null;
  
  const yearLabels: Record<string, { ar: string; en: string }> = {
    'second_secondary': { ar: 'تانية ثانوي', en: '2nd Sec' },
    'third_secondary': { ar: 'تالته ثانوي', en: '3rd Sec' },
  };
  
  const trackLabels: Record<string, { ar: string; en: string }> = {
    'arabic': { ar: 'عربي', en: 'AR' },
    'languages': { ar: 'لغات', en: 'Lang' },
  };
  
  const year = yearLabels[academicYear];
  const track = trackLabels[languageTrack];
  if (!year || !track) return null;
  return isArabic ? `${year.ar} - ${track.ar}` : `${year.en} - ${track.en}`;
};

export default function Students() {
  const { user, loading: authLoading } = useAuth();
  const { canAccessDashboard, loading: roleLoading } = useUserRole();
  const { isRTL, t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [students, setStudents] = useState<EnrichedStudent[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<EnrichedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { exportStudents, exporting, progress: exportProgress, canExport, roleLoading: exportRoleLoading } = useStudentExport();
  
  const [modeDialogOpen, setModeDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<EnrichedStudent | null>(null);
  const [newMode, setNewMode] = useState<AttendanceMode>('online');
  const [updatingMode, setUpdatingMode] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  
  // Quick Enrollment state
  const [quickEnrollStudent, setQuickEnrollStudent] = useState<EnrichedStudent | null>(null);
  const [quickEnrollOpen, setQuickEnrollOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [academicYearFilter, setAcademicYearFilter] = useState('all');
  const [attendanceModeFilter, setAttendanceModeFilter] = useState('all');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!roleLoading && !canAccessDashboard()) {
      navigate('/');
    }
  }, [roleLoading, canAccessDashboard, navigate]);

  const fetchStudents = useCallback(async () => {
    if (!user || !canAccessDashboard()) return;

    try {
      const { data: studentRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'student');

      if (rolesError) throw rolesError;

      const studentUserIds = (studentRoles || []).map(r => r.user_id);

      if (studentUserIds.length === 0) {
        setStudents([]);
        setFilteredStudents([]);
        setLoading(false);
        return;
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, short_id, full_name, phone, grade, academic_year, language_track, governorate, attendance_mode, created_at')
        .in('user_id', studentUserIds)
        .neq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: enrollmentsData } = await supabase
        .from('course_enrollments')
        .select('user_id, progress');

      const { data: examResultsData } = await supabase
        .from('exam_results')
        .select('user_id, score, exams:exam_id(max_score)');

      const enrichedStudents: EnrichedStudent[] = (profilesData || []).map(profile => {
        const userEnrollments = (enrollmentsData || []).filter(e => e.user_id === profile.user_id);
        const userExamResults = (examResultsData || []).filter(e => e.user_id === profile.user_id);
        
        const avgProgress = userEnrollments.length > 0
          ? Math.round(userEnrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / userEnrollments.length)
          : 0;
        
        const avgExamScore = userExamResults.length > 0
          ? Math.round(userExamResults.reduce((sum, e) => {
              const maxScore = (e.exams as any)?.max_score || 100;
              return sum + ((e.score / maxScore) * 100);
            }, 0) / userExamResults.length)
          : 0;

        return {
          ...profile,
          avgProgress,
          avgExamScore,
          totalExams: userExamResults.length,
          enrollmentCount: userEnrollments.length,
        };
      });

      setStudents(enrichedStudents);
      setFilteredStudents(enrichedStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  }, [user, canAccessDashboard]);

  useEffect(() => {
    if (!roleLoading && canAccessDashboard()) {
      fetchStudents();
    }
  }, [user, roleLoading, canAccessDashboard, fetchStudents]);

  useEffect(() => {
    let filtered = students;

    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.phone?.includes(searchTerm)
      );
    }

    if (academicYearFilter !== 'all') {
      filtered = filtered.filter((s) => s.academic_year === academicYearFilter);
    }

    if (attendanceModeFilter !== 'all') {
      filtered = filtered.filter((s) => s.attendance_mode === attendanceModeFilter);
    }

    setFilteredStudents(filtered);
  }, [searchTerm, academicYearFilter, attendanceModeFilter, students]);

  const clearFilters = () => {
    setSearchTerm('');
    setAcademicYearFilter('all');
    setAttendanceModeFilter('all');
  };

  const openModeDialog = (student: EnrichedStudent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedStudent(student);
    setNewMode(student.attendance_mode);
    setModeDialogOpen(true);
  };

  const handleUpdateMode = async () => {
    if (!selectedStudent) return;
    
    setUpdatingMode(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ attendance_mode: newMode })
        .eq('user_id', selectedStudent.user_id);

      if (error) throw error;

      setStudents(prev => prev.map(s => 
        s.user_id === selectedStudent.user_id 
          ? { ...s, attendance_mode: newMode }
          : s
      ));

      toast({
        title: t('mode.updated'),
        description: `${selectedStudent.full_name || (isRTL ? 'الطالب' : 'Student')}`,
      });

      setModeDialogOpen(false);
    } catch (error) {
      console.error('Error updating attendance mode:', error);
      toast({
        variant: 'destructive',
        title: t('mode.updateFailed'),
      });
    } finally {
      setUpdatingMode(false);
    }
  };

  const getModeIcon = (mode: AttendanceMode) => {
    switch (mode) {
      case 'online': return Wifi;
      case 'center': return Building2;
      case 'hybrid': return Shuffle;
    }
  };

  const getModeColor = (mode: AttendanceMode) => {
    switch (mode) {
      case 'online': return 'text-blue-500';
      case 'center': return 'text-green-500';
      case 'hybrid': return 'text-purple-500';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const openQuickEnroll = (student: EnrichedStudent, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickEnrollStudent(student);
    setQuickEnrollOpen(true);
  };

  const hasActiveFilters = academicYearFilter !== 'all' || attendanceModeFilter !== 'all';

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-mobile-nav" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      
      <main className="container mx-auto px-3 sm:px-4 py-4 pt-20">
        {/* Mobile-First Header */}
        <AssistantPageHeader
          title={isRTL ? 'إدارة الطلاب' : 'Students'}
          subtitle={`${filteredStudents.length} ${isRTL ? 'طالب' : 'students'}`}
          backHref="/assistant"
          isRTL={isRTL}
          icon={User}
          actions={
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setImportDialogOpen(true)}
                className="h-8 w-8"
              >
                <Upload className="h-4 w-4" />
              </Button>
              {!exportRoleLoading && canExport() && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      disabled={exporting || students.length === 0}
                      className="h-8 w-8"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                    <DropdownMenuItem onClick={() => exportStudents('xlsx')} className="gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      {isRTL ? 'Excel' : 'Excel'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportStudents('csv')} className="gap-2">
                      <FileText className="h-4 w-4" />
                      {isRTL ? 'CSV' : 'CSV'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          }
        />

        {/* Status Summary */}
        <StatusSummaryCard
          primaryText={`${students.length} ${isRTL ? 'طالب مسجل' : 'registered'}`}
          secondaryText={students.filter(s => s.enrollmentCount > 0).length > 0 
            ? `${students.filter(s => s.enrollmentCount > 0).length} ${isRTL ? 'مشترك' : 'enrolled'}`
            : undefined}
          isRTL={isRTL}
          className="mb-4"
        />

        {/* Search & Filters */}
        <SearchFilterBar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder={isRTL ? 'ابحث بالاسم أو الهاتف...' : 'Search by name or phone...'}
          filters={[
            {
              value: academicYearFilter,
              onChange: setAcademicYearFilter,
              options: [
                { value: 'all', label: isRTL ? 'كل السنوات' : 'All Years' },
                { value: 'second_secondary', label: isRTL ? 'تانية ثانوي' : '2nd Sec' },
                { value: 'third_secondary', label: isRTL ? 'تالته ثانوي' : '3rd Sec' },
              ],
            },
            {
              value: attendanceModeFilter,
              onChange: setAttendanceModeFilter,
              options: [
                { value: 'all', label: isRTL ? 'كل الأنماط' : 'All Modes' },
                { value: 'online', label: isRTL ? 'أونلاين' : 'Online' },
                { value: 'center', label: isRTL ? 'سنتر' : 'Center' },
                { value: 'hybrid', label: isRTL ? 'مختلط' : 'Hybrid' },
              ],
            },
          ]}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
          isRTL={isRTL}
        />

        {/* Students List - Mobile Cards */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <EmptyState
            icon={User}
            title={isRTL ? 'لا يوجد طلاب' : 'No students found'}
            description={searchTerm || hasActiveFilters 
              ? (isRTL ? 'جرب تعديل البحث أو الفلاتر' : 'Try adjusting your search or filters')
              : undefined}
            actionLabel={hasActiveFilters ? (isRTL ? 'مسح الفلاتر' : 'Clear Filters') : undefined}
            onAction={hasActiveFilters ? clearFilters : undefined}
          />
        ) : (
          <div className="space-y-2">
            {filteredStudents.map((student) => {
              const groupLabel = getGroupLabel(student.academic_year, student.language_track, isRTL);
              const ModeIcon = getModeIcon(student.attendance_mode);
              
              return (
                <MobileDataCard
                  key={student.user_id}
                  title={student.full_name || (isRTL ? 'بدون اسم' : 'No name')}
                  subtitle={student.phone || undefined}
                  badge={groupLabel || undefined}
                  badgeVariant="default"
                  icon={User}
                  iconColor="text-primary"
                  metadata={[
                    { icon: ModeIcon, label: t(`mode.${student.attendance_mode}`) },
                    ...(student.avgProgress > 0 ? [{ icon: TrendingUp, label: `${student.avgProgress}%` }] : []),
                    ...(student.totalExams > 0 ? [{ icon: Award, label: `${student.avgExamScore}%`, className: getScoreColor(student.avgExamScore) }] : []),
                  ]}
                  onClick={() => navigate(`/assistant/students/${student.short_id}`)}
                  actions={[
                    { 
                      icon: Plus, 
                      onClick: (e?: React.MouseEvent) => openQuickEnroll(student, e as React.MouseEvent), 
                      variant: 'outline' as const,
                      className: 'bg-green-50 hover:bg-green-100 text-green-600 border-green-200 dark:bg-green-950 dark:hover:bg-green-900 dark:text-green-400 dark:border-green-800'
                    },
                    { 
                      icon: ChevronLeft, 
                      onClick: () => navigate(`/assistant/students/${student.short_id}`), 
                      variant: 'ghost' as const,
                      className: isRTL ? '' : 'rotate-180'
                    }
                  ]}
                  isRTL={isRTL}
                />
              );
            })}
          </div>
        )}

        {/* Floating Import Button */}
        <FloatingActionButton
          icon={Upload}
          onClick={() => setImportDialogOpen(true)}
          label={isRTL ? 'استيراد' : 'Import'}
        />

        {/* Attendance Mode Dialog */}
        <Dialog open={modeDialogOpen} onOpenChange={setModeDialogOpen}>
          <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('mode.change')}</DialogTitle>
              <DialogDescription>
                {selectedStudent?.full_name || (isRTL ? 'الطالب' : 'Student')}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-3 gap-2">
                {(['online', 'center', 'hybrid'] as AttendanceMode[]).map((mode) => (
                  <Button
                    key={mode}
                    variant={newMode === mode ? 'default' : 'outline'}
                    className="flex flex-col items-center gap-2 h-auto py-4"
                    onClick={() => setNewMode(mode)}
                  >
                    {mode === 'online' && <Wifi className="h-5 w-5" />}
                    {mode === 'center' && <Building2 className="h-5 w-5" />}
                    {mode === 'hybrid' && <Shuffle className="h-5 w-5" />}
                    <span className="text-xs">{t(`mode.${mode}`)}</span>
                  </Button>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setModeDialogOpen(false)}>
                {t('system.cancel')}
              </Button>
              <Button 
                onClick={handleUpdateMode} 
                disabled={updatingMode || newMode === selectedStudent?.attendance_mode}
              >
                {updatingMode ? t('system.loading') : t('system.save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Student Import Dialog */}
        <StudentImport
          isOpen={importDialogOpen}
          onClose={() => setImportDialogOpen(false)}
          onSuccess={() => {
            setImportDialogOpen(false);
            fetchStudents();
          }}
          isRTL={isRTL}
        />

        {/* Quick Enrollment Drawer */}
        {quickEnrollStudent && (
          <QuickEnrollmentDrawer
            student={quickEnrollStudent}
            isOpen={quickEnrollOpen}
            onClose={() => {
              setQuickEnrollOpen(false);
              setQuickEnrollStudent(null);
            }}
            onComplete={fetchStudents}
            isArabic={isRTL}
          />
        )}
      </main>
    </div>
  );
}
