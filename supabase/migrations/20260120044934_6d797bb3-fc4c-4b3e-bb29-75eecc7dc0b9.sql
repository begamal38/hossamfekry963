-- ═══════════════════════════════════════════════════════════════════════════
-- SUPABASE RPC: get_chapter_progress
-- Optimized single-query function for chapter progress (was 5+ sequential queries)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_chapter_progress(
  p_course_id uuid,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  chapter_id uuid,
  chapter_title text,
  chapter_title_ar text,
  order_index integer,
  total_lessons integer,
  completed_lessons integer,
  progress_percent integer,
  is_complete boolean,
  has_exam boolean,
  exam_id uuid,
  exam_title text,
  exam_title_ar text,
  exam_completed boolean,
  exam_score numeric
) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH chapter_lessons AS (
    -- Count lessons per chapter
    SELECT 
      c.id as chapter_id,
      c.title as chapter_title,
      c.title_ar as chapter_title_ar,
      c.order_index,
      COUNT(l.id)::integer as total_lessons
    FROM chapters c
    LEFT JOIN lessons l ON l.chapter_id = c.id
    WHERE c.course_id = p_course_id
    GROUP BY c.id, c.title, c.title_ar, c.order_index
  ),
  user_completions AS (
    -- Count completed lessons per chapter for the user
    SELECT 
      l.chapter_id,
      COUNT(lc.id)::integer as completed_count
    FROM lessons l
    INNER JOIN lesson_completions lc ON lc.lesson_id = l.id
    WHERE l.course_id = p_course_id
      AND lc.user_id = p_user_id
      AND p_user_id IS NOT NULL
    GROUP BY l.chapter_id
  ),
  chapter_exams AS (
    -- Get published exams for each chapter
    SELECT 
      e.chapter_id,
      e.id as exam_id,
      e.title as exam_title,
      e.title_ar as exam_title_ar
    FROM exams e
    WHERE e.course_id = p_course_id
      AND e.chapter_id IS NOT NULL
      AND e.status = 'published'
  ),
  user_exam_attempts AS (
    -- Get user's best exam attempt per chapter
    SELECT DISTINCT ON (e.chapter_id)
      e.chapter_id,
      ea.is_completed,
      ea.score::numeric
    FROM exam_attempts ea
    INNER JOIN exams e ON e.id = ea.exam_id
    WHERE e.course_id = p_course_id
      AND ea.user_id = p_user_id
      AND ea.is_completed = true
      AND p_user_id IS NOT NULL
    ORDER BY e.chapter_id, ea.score DESC
  )
  SELECT 
    cl.chapter_id,
    cl.chapter_title,
    cl.chapter_title_ar,
    cl.order_index,
    cl.total_lessons,
    COALESCE(uc.completed_count, 0) as completed_lessons,
    CASE 
      WHEN cl.total_lessons > 0 
      THEN ROUND((COALESCE(uc.completed_count, 0)::numeric / cl.total_lessons::numeric) * 100)::integer
      ELSE 0 
    END as progress_percent,
    (cl.total_lessons > 0 AND COALESCE(uc.completed_count, 0) >= cl.total_lessons) as is_complete,
    (ce.exam_id IS NOT NULL) as has_exam,
    ce.exam_id,
    ce.exam_title,
    ce.exam_title_ar,
    COALESCE(uea.is_completed, false) as exam_completed,
    COALESCE(uea.score, 0) as exam_score
  FROM chapter_lessons cl
  LEFT JOIN user_completions uc ON uc.chapter_id = cl.chapter_id
  LEFT JOIN chapter_exams ce ON ce.chapter_id = cl.chapter_id
  LEFT JOIN user_exam_attempts uea ON uea.chapter_id = cl.chapter_id
  ORDER BY cl.order_index NULLS LAST;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_chapter_progress(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_chapter_progress(uuid, uuid) TO anon;