import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserRole } from '@/hooks/useUserRole';
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

// Error codes for structured error handling
export type ExportErrorCode = 
  | 'NO_DATA'
  | 'NO_PERMISSION'
  | 'NO_AUTH'
  | 'AUTH_FAILED'
  | 'EXPORT_FAILED'
  | 'DATA_FETCH_ERROR'
  | 'CONFIG_ERROR'
  | 'SERVER_ERROR'
  | 'PERMISSION_DENIED'
  | 'PERMISSION_CHECK_FAILED'
  | 'UNKNOWN';

// i18n error messages
const ERROR_MESSAGES: Record<ExportErrorCode, { ar: string; en: string }> = {
  NO_DATA: {
    ar: 'لا يوجد طلاب للتصدير',
    en: 'No students available to export',
  },
  NO_PERMISSION: {
    ar: 'ليس لديك صلاحية التصدير',
    en: 'You do not have permission to export',
  },
  NO_AUTH: {
    ar: 'يجب تسجيل الدخول للتصدير',
    en: 'You must log in to export',
  },
  AUTH_FAILED: {
    ar: 'فشل التحقق من الهوية',
    en: 'Authentication verification failed',
  },
  EXPORT_FAILED: {
    ar: 'فشل التصدير. يرجى المحاولة مرة أخرى',
    en: 'Export failed. Please try again',
  },
  DATA_FETCH_ERROR: {
    ar: 'فشل جلب بيانات الطلاب',
    en: 'Failed to fetch student data',
  },
  CONFIG_ERROR: {
    ar: 'خطأ في إعدادات الخادم',
    en: 'Server configuration error',
  },
  SERVER_ERROR: {
    ar: 'حدث خطأ في الخادم أثناء التصدير',
    en: 'Server error during export',
  },
  PERMISSION_DENIED: {
    ar: 'ليس لديك صلاحية التصدير',
    en: 'You do not have permission to export',
  },
  PERMISSION_CHECK_FAILED: {
    ar: 'فشل التحقق من الصلاحيات',
    en: 'Permission check failed',
  },
  UNKNOWN: {
    ar: 'حدث خطأ غير متوقع',
    en: 'An unexpected error occurred',
  },
};

const ERROR_TITLES: Record<ExportErrorCode, { ar: string; en: string }> = {
  NO_DATA: { ar: 'لا توجد بيانات', en: 'No Data' },
  NO_PERMISSION: { ar: 'صلاحيات غير كافية', en: 'Insufficient Permissions' },
  NO_AUTH: { ar: 'يجب تسجيل الدخول', en: 'Login Required' },
  AUTH_FAILED: { ar: 'فشل التحقق', en: 'Verification Failed' },
  EXPORT_FAILED: { ar: 'فشل التصدير', en: 'Export Failed' },
  DATA_FETCH_ERROR: { ar: 'مشكلة في البيانات', en: 'Data Error' },
  CONFIG_ERROR: { ar: 'خطأ في الإعدادات', en: 'Configuration Error' },
  SERVER_ERROR: { ar: 'خطأ في الخادم', en: 'Server Error' },
  PERMISSION_DENIED: { ar: 'صلاحيات غير كافية', en: 'Insufficient Permissions' },
  PERMISSION_CHECK_FAILED: { ar: 'خطأ في الصلاحيات', en: 'Permission Error' },
  UNKNOWN: { ar: 'خطأ غير متوقع', en: 'Unexpected Error' },
};

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

type ParsedExportError = {
  status?: number;
  code?: ExportErrorCode;
  message?: string;
  details?: string;
};

function parseInvokeError(err: unknown): ParsedExportError {
  const anyErr = err as Record<string, unknown>;
  const context = anyErr?.context as Record<string, unknown> | undefined;
  const status: number | undefined = (context?.status as number) ?? (anyErr?.status as number);
  const body = context?.body;

  let parsed: Record<string, unknown> | null = null;

  // Try to parse body from context
  if (body) {
    if (typeof body === 'string') {
      try {
        parsed = JSON.parse(body);
      } catch {
        // ignore
      }
    } else if (typeof body === 'object') {
      parsed = body as Record<string, unknown>;
    }
  }

  // Try to extract error from message
  if (!parsed && typeof anyErr?.message === 'string') {
    const match = anyErr.message.match(/\{[\s\S]*\}/);
    if (match?.[0]) {
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        // ignore
      }
    }
  }

  // Map error codes
  let code: ExportErrorCode = 'UNKNOWN';
  const rawCode = parsed?.error as string | undefined;
  
  if (rawCode) {
    // Map known error codes
    const codeMap: Record<string, ExportErrorCode> = {
      'NO_AUTH': 'NO_AUTH',
      'AUTH_FAILED': 'AUTH_FAILED',
      'PERMISSION_DENIED': 'NO_PERMISSION',
      'PERMISSION_CHECK_FAILED': 'PERMISSION_CHECK_FAILED',
      'DATA_FETCH_ERROR': 'DATA_FETCH_ERROR',
      'CONFIG_ERROR': 'CONFIG_ERROR',
      'SERVER_ERROR': 'SERVER_ERROR',
    };
    code = codeMap[rawCode] || 'UNKNOWN';
  } else if (status === 403) {
    code = 'NO_PERMISSION';
  } else if (status === 401) {
    code = 'NO_AUTH';
  } else if (status === 404) {
    code = 'EXPORT_FAILED';
  } else if (status && status >= 500) {
    code = 'SERVER_ERROR';
  }

  return {
    status,
    code,
    message: parsed?.message as string | undefined,
    details: parsed?.details as string | undefined,
  };
}

export function useStudentExport() {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const { toast } = useToast();
  const { isRTL } = useLanguage();
  const { canAccessDashboard, loading: roleLoading } = useUserRole();

  // Check if user has export permission
  const canExport = useCallback(() => {
    return !roleLoading && canAccessDashboard();
  }, [roleLoading, canAccessDashboard]);

  // Arabic-first (UI must not show English)
  const headers = HEADERS_AR;

  const getErrorMessage = useCallback((code: ExportErrorCode): { title: string; description: string } => {
    const messages = ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN;
    const titles = ERROR_TITLES[code] || ERROR_TITLES.UNKNOWN;
    return {
      title: isRTL ? titles.ar : titles.en,
      description: isRTL ? messages.ar : messages.en,
    };
  }, [isRTL]);

  const emptyStudentRow = () => ({
    [headers.full_name]: '',
    [headers.phone]: '',
    [headers.email]: '',
    [headers.academic_year]: '',
    [headers.language_track]: '',
    [headers.attendance_mode]: '',
    [headers.governorate]: '',
    [headers.created_at]: '',
    [headers.total_enrollments]: '',
    [headers.active_courses]: '',
    [headers.total_lessons_completed]: '',
    [headers.avg_lesson_completion_rate]: '',
    [headers.last_lesson_date]: '',
    [headers.days_since_last_activity]: '',
    [headers.total_exams_taken]: '',
    [headers.avg_exam_score]: '',
    [headers.highest_exam_score]: '',
    [headers.lowest_exam_score]: '',
    [headers.exams_passed]: '',
    [headers.exams_failed]: '',
    [headers.pass_rate]: '',
    [headers.center_sessions_attended]: '',
    [headers.center_attendance_rate]: '',
    [headers.performance_level]: '',
    [headers.risk_reason]: '',
    [headers.engagement_score]: '',
  });

  const transformToRows = (students: StudentAnalytics[]) => {
    return students.map((student) => ({
      [headers.full_name]: student.full_name || '',
      [headers.phone]: student.phone || '',
      [headers.email]: student.email || '',
      [headers.academic_year]: student.academic_year || '',
      [headers.language_track]: student.language_track || '',
      [headers.attendance_mode]: student.attendance_mode || '',
      [headers.governorate]: student.governorate || '',
      [headers.created_at]: student.created_at || '',
      [headers.total_enrollments]: student.total_enrollments ?? 0,
      [headers.active_courses]: student.active_courses ?? 0,
      [headers.total_lessons_completed]: student.total_lessons_completed ?? 0,
      [headers.avg_lesson_completion_rate]: student.avg_lesson_completion_rate ?? 0,
      [headers.last_lesson_date]: student.last_lesson_date || '',
      [headers.days_since_last_activity]: student.days_since_last_activity ?? '',
      [headers.total_exams_taken]: student.total_exams_taken ?? 0,
      [headers.avg_exam_score]: student.avg_exam_score ?? 0,
      [headers.highest_exam_score]: student.highest_exam_score ?? 0,
      [headers.lowest_exam_score]: student.lowest_exam_score ?? 0,
      [headers.exams_passed]: student.exams_passed ?? 0,
      [headers.exams_failed]: student.exams_failed ?? 0,
      [headers.pass_rate]: student.pass_rate ?? 0,
      [headers.center_sessions_attended]: student.center_sessions_attended ?? 0,
      [headers.center_attendance_rate]: student.center_attendance_rate ?? 0,
      [headers.performance_level]: student.performance_level || '',
      [headers.risk_reason]: student.risk_reason || '',
      [headers.engagement_score]: student.engagement_score ?? 0,
    }));
  };

  const createSummarySheet = (summary: ExportSummary) => {
    const labels = {
      total: 'إجمالي الطلاب',
      atRisk: 'طلاب يحتاجون متابعة',
      topPerformers: 'طلاب متميزين',
      inactive: 'طلاب غير نشطين',
      avgEngagement: 'متوسط التفاعل',
      avgExamScore: 'متوسط الدرجات',
    };

    return [
      { ['المؤشر']: labels.total, ['القيمة']: summary.total },
      { ['المؤشر']: labels.atRisk, ['القيمة']: summary.atRisk },
      { ['المؤشر']: labels.topPerformers, ['القيمة']: summary.topPerformers },
      { ['المؤشر']: labels.inactive, ['القيمة']: summary.inactive },
      { ['المؤشر']: labels.avgEngagement, ['القيمة']: `${summary.avgEngagement}%` },
      { ['المؤشر']: labels.avgExamScore, ['القيمة']: `${summary.avgExamScore}%` },
    ];
  };

  const exportToExcel = (data: ExportData, summary: ExportSummary) => {
    const wb = XLSX.utils.book_new();

    const summarySheet = XLSX.utils.json_to_sheet(createSummarySheet(summary));
    XLSX.utils.book_append_sheet(wb, summarySheet, 'ملخص');

    const overviewRows = transformToRows(data.overview);
    const overviewSheet = XLSX.utils.json_to_sheet(overviewRows.length > 0 ? overviewRows : [emptyStudentRow()]);
    XLSX.utils.book_append_sheet(wb, overviewSheet, 'جميع الطلاب');

    const atRiskRows = transformToRows(data.atRisk);
    const atRiskSheet = XLSX.utils.json_to_sheet(atRiskRows.length > 0 ? atRiskRows : [emptyStudentRow()]);
    XLSX.utils.book_append_sheet(wb, atRiskSheet, 'يحتاجون متابعة');

    const topRows = transformToRows(data.topPerformers);
    const topSheet = XLSX.utils.json_to_sheet(topRows.length > 0 ? topRows : [emptyStudentRow()]);
    XLSX.utils.book_append_sheet(wb, topSheet, 'متميزين');

    const fileName = `students_analytics_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const exportToCSV = (data: ExportData, summary: ExportSummary) => {
    const wb = XLSX.utils.book_new();

    const overviewRows = transformToRows(data.overview);

    const allData = [
      ...createSummarySheet(summary),
      {},
      { ['المؤشر']: '--- جميع الطلاب ---' },
      ...(overviewRows.length > 0 ? overviewRows : [emptyStudentRow()]),
    ];

    const sheet = XLSX.utils.json_to_sheet(allData);
    XLSX.utils.book_append_sheet(wb, sheet, 'Data');

    const fileName = `students_analytics_${new Date().toISOString().split('T')[0]}.csv`;
    XLSX.writeFile(wb, fileName, { bookType: 'csv' });
  };

  const exportStudents = async (format: ExportFormat = 'xlsx') => {
    // Pre-check permissions before making API call
    if (!canExport()) {
      const { title, description } = getErrorMessage('NO_PERMISSION');
      toast({
        variant: 'destructive',
        title,
        description,
      });
      return;
    }

    setExporting(true);
    setProgress(isRTL ? 'جاري تجهيز التصدير...' : 'Preparing export...');

    try {
      const { data, error } = await supabase.functions.invoke('export-students-analytics');

      if (error) {
        console.error('Export invoke error:', error);
        const parsed = parseInvokeError(error);
        const { title, description } = getErrorMessage(parsed.code || 'EXPORT_FAILED');

        toast({
          variant: 'destructive',
          title,
          description,
        });
        return;
      }

      if (!data || !data.success) {
        const { title, description } = getErrorMessage('EXPORT_FAILED');
        toast({
          variant: 'destructive',
          title,
          description,
        });
        return;
      }

      // Check for NO_DATA case
      const exportData: ExportData = data.data;
      const summary: ExportSummary = data.summary;

      if (summary.total === 0) {
        const { title, description } = getErrorMessage('NO_DATA');
        toast({
          variant: 'destructive',
          title,
          description,
        });
        return;
      }

      setProgress(isRTL ? 'جاري إنشاء الملف...' : 'Creating file...');

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
    } catch (err) {
      console.error('Export error:', err);
      const { title, description } = getErrorMessage('UNKNOWN');
      toast({
        variant: 'destructive',
        title,
        description,
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
    canExport,
    roleLoading,
  };
}
