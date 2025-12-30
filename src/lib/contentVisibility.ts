/**
 * Content Visibility Utilities
 * 
 * Handles visibility rules for courses, chapters, and lessons based on:
 * - Active academic scope (current phase)
 * - Content hierarchy (lesson → chapter → course)
 * - Video availability
 */

import { extractYouTubeVideoId } from './youtubeUtils';

// Current active scope for student-facing content - 2026 Academic Year
// All 4 grades are now active
export const ACTIVE_SCOPE = {
  grades: ['second_arabic', 'second_languages', 'third_arabic', 'third_languages'],
};

const normalizeGradeKey = (value: string | null | undefined) =>
  (value ?? '').trim().toLowerCase();

const ACTIVE_SCOPE_GRADES_SET = new Set(ACTIVE_SCOPE.grades.map(normalizeGradeKey));

/**
 * Check if a course is within the active scope for students
 */
export function isCourseInActiveScope(courseGrade: string): boolean {
  return ACTIVE_SCOPE_GRADES_SET.has(normalizeGradeKey(courseGrade));
}

/**
 * Check if a course is in preview mode (visible but not enrollable)
 * Preview courses are those outside the active scope
 */
export function isCoursePreview(courseGrade: string): boolean {
  return !isCourseInActiveScope(courseGrade);
}

/**
 * Check if a lesson has a valid video URL
 */
export function hasValidVideo(videoUrl: string | null | undefined): boolean {
  if (!videoUrl) return false;
  const videoId = extractYouTubeVideoId(videoUrl);
  return !!videoId;
}

/**
 * Check if a lesson is complete (has chapter and belongs to proper hierarchy)
 */
export function isLessonComplete(lesson: {
  chapter_id: string | null;
  video_url: string | null;
}): boolean {
  // Lesson must belong to a chapter
  if (!lesson.chapter_id) return false;
  return true;
}

/**
 * Check if a lesson is ready for student view (complete + has video)
 */
export function isLessonReadyForStudents(lesson: {
  chapter_id: string | null;
  video_url: string | null;
}): boolean {
  return isLessonComplete(lesson) && hasValidVideo(lesson.video_url);
}

/**
 * Filter lessons for student visibility
 * - Lessons are now visible regardless of chapter assignment
 * - Chapter is organizational, not visibility requirement
 * - For progress calculation, may optionally require video
 */
export function filterLessonsForStudents<T extends { chapter_id: string | null }>(
  lessons: T[],
  options: {
    requireVideo?: boolean;
    isFreeCourse?: boolean;
  } = {}
): T[] {
  const { requireVideo = false } = options;
  
  return lessons.filter(lesson => {
    // Lessons are visible regardless of chapter assignment
    // Chapter is for organization only, not visibility
    
    // Optionally require video
    if (requireVideo) {
      const lessonWithVideo = lesson as T & { video_url: string | null };
      return hasValidVideo(lessonWithVideo.video_url);
    }
    
    return true;
  });
}

/**
 * Filter courses for student visibility.
 *
 * Public/Students should be able to browse any course that belongs to the
 * current academic scope (2026), even if `is_primary` wasn't set correctly.
 *
 * - Staff (admins/assistants): can see all courses (bypassScope)
 * - Everyone else: see courses in ACTIVE_SCOPE OR explicitly free OR explicitly primary
 */
export function filterCoursesForStudents<
  T extends { grade: string; is_primary?: boolean; is_free?: boolean }
>(
  courses: T[],
  options: {
    bypassScope?: boolean; // For admins/assistants - show all courses
    userGrade?: string | null; // If set, show only matching grade
  } = {}
): T[] {
  const { bypassScope = false } = options;

  // Admins/assistants can see all courses
  if (bypassScope) {
    return courses;
  }

  return courses.filter((course) => {
    const isFree = course.is_free === true;
    const isPrimary = course.is_primary === true;
    const isInScope = isCourseInActiveScope(course.grade);

    return isInScope || isPrimary || isFree;
  });
}

/**
 * Calculate progress only counting lessons with valid videos
 */
export function calculateProgress(
  lessons: Array<{ id: string; chapter_id: string | null; video_url: string | null }>,
  completedLessonIds: string[]
): {
  total: number;
  completed: number;
  percent: number;
} {
  // Only count lessons that are in chapters AND have videos
  const eligibleLessons = lessons.filter(
    l => l.chapter_id && hasValidVideo(l.video_url)
  );
  
  const completed = eligibleLessons.filter(
    l => completedLessonIds.includes(l.id)
  ).length;
  
  const total = eligibleLessons.length;
  const percent = total > 0 ? (completed / total) * 100 : 0;
  
  return { total, completed, percent };
}
