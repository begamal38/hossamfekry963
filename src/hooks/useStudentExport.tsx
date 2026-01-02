import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import * as XLSX from 'xlsx';

interface StudentAnalytics {
  user_id: string;
  full_name: string;
  phone: string;
  email: string;
  academic_year: string;
  language_track: string;
  attendance_mode: string;
  governorate: string;
  created_at: string;
  total_enrollments: number;
  active_courses: number;
  total_lessons_completed: number;
  avg_lesson_completion_rate: number;
  last_lesson_date: string | null;
  days_since_last_activity: number | null;
  total_exams_taken: number;
  avg_exam_score: number;
  highest_exam_score: number;
  lowest_exam_score: number;
  exams_passed: number;
  exams_failed: number;
  pass_rate: number;
  center_sessions_attended: number;
  center_attendance_rate: number;
  performance_level: string;
  risk_reason: string | null;
  engagement_score: number;
}

interface ExportData {
  overview: StudentAnalytics[];
  atRisk: StudentAnalytics[];
  topPerformers: StudentAnalytics[];
}

interface ExportSummary {
  total: number;
  atRisk: number;
  topPerformers: number;
  inactive: number;
  avgEngagement: number;
  avgExamScore: number;
}

type ExportFormat = 'xlsx' | 'csv';

const HEADERS_AR = {
  full_name: 'الاسم',
  phone: 'رقم الهاتف',
  email: 'البريد الإلكتروني',
  academic_year: 'الصف الدراسي',
  language_track: 'المسار',
  attendance_mode: 'نوع الحضور',
  governorate: 'المحافظة',
  created_at: 'تاريخ التسجيل',
  total_enrollments: 'عدد الاشتراكات',
  active_courses: 'الكورسات النشطة',
  total_lessons_completed: 'الحصص المكتملة',
  avg_lesson_completion_rate: 'نسبة إكمال الحصص %',
  last_lesson_date: 'آخر حصة',
  days_since_last_activity: 'أيام بدون نشاط',
  total_exams_taken: 'عدد الامتحانات',
  avg_exam_score: 'متوسط الدرجات %',
  highest_exam_score: 'أعلى درجة %',
  lowest_exam_score: 'أقل درجة %',
  exams_passed: 'امتحانات ناجحة',
  exams_failed: 'امتحانات راسبة',
  pass_rate: 'نسبة النجاح %',
  center_sessions_attended: 'حضور السنتر',
  center_attendance_rate: 'نسبة حضور السنتر %',
  performance_level: 'مستوى الأداء',
  risk_reason: 'سبب المتابعة',
  engagement_score: 'درجة التفاعل',
};

const HEADERS_EN = {
  full_name: 'Name',
  phone: 'Phone',
  email: 'Email',
  academic_year: 'Academic Year',
  language_track: 'Language Track',
  attendance_mode: 'Attendance Mode',
  governorate: 'Governorate',
  created_at: 'Registration Date',
  total_enrollments: 'Total Enrollments',
  active_courses: 'Active Courses',
  total_lessons_completed: 'Lessons Completed',
  avg_lesson_completion_rate: 'Lesson Completion %',
  last_lesson_date: 'Last Lesson Date',
  days_since_last_activity: 'Days Inactive',
  total_exams_taken: 'Exams Taken',
  avg_exam_score: 'Avg Exam Score %',
  highest_exam_score: 'Highest Score %',
  lowest_exam_score: 'Lowest Score %',
  exams_passed: 'Exams Passed',
  exams_failed: 'Exams Failed',
  pass_rate: 'Pass Rate %',
  center_sessions_attended: 'Center Sessions',
  center_attendance_rate: 'Center Attendance %',
  performance_level: 'Performance Level',
  risk_reason: 'Risk Reason',
  engagement_score: 'Engagement Score',
};

export function useStudentExport() {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const { toast } = useToast();
  const { isRTL } = useLanguage();

  const headers = isRTL ? HEADERS_AR : HEADERS_EN;

  const transformToRows = (students: StudentAnalytics[]) => {
    return students.map(student => ({
      [headers.full_name]: student.full_name || '',
      [headers.phone]: student.phone || '',
      [headers.email]: student.email || '',
      [headers.academic_year]: student.academic_year || '',
      [headers.language_track]: student.language_track || '',
      [headers.attendance_mode]: student.attendance_mode || '',
      [headers.governorate]: student.governorate || '',
      [headers.created_at]: student.created_at || '',
      [headers.total_enrollments]: student.total_enrollments,
      [headers.active_courses]: student.active_courses,
      [headers.total_lessons_completed]: student.total_lessons_completed,
      [headers.avg_lesson_completion_rate]: student.avg_lesson_completion_rate,
      [headers.last_lesson_date]: student.last_lesson_date || '',
      [headers.days_since_last_activity]: student.days_since_last_activity ?? '',
      [headers.total_exams_taken]: student.total_exams_taken,
      [headers.avg_exam_score]: student.avg_exam_score,
      [headers.highest_exam_score]: student.highest_exam_score,
      [headers.lowest_exam_score]: student.lowest_exam_score,
      [headers.exams_passed]: student.exams_passed,
      [headers.exams_failed]: student.exams_failed,
      [headers.pass_rate]: student.pass_rate,
      [headers.center_sessions_attended]: student.center_sessions_attended,
      [headers.center_attendance_rate]: student.center_attendance_rate,
      [headers.performance_level]: student.performance_level,
      [headers.risk_reason]: student.risk_reason || '',
      [headers.engagement_score]: student.engagement_score,
    }));
  };

  const createSummarySheet = (summary: ExportSummary) => {
    const labels = isRTL
      ? {
          total: 'إجمالي الطلاب',
          atRisk: 'طلاب يحتاجون متابعة',
          topPerformers: 'طلاب متميزين',
          inactive: 'طلاب غير نشطين',
          avgEngagement: 'متوسط التفاعل',
          avgExamScore: 'متوسط الدرجات',
        }
      : {
          total: 'Total Students',
          atRisk: 'At-Risk Students',
          topPerformers: 'Top Performers',
          inactive: 'Inactive Students',
          avgEngagement: 'Avg Engagement',
          avgExamScore: 'Avg Exam Score',
        };

    return [
      { [isRTL ? 'المؤشر' : 'Metric']: labels.total, [isRTL ? 'القيمة' : 'Value']: summary.total },
      { [isRTL ? 'المؤشر' : 'Metric']: labels.atRisk, [isRTL ? 'القيمة' : 'Value']: summary.atRisk },
      { [isRTL ? 'المؤشر' : 'Metric']: labels.topPerformers, [isRTL ? 'القيمة' : 'Value']: summary.topPerformers },
      { [isRTL ? 'المؤشر' : 'Metric']: labels.inactive, [isRTL ? 'القيمة' : 'Value']: summary.inactive },
      { [isRTL ? 'المؤشر' : 'Metric']: labels.avgEngagement, [isRTL ? 'القيمة' : 'Value']: `${summary.avgEngagement}%` },
      { [isRTL ? 'المؤشر' : 'Metric']: labels.avgExamScore, [isRTL ? 'القيمة' : 'Value']: `${summary.avgExamScore}%` },
    ];
  };

  const exportToExcel = (data: ExportData, summary: ExportSummary) => {
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summarySheet = XLSX.utils.json_to_sheet(createSummarySheet(summary));
    XLSX.utils.book_append_sheet(wb, summarySheet, isRTL ? 'ملخص' : 'Summary');

    // Overview sheet
    const overviewData = transformToRows(data.overview);
    const overviewSheet = XLSX.utils.json_to_sheet(overviewData.length > 0 ? overviewData : [{}]);
    XLSX.utils.book_append_sheet(wb, overviewSheet, isRTL ? 'جميع الطلاب' : 'All Students');

    // At-Risk sheet
    const atRiskData = transformToRows(data.atRisk);
    const atRiskSheet = XLSX.utils.json_to_sheet(atRiskData.length > 0 ? atRiskData : [{}]);
    XLSX.utils.book_append_sheet(wb, atRiskSheet, isRTL ? 'يحتاجون متابعة' : 'At-Risk');

    // Top Performers sheet
    const topData = transformToRows(data.topPerformers);
    const topSheet = XLSX.utils.json_to_sheet(topData.length > 0 ? topData : [{}]);
    XLSX.utils.book_append_sheet(wb, topSheet, isRTL ? 'متميزين' : 'Top Performers');

    // Generate file
    const fileName = `students_analytics_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const exportToCSV = (data: ExportData, summary: ExportSummary) => {
    const wb = XLSX.utils.book_new();

    // Create combined sheet for CSV
    const allData = [
      ...createSummarySheet(summary),
      {}, // Empty row
      { [isRTL ? 'المؤشر' : 'Metric']: isRTL ? '--- جميع الطلاب ---' : '--- All Students ---' },
      ...transformToRows(data.overview),
    ];

    const sheet = XLSX.utils.json_to_sheet(allData);
    XLSX.utils.book_append_sheet(wb, sheet, 'Data');

    const fileName = `students_analytics_${new Date().toISOString().split('T')[0]}.csv`;
    XLSX.writeFile(wb, fileName, { bookType: 'csv' });
  };

  const exportStudents = async (format: ExportFormat = 'xlsx') => {
    setExporting(true);
    setProgress(isRTL ? 'جاري جلب البيانات...' : 'Fetching data...');

    try {
      const { data, error } = await supabase.functions.invoke('export-students-analytics');

      if (error) {
        let errorMessage = isRTL ? 'حدث خطأ أثناء التصدير' : 'Export error occurred';
        let errorTitle = isRTL ? 'خطأ في التصدير' : 'Export Error';

        try {
          const errorData = typeof error.message === 'string' ? JSON.parse(error.message) : error;
          if (errorData.error === 'PERMISSION_DENIED') {
            errorTitle = isRTL ? 'صلاحيات غير كافية' : 'Permission Denied';
            errorMessage = errorData.message || errorMessage;
          } else if (errorData.error === 'NO_AUTH' || errorData.error === 'AUTH_FAILED') {
            errorTitle = isRTL ? 'يجب تسجيل الدخول' : 'Authentication Required';
            errorMessage = errorData.message || errorMessage;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // Use default message
        }

        toast({
          variant: 'destructive',
          title: errorTitle,
          description: errorMessage,
        });
        return;
      }

      if (!data || !data.success) {
        toast({
          variant: 'destructive',
          title: isRTL ? 'خطأ في البيانات' : 'Data Error',
          description: isRTL ? 'لم يتم استلام بيانات صحيحة' : 'Invalid data received',
        });
        return;
      }

      setProgress(isRTL ? 'جاري إنشاء الملف...' : 'Generating file...');

      const exportData: ExportData = data.data;
      const summary: ExportSummary = data.summary;

      if (format === 'xlsx') {
        exportToExcel(exportData, summary);
      } else {
        exportToCSV(exportData, summary);
      }

      toast({
        title: isRTL ? 'تم التصدير بنجاح' : 'Export Successful',
        description: isRTL
          ? `تم تصدير بيانات ${summary.total} طالب`
          : `Exported data for ${summary.total} students`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        variant: 'destructive',
        title: isRTL ? 'خطأ غير متوقع' : 'Unexpected Error',
        description: isRTL ? 'حدث خطأ أثناء التصدير' : 'An error occurred during export',
      });
    } finally {
      setExporting(false);
      setProgress(null);
    }
  };

  return {
    exportStudents,
    exporting,
    progress,
  };
}
