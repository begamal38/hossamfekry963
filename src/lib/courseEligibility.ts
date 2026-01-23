/**
 * Course Eligibility - SINGLE SOURCE OF TRUTH
 * 
 * This module centralizes ALL course and lesson eligibility logic.
 * All pages MUST use these functions - no independent implementations.
 * 
 * Rules:
 * 1. Enrollment ALWAYS overrides grade/track checks
 * 2. Staff (admin/assistant) can access everything
 * 3. Free lessons follow System 3 logic (visitors see all, students see matching grade/track)
 * 4. Paid courses require enrollment OR matching grade/track for visibility
 */

import { doesStudentMatchCourseGrade, buildCourseGradeFromProfile } from './gradeLabels';

// ══════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════

export interface StudentProfile {
  grade: string | null;
  language_track: string | null;
  attendance_mode?: string | null;
}

export interface CourseInfo {
  id: string;
  grade: string;
  is_free?: boolean;
  is_primary?: boolean;
  is_hidden?: boolean;
}

export interface LessonInfo {
  id: string;
  is_free_lesson?: boolean;
  course_id: string;
  courses?: {
    grade: string;
  } | null;
}

export interface EligibilityContext {
  isAuthenticated: boolean;
  isStaff: boolean; // admin or assistant_teacher
  studentProfile: StudentProfile | null;
  enrolledCourseIds: string[]; // courses with ANY enrollment status
  activeCourseIds: string[]; // courses with 'active' status only
}

// ══════════════════════════════════════════════════════════════════════════
// COURSE ELIGIBILITY
// ══════════════════════════════════════════════════════════════════════════

/**
 * Check if a user can VIEW a course (in listings)
 * This determines visibility in Home page, Courses page, etc.
 */
export function canViewCourse(course: CourseInfo, ctx: EligibilityContext): boolean {
  // Staff can see everything
  if (ctx.isStaff) return true;
  
  // Hidden courses are only visible if user is enrolled
  if (course.is_hidden) {
    return ctx.enrolledCourseIds.includes(course.id);
  }
  
  // Free courses are visible to everyone
  if (course.is_free) return true;
  
  // Primary courses (2026 academic) are visible to everyone
  if (course.is_primary) return true;
  
  // Enrolled students can see the course
  if (ctx.enrolledCourseIds.includes(course.id)) return true;
  
  // Visitors can see non-hidden courses
  if (!ctx.isAuthenticated) return true;
  
  // Authenticated students: check grade/track match
  if (ctx.studentProfile) {
    return doesStudentMatchCourseGrade(
      ctx.studentProfile.grade,
      ctx.studentProfile.language_track,
      course.grade
    );
  }
  
  return true; // Default allow for incomplete profiles
}

/**
 * Check if a user can ACCESS a course (view lessons, enroll)
 * This is stricter than visibility
 */
export function canAccessCourse(course: CourseInfo, ctx: EligibilityContext): {
  allowed: boolean;
  reason: 'staff' | 'enrolled' | 'free' | 'grade_match' | 'blocked';
  messageAr: string;
  messageEn: string;
} {
  // Staff can access everything
  if (ctx.isStaff) {
    return { allowed: true, reason: 'staff', messageAr: '', messageEn: '' };
  }
  
  // Active enrollment grants full access
  if (ctx.activeCourseIds.includes(course.id)) {
    return { allowed: true, reason: 'enrolled', messageAr: '', messageEn: '' };
  }
  
  // Any enrollment (including pending/suspended) grants view access
  if (ctx.enrolledCourseIds.includes(course.id)) {
    return { allowed: true, reason: 'enrolled', messageAr: '', messageEn: '' };
  }
  
  // Free courses accessible to everyone
  if (course.is_free) {
    return { allowed: true, reason: 'free', messageAr: '', messageEn: '' };
  }
  
  // Not authenticated - can view but not access paid content
  if (!ctx.isAuthenticated) {
    return { 
      allowed: false, 
      reason: 'blocked',
      messageAr: 'سجل دخول للوصول لهذا المحتوى',
      messageEn: 'Sign in to access this content'
    };
  }
  
  // Check grade/track match for authenticated students
  if (ctx.studentProfile) {
    const matches = doesStudentMatchCourseGrade(
      ctx.studentProfile.grade,
      ctx.studentProfile.language_track,
      course.grade
    );
    
    if (matches) {
      return { allowed: true, reason: 'grade_match', messageAr: '', messageEn: '' };
    }
    
    // Grade mismatch - blocked
    return {
      allowed: false,
      reason: 'blocked',
      messageAr: 'هذا المحتوى مخصص لصف دراسي آخر',
      messageEn: 'This content is for a different grade'
    };
  }
  
  // Incomplete profile - allow to avoid blocking onboarding
  return { allowed: true, reason: 'grade_match', messageAr: '', messageEn: '' };
}

// ══════════════════════════════════════════════════════════════════════════
// FREE LESSON ELIGIBILITY (System 3 Logic)
// ══════════════════════════════════════════════════════════════════════════

/**
 * Check if a free lesson should be visible to the user
 * 
 * System 3 Rules:
 * - Anonymous visitors: See ALL free lessons (for discovery/marketing)
 * - Authenticated students: See ONLY free lessons matching their grade/track
 * - Staff: See ALL free lessons
 * 
 * FORBIDDEN: Do NOT check attendance_mode, center_group, or enrollments for free lessons
 */
export function canViewFreeLesson(
  lesson: LessonInfo,
  ctx: EligibilityContext
): boolean {
  // Only applies to free lessons
  if (!lesson.is_free_lesson) return false;
  
  // Staff sees all
  if (ctx.isStaff) return true;
  
  // Anonymous visitors see all free lessons
  if (!ctx.isAuthenticated) return true;
  
  // Authenticated students: match grade/track
  if (ctx.studentProfile) {
    const courseGrade = lesson.courses?.grade;
    if (!courseGrade) return true; // No grade restriction
    
    return doesStudentMatchCourseGrade(
      ctx.studentProfile.grade,
      ctx.studentProfile.language_track,
      courseGrade
    );
  }
  
  // Incomplete profile - show all to avoid blocking
  return true;
}

/**
 * Filter a list of free lessons based on eligibility
 */
export function filterFreeLessons<T extends LessonInfo>(
  lessons: T[],
  ctx: EligibilityContext
): T[] {
  return lessons.filter(lesson => canViewFreeLesson(lesson, ctx));
}

// ══════════════════════════════════════════════════════════════════════════
// COURSE FILTERING
// ══════════════════════════════════════════════════════════════════════════

/**
 * Filter courses for display in listings
 */
export function filterCoursesForDisplay<T extends CourseInfo>(
  courses: T[],
  ctx: EligibilityContext
): T[] {
  return courses.filter(course => canViewCourse(course, ctx));
}

/**
 * Build eligibility context from common hook data
 */
export function buildEligibilityContext(params: {
  user: { id: string } | null;
  isStaff: boolean;
  profile: StudentProfile | null;
  enrollments: Array<{ course_id: string; status?: string }>;
}): EligibilityContext {
  return {
    isAuthenticated: !!params.user,
    isStaff: params.isStaff,
    studentProfile: params.profile,
    enrolledCourseIds: params.enrollments.map(e => e.course_id),
    activeCourseIds: params.enrollments
      .filter(e => e.status === 'active')
      .map(e => e.course_id),
  };
}
