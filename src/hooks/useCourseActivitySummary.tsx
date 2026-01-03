import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CourseActivitySummary {
  id: string;
  userId: string;
  courseId: string;
  frozenAt: string;
  frozenBy: string;
  
  // Scores
  engagementScore: 'low' | 'medium' | 'high';
  coveragePercentage: number;
  coverageLabel: 'weak' | 'fair' | 'strong';
  consistencyScore: 'low' | 'medium' | 'high';
  
  // Raw data (for internal reference)
  totalFocusSessions: number;
  totalActiveMinutes: number;
  lessonsAccessed: number;
  lessonsCompleted: number;
  totalLessons: number;
  chaptersAccessed: number;
  totalChapters: number;
  learningDays: number;
}

interface CalculationInput {
  userId: string;
  courseId: string;
  frozenBy: string;
}

export const useCourseActivitySummary = () => {
  const [loading, setLoading] = useState(false);

  // Calculate and freeze course activity summary
  const calculateAndFreezeSummary = useCallback(async (input: CalculationInput): Promise<CourseActivitySummary | null> => {
    setLoading(true);
    try {
      const { userId, courseId, frozenBy } = input;

      // 1. Get focus sessions for this user/course
      const { data: focusSessions, error: focusError } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseId);

      if (focusError) throw focusError;

      // 2. Get lesson completions
      const { data: completions, error: completionsError } = await supabase
        .from('lesson_completions')
        .select('lesson_id, completed_at')
        .eq('user_id', userId);

      if (completionsError) throw completionsError;

      // 3. Get all lessons in course
      const { data: courseLessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id, chapter_id')
        .eq('course_id', courseId);

      if (lessonsError) throw lessonsError;

      // 4. Get all chapters in course
      const { data: courseChapters, error: chaptersError } = await supabase
        .from('chapters')
        .select('id')
        .eq('course_id', courseId);

      if (chaptersError) throw chaptersError;

      // Calculate metrics
      const totalLessons = courseLessons?.length || 0;
      const totalChapters = courseChapters?.length || 0;
      
      // Lessons completed in this course
      const courseLessonIds = new Set(courseLessons?.map(l => l.id) || []);
      const completedInCourse = completions?.filter(c => courseLessonIds.has(c.lesson_id)) || [];
      const lessonsCompleted = completedInCourse.length;

      // Lessons accessed (from focus sessions)
      const lessonsAccessed = new Set(focusSessions?.map(s => s.lesson_id) || []).size;

      // Chapters accessed (from lessons that have focus sessions)
      const accessedLessonIds = new Set(focusSessions?.map(s => s.lesson_id) || []);
      const chaptersAccessed = new Set(
        courseLessons?.filter(l => accessedLessonIds.has(l.id) && l.chapter_id).map(l => l.chapter_id) || []
      ).size;

      // Focus session metrics
      const totalFocusSessions = focusSessions?.length || 0;
      const totalActiveSeconds = focusSessions?.reduce((sum, s) => sum + (s.total_active_seconds || 0), 0) || 0;
      const totalPausedSeconds = focusSessions?.reduce((sum, s) => sum + (s.total_paused_seconds || 0), 0) || 0;
      const totalActiveMinutes = Math.round(totalActiveSeconds / 60);
      const totalPausedMinutes = Math.round(totalPausedSeconds / 60);

      // Learning days (unique days with focus sessions)
      const learningDays = new Set(
        focusSessions?.map(s => new Date(s.started_at).toDateString()) || []
      ).size;

      // Calculate session gaps for consistency
      let avgSessionGapHours: number | null = null;
      if (focusSessions && focusSessions.length > 1) {
        const sortedSessions = [...focusSessions].sort(
          (a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime()
        );
        let totalGapMs = 0;
        for (let i = 1; i < sortedSessions.length; i++) {
          const gap = new Date(sortedSessions[i].started_at).getTime() - 
                      new Date(sortedSessions[i-1].ended_at || sortedSessions[i-1].started_at).getTime();
          totalGapMs += gap;
        }
        avgSessionGapHours = totalGapMs / (sortedSessions.length - 1) / (1000 * 60 * 60);
      }

      // Calculate scores
      const engagementScore = calculateEngagementScore(
        totalFocusSessions,
        totalActiveSeconds,
        totalPausedSeconds,
        focusSessions || []
      );

      const coveragePercentage = totalLessons > 0 
        ? Math.round((lessonsCompleted / totalLessons) * 100)
        : 0;
      const coverageLabel = getCoverageLabel(coveragePercentage);

      const consistencyScore = calculateConsistencyScore(
        learningDays,
        avgSessionGapHours,
        totalFocusSessions
      );

      // Insert frozen summary
      const { data: summary, error: insertError } = await supabase
        .from('course_activity_summaries')
        .upsert({
          user_id: userId,
          course_id: courseId,
          frozen_by: frozenBy,
          frozen_at: new Date().toISOString(),
          total_focus_sessions: totalFocusSessions,
          total_active_minutes: totalActiveMinutes,
          total_paused_minutes: totalPausedMinutes,
          lessons_accessed: lessonsAccessed,
          lessons_completed: lessonsCompleted,
          total_lessons: totalLessons,
          chapters_accessed: chaptersAccessed,
          total_chapters: totalChapters,
          learning_days: learningDays,
          avg_session_gap_hours: avgSessionGapHours,
          engagement_score: engagementScore,
          coverage_percentage: coveragePercentage,
          coverage_label: coverageLabel,
          consistency_score: consistencyScore,
        }, { onConflict: 'user_id,course_id' })
        .select()
        .single();

      if (insertError) throw insertError;

      return {
        id: summary.id,
        userId: summary.user_id,
        courseId: summary.course_id,
        frozenAt: summary.frozen_at,
        frozenBy: summary.frozen_by,
        engagementScore: summary.engagement_score as 'low' | 'medium' | 'high',
        coveragePercentage: summary.coverage_percentage,
        coverageLabel: summary.coverage_label as 'weak' | 'fair' | 'strong',
        consistencyScore: summary.consistency_score as 'low' | 'medium' | 'high',
        totalFocusSessions: summary.total_focus_sessions,
        totalActiveMinutes: summary.total_active_minutes,
        lessonsAccessed: summary.lessons_accessed,
        lessonsCompleted: summary.lessons_completed,
        totalLessons: summary.total_lessons,
        chaptersAccessed: summary.chapters_accessed,
        totalChapters: summary.total_chapters,
        learningDays: summary.learning_days,
      };
    } catch (err) {
      console.error('Failed to calculate course activity summary:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get existing frozen summary
  const getSummary = useCallback(async (userId: string, courseId: string): Promise<CourseActivitySummary | null> => {
    try {
      const { data, error } = await supabase
        .from('course_activity_summaries')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .maybeSingle();

      if (error || !data) return null;

      return {
        id: data.id,
        userId: data.user_id,
        courseId: data.course_id,
        frozenAt: data.frozen_at,
        frozenBy: data.frozen_by,
        engagementScore: data.engagement_score as 'low' | 'medium' | 'high',
        coveragePercentage: data.coverage_percentage,
        coverageLabel: data.coverage_label as 'weak' | 'fair' | 'strong',
        consistencyScore: data.consistency_score as 'low' | 'medium' | 'high',
        totalFocusSessions: data.total_focus_sessions,
        totalActiveMinutes: data.total_active_minutes,
        lessonsAccessed: data.lessons_accessed,
        lessonsCompleted: data.lessons_completed,
        totalLessons: data.total_lessons,
        chaptersAccessed: data.chapters_accessed,
        totalChapters: data.total_chapters,
        learningDays: data.learning_days,
      };
    } catch {
      return null;
    }
  }, []);

  return { calculateAndFreezeSummary, getSummary, loading };
};

// Helper: Calculate engagement score
function calculateEngagementScore(
  sessions: number,
  activeSeconds: number,
  pausedSeconds: number,
  focusSessions: any[]
): 'low' | 'medium' | 'high' {
  if (sessions === 0) return 'low';

  // Active ratio (active time vs total time)
  const totalTime = activeSeconds + pausedSeconds;
  const activeRatio = totalTime > 0 ? activeSeconds / totalTime : 0;

  // Session continuity (average session length)
  const avgSessionLength = sessions > 0 ? activeSeconds / sessions : 0;
  const longSessionThreshold = 10 * 60; // 10 minutes

  // Completed segments (20-min blocks)
  const totalSegments = focusSessions.reduce((sum, s) => sum + (s.completed_segments || 0), 0);

  // Score calculation
  let score = 0;
  
  // Active ratio contribution (0-3)
  if (activeRatio >= 0.8) score += 3;
  else if (activeRatio >= 0.6) score += 2;
  else if (activeRatio >= 0.4) score += 1;

  // Session length contribution (0-3)
  if (avgSessionLength >= longSessionThreshold * 2) score += 3;
  else if (avgSessionLength >= longSessionThreshold) score += 2;
  else if (avgSessionLength >= longSessionThreshold / 2) score += 1;

  // Segments contribution (0-2)
  if (totalSegments >= 5) score += 2;
  else if (totalSegments >= 2) score += 1;

  // Map score to label
  if (score >= 6) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}

// Helper: Get coverage label from percentage
function getCoverageLabel(percentage: number): 'weak' | 'fair' | 'strong' {
  if (percentage >= 70) return 'strong';
  if (percentage >= 40) return 'fair';
  return 'weak';
}

// Helper: Calculate consistency score
function calculateConsistencyScore(
  learningDays: number,
  avgGapHours: number | null,
  sessions: number
): 'low' | 'medium' | 'high' {
  if (sessions === 0 || learningDays === 0) return 'low';

  let score = 0;

  // Learning days contribution (0-3)
  if (learningDays >= 10) score += 3;
  else if (learningDays >= 5) score += 2;
  else if (learningDays >= 2) score += 1;

  // Session frequency (sessions per learning day) (0-2)
  const sessionsPerDay = sessions / learningDays;
  if (sessionsPerDay >= 2) score += 2;
  else if (sessionsPerDay >= 1) score += 1;

  // Gap penalty (0-2 deducted for long gaps)
  if (avgGapHours !== null) {
    if (avgGapHours <= 24) score += 2; // Returns within a day
    else if (avgGapHours <= 72) score += 1; // Returns within 3 days
    // No bonus for longer gaps
  }

  // Map score to label
  if (score >= 5) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}
