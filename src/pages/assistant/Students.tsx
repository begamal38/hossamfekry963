import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, GraduationCap, ArrowLeft, TrendingUp, Award, Download, Upload, Wifi, Building2, Shuffle, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { StudentFilters } from '@/components/assistant/StudentFilters';
import { StudentImport } from '@/components/assistant/StudentImport';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { EGYPTIAN_GOVERNORATES, getGovernorateLabel } from '@/constants/governorates';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Database } from '@/integrations/supabase/types';

type AttendanceMode = Database['public']['Enums']['attendance_mode'];

interface Profile {
  user_id: string;
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

// Helper to get group label
const getGroupLabel = (academicYear: string | null, languageTrack: string | null, isArabic: boolean): string | null => {
  if (!academicYear || !languageTrack) return null;
  
  const yearLabels: Record<string, { ar: string; en: string }> = {
    'second_secondary': { ar: 'الثاني الثانوي', en: 'Second Secondary' },
    'third_secondary': { ar: 'الثالث الثانوي', en: 'Third Secondary' },
  };
  
  const trackLabels: Record<string, { ar: string; en: string }> = {
    'arabic': { ar: 'عربي', en: 'Arabic' },
    'languages': { ar: 'لغات', en: 'Languages' },
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
  const [exporting, setExporting] = useState(false);
  
  // Attendance mode dialog state
  const [modeDialogOpen, setModeDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<EnrichedStudent | null>(null);
  const [newMode, setNewMode] = useState<AttendanceMode>('online');
  const [updatingMode, setUpdatingMode] = useState(false);
  
  // Import dialog state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [academicYearFilter, setAcademicYearFilter] = useState('all');
  const [languageTrackFilter, setLanguageTrackFilter] = useState('all');
  const [progressFilter, setProgressFilter] = useState('all');
  const [examFilter, setExamFilter] = useState('all');
  const [attendanceModeFilter, setAttendanceModeFilter] = useState('all');
  const [governorateFilter, setGovernorateFilter] = useState('all');

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

  const fetchStudents = async () => {
    if (!user || !canAccessDashboard()) return;

    try {
      // First, get all user_ids that have the 'student' role
      const { data: studentRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'student');

      if (rolesError) throw rolesError;

      const studentUserIds = (studentRoles || []).map(r => r.user_id);

      // If no students, return empty
      if (studentUserIds.length === 0) {
        setStudents([]);
        setFilteredStudents([]);
        setLoading(false);
        return;
      }

      // Fetch profiles only for users with student role (exclude current user)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone, grade, academic_year, language_track, governorate, attendance_mode, created_at')
        .in('user_id', studentUserIds)
        .neq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all enrollments for progress data
      const { data: enrollmentsData } = await supabase
        .from('course_enrollments')
        .select('user_id, progress');

      // Fetch all exam results
      const { data: examResultsData } = await supabase
        .from('exam_results')
        .select('user_id, score, exams:exam_id(max_score)');

      // Enrich students with progress and exam data
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
  };

  useEffect(() => {
    if (!roleLoading && canAccessDashboard()) {
      fetchStudents();
    }
  }, [user, roleLoading, canAccessDashboard]);

  useEffect(() => {
    let filtered = students;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.phone?.includes(searchTerm)
      );
    }

    // Academic year filter
    if (academicYearFilter !== 'all') {
      filtered = filtered.filter((s) => s.academic_year === academicYearFilter);
    }

    // Language track filter
    if (languageTrackFilter !== 'all') {
      filtered = filtered.filter((s) => s.language_track === languageTrackFilter);
    }

    // Progress filter
    if (progressFilter !== 'all') {
      filtered = filtered.filter((s) => {
        switch (progressFilter) {
          case 'high': return s.avgProgress >= 70;
          case 'medium': return s.avgProgress >= 30 && s.avgProgress < 70;
          case 'low': return s.avgProgress < 30;
          default: return true;
        }
      });
    }

    // Exam filter
    if (examFilter !== 'all') {
      filtered = filtered.filter((s) => {
        switch (examFilter) {
          case 'excellent': return s.avgExamScore >= 85;
          case 'good': return s.avgExamScore >= 70 && s.avgExamScore < 85;
          case 'average': return s.avgExamScore >= 50 && s.avgExamScore < 70;
          case 'weak': return s.avgExamScore < 50 && s.totalExams > 0;
          case 'no_exams': return s.totalExams === 0;
          default: return true;
        }
      });
    }

    // Attendance mode filter
    if (attendanceModeFilter !== 'all') {
      filtered = filtered.filter((s) => s.attendance_mode === attendanceModeFilter);
    }

    // Governorate filter
    if (governorateFilter !== 'all') {
      filtered = filtered.filter((s) => s.governorate === governorateFilter);
    }

    setFilteredStudents(filtered);
  }, [searchTerm, academicYearFilter, languageTrackFilter, progressFilter, examFilter, attendanceModeFilter, governorateFilter, students]);

  const clearFilters = () => {
    setSearchTerm('');
    setAcademicYearFilter('all');
    setLanguageTrackFilter('all');
    setProgressFilter('all');
    setExamFilter('all');
    setAttendanceModeFilter('all');
    setGovernorateFilter('all');
  };

  // Handle opening the mode change dialog
  const openModeDialog = (student: EnrichedStudent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedStudent(student);
    setNewMode(student.attendance_mode);
    setModeDialogOpen(true);
  };

  // Handle updating attendance mode
  const handleUpdateMode = async () => {
    if (!selectedStudent) return;
    
    setUpdatingMode(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ attendance_mode: newMode })
        .eq('user_id', selectedStudent.user_id);

      if (error) throw error;

      // Update local state
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

  // Get mode icon
  const getModeIcon = (mode: AttendanceMode) => {
    switch (mode) {
      case 'online': return <Wifi className="h-3 w-3" />;
      case 'center': return <Building2 className="h-3 w-3" />;
      case 'hybrid': return <Shuffle className="h-3 w-3" />;
    }
  };

  // Get mode color
  const getModeVariant = (mode: AttendanceMode): "default" | "secondary" | "outline" => {
    switch (mode) {
      case 'online': return 'secondary';
      case 'center': return 'default';
      case 'hybrid': return 'outline';
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('export-students');
      
      if (error) throw error;

      // Create blob and download
      const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: isRTL ? 'تم التصدير بنجاح' : 'Export Successful',
        description: isRTL ? 'تم تحميل ملف بيانات الطلاب' : 'Students data file downloaded',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        variant: 'destructive',
        title: isRTL ? 'خطأ في التصدير' : 'Export Error',
        description: isRTL ? 'حدث خطأ أثناء تصدير البيانات' : 'An error occurred while exporting data',
      });
    } finally {
      setExporting(false);
    }
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/assistant')}>
              <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {isRTL ? 'إدارة الطلاب' : 'Student Management'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {isRTL ? `${filteredStudents.length} طالب` : `${filteredStudents.length} students`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button 
              variant="outline" 
              onClick={() => setImportDialogOpen(true)}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              {isRTL ? 'استيراد طلاب' : 'Import Students'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExport} 
              disabled={exporting}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {exporting 
                ? (isRTL ? 'جاري التصدير...' : 'Exporting...') 
                : (isRTL ? 'تصدير البيانات' : 'Export Data')}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <StudentFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          academicYearFilter={academicYearFilter}
          onAcademicYearFilterChange={setAcademicYearFilter}
          languageTrackFilter={languageTrackFilter}
          onLanguageTrackFilterChange={setLanguageTrackFilter}
          progressFilter={progressFilter}
          onProgressFilterChange={setProgressFilter}
          examFilter={examFilter}
          onExamFilterChange={setExamFilter}
          attendanceModeFilter={attendanceModeFilter}
          onAttendanceModeFilterChange={setAttendanceModeFilter}
          governorateFilter={governorateFilter}
          onGovernorateFilterChange={setGovernorateFilter}
          isRTL={isRTL}
          onClearFilters={clearFilters}
        />

        {/* Students List */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {isRTL ? 'لا يوجد طلاب' : 'No students found'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-4 text-start text-sm font-medium text-muted-foreground">
                      {isRTL ? 'الطالب' : 'Student'}
                    </th>
                    <th className="px-6 py-4 text-start text-sm font-medium text-muted-foreground">
                      {isRTL ? 'الهاتف' : 'Phone'}
                    </th>
                    <th className="px-6 py-4 text-start text-sm font-medium text-muted-foreground">
                      {isRTL ? 'المجموعة' : 'Group'}
                    </th>
                    <th className="px-6 py-4 text-start text-sm font-medium text-muted-foreground">
                      {t('attendance.mode')}
                    </th>
                    <th className="px-6 py-4 text-start text-sm font-medium text-muted-foreground hidden md:table-cell">
                      {isRTL ? 'التقدم' : 'Progress'}
                    </th>
                    <th className="px-6 py-4 text-start text-sm font-medium text-muted-foreground hidden lg:table-cell">
                      {isRTL ? 'الامتحانات' : 'Exams'}
                    </th>
                    <th className="px-6 py-4 text-start text-sm font-medium text-muted-foreground">
                      {isRTL ? 'الإجراءات' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredStudents.map((student) => {
                    const groupLabel = getGroupLabel(student.academic_year, student.language_track, isRTL);
                    
                    const getScoreColor = (score: number) => {
                      if (score >= 85) return 'text-green-600';
                      if (score >= 70) return 'text-blue-600';
                      if (score >= 50) return 'text-yellow-600';
                      return 'text-red-600';
                    };
                    
                    return (
                      <tr 
                        key={student.user_id} 
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => navigate(`/assistant/students/${student.user_id}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <span className="font-medium text-foreground">
                              {student.full_name || (isRTL ? 'بدون اسم' : 'No name')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span dir="ltr">{student.phone || '-'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {groupLabel ? (
                            <Badge variant="secondary" className="font-normal">
                              <GraduationCap className="h-3 w-3 me-1" />
                              {groupLabel}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Badge 
                            variant={getModeVariant(student.attendance_mode)}
                            className="cursor-pointer hover:opacity-80 transition-opacity gap-1"
                            onClick={(e) => openModeDialog(student, e)}
                          >
                            {getModeIcon(student.attendance_mode)}
                            {t(`mode.${student.attendance_mode}`)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <Progress value={student.avgProgress} className="w-16 h-2" />
                            <span className="text-sm text-muted-foreground">{student.avgProgress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          {student.totalExams > 0 ? (
                            <div className="flex items-center gap-2">
                              <Award className={`h-4 w-4 ${getScoreColor(student.avgExamScore)}`} />
                              <span className={`font-medium ${getScoreColor(student.avgExamScore)}`}>
                                {student.avgExamScore}%
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({student.totalExams} {isRTL ? 'امتحان' : 'exams'})
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              {isRTL ? 'لا توجد امتحانات' : 'No exams'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/assistant/students/${student.user_id}`);
                            }}
                          >
                            {isRTL ? 'عرض التفاصيل' : 'View Details'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Attendance Mode Change Dialog */}
        <Dialog open={modeDialogOpen} onOpenChange={setModeDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('mode.change')}</DialogTitle>
              <DialogDescription>
                {selectedStudent?.full_name || (isRTL ? 'الطالب' : 'Student')}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                {t('mode.changeNote')}
              </p>
              
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
      </main>
    </div>
  );
}