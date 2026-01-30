/**
 * Centralized Status Copy Mapping
 * 
 * This is the ONLY place where human-readable text for status codes should exist.
 * All hooks MUST return status codes only, never raw text.
 * UI components consume text through this mapping.
 */

import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  PauseCircle, 
  Activity,
  FileX,
  type LucideIcon 
} from 'lucide-react';

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
  | 'PRE_EXAM_ENGAGING'  // New: Healthy engagement before exams are published
  | 'STABLE'
  | 'DATA_LOAD_ERROR';

// ═══════════════════════════════════════════════════════════════════════════
// Visual Config Map (LOCKED - Single Source of Truth for Status Visuals)
// ═══════════════════════════════════════════════════════════════════════════

export type StatusEmphasis = 'positive' | 'neutral' | 'warning' | 'attention' | 'critical';

export interface StatusVisualConfig {
  /** Tailwind color class prefix (e.g., 'green' for text-green-600, bg-green-500) */
  color: 'green' | 'blue' | 'amber' | 'orange' | 'purple' | 'red' | 'gray';
  /** Lucide icon component */
  icon: LucideIcon;
  /** Visual emphasis level */
  emphasis: StatusEmphasis;
  /** Dot color class for the indicator */
  dotClass: string;
  /** Background tint class */
  bgTintClass: string;
  /** Text color class */
  textClass: string;
}

export const STATUS_VISUALS: Record<SystemStatusCode, StatusVisualConfig> = {
  STABLE: {
    color: 'green',
    icon: CheckCircle,
    emphasis: 'positive',
    dotClass: 'bg-green-500',
    bgTintClass: 'bg-green-500/10',
    textClass: 'text-green-600',
  },
  PRE_EXAM_ENGAGING: {
    color: 'blue',
    icon: Activity,
    emphasis: 'positive',
    dotClass: 'bg-blue-500',
    bgTintClass: 'bg-blue-500/10',
    textClass: 'text-blue-600',
  },
  NEEDS_EXAM_FOLLOWUP: {
    color: 'amber',
    icon: Activity,
    emphasis: 'warning',
    dotClass: 'bg-amber-500',
    bgTintClass: 'bg-amber-500/10',
    textClass: 'text-amber-600',
  },
  UNSTABLE_RESULTS: {
    color: 'orange',
    icon: AlertTriangle,
    emphasis: 'warning',
    dotClass: 'bg-orange-500',
    bgTintClass: 'bg-orange-500/10',
    textClass: 'text-orange-600',
  },
  HIGH_FAILURE_RATE: {
    color: 'red',
    icon: XCircle,
    emphasis: 'critical',
    dotClass: 'bg-red-500',
    bgTintClass: 'bg-red-500/10',
    textClass: 'text-red-600',
  },
  CRITICAL_PASS_RATE: {
    color: 'red',
    icon: XCircle,
    emphasis: 'critical',
    dotClass: 'bg-red-500',
    bgTintClass: 'bg-red-500/10',
    textClass: 'text-red-600',
  },
  NOT_ACTIVATED: {
    color: 'gray',
    icon: PauseCircle,
    emphasis: 'critical',
    dotClass: 'bg-gray-800 dark:bg-gray-400',
    bgTintClass: 'bg-gray-900/10 dark:bg-gray-400/10',
    textClass: 'text-gray-800 dark:text-gray-300',
  },
  NO_STUDENTS_OR_ENROLLMENTS: {
    color: 'gray',
    icon: PauseCircle,
    emphasis: 'critical',
    dotClass: 'bg-gray-800 dark:bg-gray-400',
    bgTintClass: 'bg-gray-900/10 dark:bg-gray-400/10',
    textClass: 'text-gray-800 dark:text-gray-300',
  },
  DATA_LOAD_ERROR: {
    color: 'purple',
    icon: FileX,
    emphasis: 'attention',
    dotClass: 'bg-purple-500',
    bgTintClass: 'bg-purple-500/10',
    textClass: 'text-purple-600',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// Copy Mapping (Text is UI-only, separate from visuals)
// ═══════════════════════════════════════════════════════════════════════════

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
    description: { ar: 'فيه امتحانات متاحة بس الطلاب مش بيمتحنوا', en: 'Exams available but students not testing' },
  },
  PRE_EXAM_ENGAGING: {
    label: { ar: 'مرحلة التعلم', en: 'Learning Phase' },
    description: { ar: 'الطلاب بيتعلموا بشكل طبيعي — الامتحانات هتبدأ قريب', en: 'Students learning normally — exams will start soon' },
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
    case 'PRE_EXAM_ENGAGING':
    case 'STABLE':
      return 'success';
    default:
      return 'critical';
  }
}
