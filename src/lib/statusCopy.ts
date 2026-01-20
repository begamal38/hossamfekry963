/**
 * Centralized Status Copy Mapping
 * 
 * This is the ONLY place where human-readable text for status codes should exist.
 * All hooks MUST return status codes only, never raw text.
 * UI components consume text through this mapping.
 */

// ═══════════════════════════════════════════════════════════════════════════
// System Status Types & Copy
// ═══════════════════════════════════════════════════════════════════════════

export type SystemStatusLevel = 'critical' | 'danger' | 'warning' | 'success';

export type SystemStatusCode =
  | 'NOT_ACTIVATED'
  | 'NO_STUDENTS_OR_ENROLLMENTS'
  | 'CRITICAL_PASS_RATE'
  | 'HIGH_FAILURE_RATE'
  | 'UNSTABLE_RESULTS'
  | 'NEEDS_EXAM_FOLLOWUP'
  | 'STABLE'
  | 'DATA_LOAD_ERROR';

interface SystemStatusCopy {
  label: { ar: string; en: string };
  description: { ar: string; en: string };
}

export const SYSTEM_STATUS_COPY: Record<SystemStatusCode, SystemStatusCopy> = {
  NOT_ACTIVATED: {
    label: { ar: 'فشل جماعي', en: 'Not Activated' },
    description: { ar: 'السيستم لسه متفتحش فعليًا - مفيش تعلم حصل', en: 'System not yet activated - no learning activity recorded' },
  },
  NO_STUDENTS_OR_ENROLLMENTS: {
    label: { ar: 'فشل جماعي', en: 'Not Activated' },
    description: { ar: 'مفيش طلاب أو اشتراكات نشطة', en: 'No students or active enrollments' },
  },
  CRITICAL_PASS_RATE: {
    label: { ar: 'خطر', en: 'Critical' },
    description: { ar: 'فيه شغل بس النتايج سيئة جداً', en: 'Activity exists but results are very poor' },
  },
  HIGH_FAILURE_RATE: {
    label: { ar: 'خطر', en: 'Critical' },
    description: { ar: 'نسبة الرسوب عالية جداً', en: 'Failure rate is very high' },
  },
  UNSTABLE_RESULTS: {
    label: { ar: 'غير مستقر', en: 'Unstable' },
    description: { ar: 'السيستم شغال بس محتاج ضبط', en: 'System is running but needs adjustment' },
  },
  NEEDS_EXAM_FOLLOWUP: {
    label: { ar: 'غير مستقر', en: 'Unstable' },
    description: { ar: 'فيه تفاعل بس محتاج متابعة الامتحانات', en: 'Engagement exists but exam follow-up is needed' },
  },
  STABLE: {
    label: { ar: 'مستقر', en: 'Stable' },
    description: { ar: 'المنصة شغالة صح والنتايج كويسة', en: 'Platform is functioning well with good results' },
  },
  DATA_LOAD_ERROR: {
    label: { ar: 'فشل جماعي', en: 'Not Activated' },
    description: { ar: 'خطأ في تحميل البيانات', en: 'Error loading data' },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// Student Behavior Types & Copy
// ═══════════════════════════════════════════════════════════════════════════

export type StudentStatusCode = 'NEW' | 'DORMANT' | 'LOYAL' | 'AT_RISK' | 'ACTIVE' | 'UNKNOWN';

interface StudentStatusCopy {
  label: { ar: string; en: string };
  cta: { ar: string; en: string };
}

export const STUDENT_STATUS_COPY: Record<StudentStatusCode, StudentStatusCopy> = {
  NEW: {
    label: { ar: 'طالب جديد', en: 'New Student' },
    cta: { ar: 'ابدأ أول حصة واكتشف المنصة', en: 'Start your first lesson and explore' },
  },
  DORMANT: {
    label: { ar: 'غير نشط', en: 'Inactive' },
    cta: { ar: 'عدنا نستناك! ارجع كمّل من حيث وقفت', en: 'We miss you! Continue where you left off' },
  },
  LOYAL: {
    label: { ar: 'طالب مثالي', en: 'Star Student' },
    cta: { ar: 'استمر على الوتيرة الممتازة! 🌟', en: 'Keep up the excellent pace! 🌟' },
  },
  AT_RISK: {
    label: { ar: 'محتاج متابعة', en: 'Needs Attention' },
    cta: { ar: 'رجعتلك! كمّل حصة واحدة بس النهاردة', en: 'You got this! Complete just one lesson today' },
  },
  ACTIVE: {
    label: { ar: 'نشط', en: 'Active' },
    cta: { ar: 'أداءك ممتاز! كمل بنفس الروح 💪', en: 'Great progress! Keep the momentum 💪' },
  },
  UNKNOWN: {
    label: { ar: 'غير محدد', en: 'Unknown' },
    cta: { ar: '', en: '' },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get localized system status text
 */
export function getSystemStatusText(
  code: SystemStatusCode,
  field: 'label' | 'description',
  isArabic: boolean
): string {
  const copy = SYSTEM_STATUS_COPY[code];
  if (!copy) return '';
  return isArabic ? copy[field].ar : copy[field].en;
}

/**
 * Get localized student status text
 */
export function getStudentStatusText(
  code: StudentStatusCode,
  field: 'label' | 'cta',
  isArabic: boolean
): string {
  const copy = STUDENT_STATUS_COPY[code];
  if (!copy) return '';
  return isArabic ? copy[field].ar : copy[field].en;
}

/**
 * Map system status level to UI-safe variant
 */
export function getSystemStatusLevel(code: SystemStatusCode): SystemStatusLevel {
  switch (code) {
    case 'NOT_ACTIVATED':
    case 'NO_STUDENTS_OR_ENROLLMENTS':
    case 'DATA_LOAD_ERROR':
      return 'critical';
    case 'CRITICAL_PASS_RATE':
    case 'HIGH_FAILURE_RATE':
      return 'danger';
    case 'UNSTABLE_RESULTS':
    case 'NEEDS_EXAM_FOLLOWUP':
      return 'warning';
    case 'STABLE':
      return 'success';
    default:
      return 'critical';
  }
}
