import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, GraduationCap, TrendingUp, Award, Download, Upload, FileSpreadsheet, FileText, ChevronLeft, Plus } from 'lucide-react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AssistantPageHeader } from '@/components/assistant/AssistantPageHeader';
import { MobileDataCard } from '@/components/assistant/MobileDataCard';
import { FloatingActionButton } from '@/components/assistant/FloatingActionButton';
import { EmptyState } from '@/components/assistant/EmptyState';
import { SearchFilterBar } from '@/components/assistant/SearchFilterBar';
import { StatusSummaryCard } from '@/components/dashboard/StatusSummaryCard';
import { QuickEnrollmentDrawer } from '@/components/assistant/QuickEnrollmentDrawer';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAssistantFilters, applyStudentFilters, CenterGroup } from '@/hooks/useAssistantFilters';
import { useCenterGroups } from '@/hooks/useCenterGroups';

interface Profile {
  user_id: string;
  short_id: number;
  full_name: string | null;
  phone: string | null;
  grade: string | null;
  academic_year: string | null;
  language_track: string | null;
  governorate: string | null;
  attendance_mode: 'online' | 'center' | 'hybrid' | null;
  created_at: string;
}

interface EnrichedStudent extends Profile {
  avgProgress: number;
  avgExamScore: number;
  totalExams: number;
  enrollmentCount: number;
  center_group_id?: string | null;
}

const getGroupLabel = (grade: string | null, languageTrack: string | null, isArabic: boolean): string | null => {
  if (!grade || !languageTrack) return null;
  
  const yearLabels: Record<string, { ar: string; en: string }> = {
    'second_secondary': { ar: 'تانية ثانوي', en: '2nd Sec' },
    'third_secondary': { ar: 'تالته ثانوي', en: '3rd Sec' },
  };
  
  const trackLabels: Record<string, { ar: string; en: string }> = {
    'arabic': { ar: 'عربي', en: 'AR' },
    'languages': { ar: 'لغات', en: 'Lang' },
  };
  
  const year = yearLabels[grade];
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
  const { groups: centerGroups, loading: groupsLoading } = useCenterGroups();
  
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  
  // Quick Enrollment state
  const [quickEnrollStudent, setQuickEnrollStudent] = useState<EnrichedStudent | null>(null);
  const [quickEnrollOpen, setQuickEnrollOpen] = useState(false);
  
  // Center group member mapping (userId -> groupId)
  const [centerGroupMembers, setCenterGroupMembers] = useState<Map<string, string>>(new Map());
  
  // Unified filters from shared hook
  const {
    searchTerm,
    setSearchTerm,
    hasActiveFilters,
    clearFilters,
    buildFilterConfig,
    filterState,
  } = useAssistantFilters({
    includeCenterGroup: true,
    centerGroups: centerGroups as CenterGroup[],
  });

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

  // Fetch center group members for mapping
  const fetchCenterGroupMembers = useCallback(async () => {
    const { data, error } = await supabase
      .from('center_group_members')
      .select('student_id, group_id')
      .eq('is_active', true);
    
    if (!error && data) {
      const mapping = new Map<string, string>();
      data.forEach(m => mapping.set(m.student_id, m.group_id));
      setCenterGroupMembers(mapping);
    }
  }, []);

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
      fetchCenterGroupMembers();

      // Subscribe to realtime updates for student data
      const channel = supabase
        .channel('students-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'course_enrollments' },
          () => fetchStudents()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'lesson_completions' },
          () => fetchStudents()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'exam_attempts' },
          () => fetchStudents()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles' },
          () => fetchStudents()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'center_group_members' },
          () => fetchCenterGroupMembers()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, roleLoading, canAccessDashboard, fetchStudents, fetchCenterGroupMembers]);

  // Apply unified filters whenever filter state or students change
  useEffect(() => {
    const filtered = applyStudentFilters(students, filterState, centerGroupMembers);
    setFilteredStudents(filtered);
  }, [students, filterState, centerGroupMembers]);

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

  // Stats
  const stats = {
    total: students.length,
    online: students.filter(s => s.attendance_mode === 'online').length,
    center: students.filter(s => s.attendance_mode === 'center').length,
    enrolled: students.filter(s => s.enrollmentCount > 0).length,
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-3.5 h-3.5 rounded-full bg-primary animate-pulse-dot"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-mobile-nav" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      
      <main className="container mx-auto px-3 sm:px-4 py-4 pt-20">
        {/* Mobile-First Header - Clean hierarchy */}
        <AssistantPageHeader
          title={isRTL ? 'إدارة الطلاب' : 'Students'}
          subtitle={`${filteredStudents.length} ${isRTL ? 'طالب' : 'students'}`}
          backHref="/assistant"
          isRTL={isRTL}
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

        {/* Status Summary - Secondary visual weight */}
        <div className="mb-4 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{stats.total}</span>
          <span className="mx-1">{isRTL ? 'طالب' : 'total'}</span>
          <span className="text-muted-foreground/50 mx-1">•</span>
          <span className="text-blue-600 dark:text-blue-400">{stats.online}</span>
          <span className="mx-1">{isRTL ? 'أونلاين' : 'online'}</span>
          <span className="text-muted-foreground/50 mx-1">•</span>
          <span className="text-purple-600 dark:text-purple-400">{stats.center}</span>
          <span className="mx-1">{isRTL ? 'سنتر' : 'center'}</span>
          {stats.enrolled > 0 && (
            <>
              <span className="text-muted-foreground/50 mx-1">•</span>
              <span className="text-green-600 dark:text-green-400">{stats.enrolled}</span>
              <span className="mx-1">{isRTL ? 'مشترك' : 'enrolled'}</span>
            </>
          )}
        </div>

        {/* Search & Filters - Grouped in visual block */}
        <div className="bg-card rounded-xl border border-border p-3 mb-4">
          <SearchFilterBar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder={isRTL ? 'ابحث بالاسم أو الهاتف...' : 'Search by name or phone...'}
            filters={buildFilterConfig(isRTL)}
            onClearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
            isRTL={isRTL}
          />
        </div>

        {/* Students List - Mobile Cards */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="flex items-center gap-2">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-3 h-3 rounded-full bg-primary animate-pulse-dot"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <EmptyState
            icon={User}
            title={isRTL ? 'لا يوجد طلاب' : 'No students found'}
            description={searchTerm || hasActiveFilters 
              ? (isRTL ? 'جرب تعديل البحث أو الفلاتر' : 'Try adjusting your search or filters')
              : (isRTL ? 'لم يتم تسجيل أي طالب حتى الآن' : 'No students have registered yet')}
            hint={!searchTerm && !hasActiveFilters 
              ? (isRTL ? 'الطلاب الجدد سيظهرون هنا تلقائياً' : 'New students will appear here automatically')
              : undefined}
            actionLabel={hasActiveFilters ? (isRTL ? 'مسح الفلاتر' : 'Clear Filters') : undefined}
            onAction={hasActiveFilters ? clearFilters : undefined}
          />
        ) : (
          <div className="space-y-2">
            {filteredStudents.map((student) => {
              const groupLabel = getGroupLabel(student.grade || student.academic_year, student.language_track, isRTL);
              // Attendance mode label - tertiary, informational only
              const modeLabel = student.attendance_mode === 'center' 
                ? (isRTL ? 'سنتر' : 'Center')
                : student.attendance_mode === 'online'
                ? (isRTL ? 'أونلاين' : 'Online')
                : null;
              
              return (
                <MobileDataCard
                  key={student.user_id}
                  title={student.full_name || (isRTL ? 'بدون اسم' : 'No name')}
                  subtitle={student.phone || undefined}
                  badge={groupLabel || undefined}
                  badgeVariant="default"
                  secondaryBadge={modeLabel || undefined}
                  secondaryBadgeVariant={student.attendance_mode === 'center' ? 'secondary' : 'muted'}
                  icon={User}
                  iconColor="text-primary"
                  iconBgColor="bg-primary/10"
                  metadata={[
                    // Enrollment count - quick insight
                    ...(student.enrollmentCount > 0 ? [{ icon: GraduationCap, label: `${student.enrollmentCount} ${isRTL ? 'كورس' : 'courses'}` }] : []),
                    // Progress indicator
                    ...(student.avgProgress > 0 ? [{ icon: TrendingUp, label: `${student.avgProgress}%` }] : []),
                    // Exam score with color coding
                    ...(student.totalExams > 0 ? [{ icon: Award, label: `${student.avgExamScore}%`, className: getScoreColor(student.avgExamScore) }] : []),
                  ]}
                  onClick={() => navigate(`/assistant/students/${student.short_id}`)}
                  actions={
                    <div className="flex items-center gap-1.5">
                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                              onClick={(e) => openQuickEnroll(student, e)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side={isRTL ? 'right' : 'left'}>
                            <p>{isRTL ? 'إجراءات إضافية' : 'Actions'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground"
                        onClick={() => navigate(`/assistant/students/${student.short_id}`)}
                      >
                        <ChevronLeft className={`h-4 w-4 ${isRTL ? '' : 'rotate-180'}`} />
                      </Button>
                    </div>
                  }
                  isRTL={isRTL}
                />
              );
            })}
          </div>
        )}

        {/* Floating Import Button - Safe positioning */}
        <FloatingActionButton
          icon={Upload}
          onClick={() => setImportDialogOpen(true)}
          label={isRTL ? 'استيراد' : 'Import'}
        />

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
            onComplete={() => {
              fetchStudents();
            }}
            isArabic={isRTL}
          />
        )}
      </main>
    </div>
  );
}
