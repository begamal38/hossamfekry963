-- Create a function to sync enrollment progress from lesson_completions
CREATE OR REPLACE FUNCTION public.sync_enrollment_progress()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update all enrollments with actual completion counts and progress
  UPDATE public.course_enrollments ce
  SET 
    completed_lessons = subq.completed_count,
    progress = CASE 
      WHEN subq.total_lessons > 0 
      THEN ROUND((subq.completed_count::numeric / subq.total_lessons::numeric) * 100)
      ELSE 0 
    END
  FROM (
    SELECT 
      ce2.id as enrollment_id,
      ce2.user_id,
      ce2.course_id,
      COALESCE(c.lessons_count, 0) as total_lessons,
      COUNT(DISTINCT lc.lesson_id) as completed_count
    FROM public.course_enrollments ce2
    JOIN public.courses c ON c.id = ce2.course_id
    LEFT JOIN public.lessons l ON l.course_id = ce2.course_id
    LEFT JOIN public.lesson_completions lc ON lc.lesson_id = l.id AND lc.user_id = ce2.user_id
    GROUP BY ce2.id, ce2.user_id, ce2.course_id, c.lessons_count
  ) subq
  WHERE ce.id = subq.enrollment_id;
END;
$$;

-- Create a trigger function to update enrollment when a lesson is completed
CREATE OR REPLACE FUNCTION public.update_enrollment_on_lesson_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course_id uuid;
  v_total_lessons integer;
  v_completed_count integer;
BEGIN
  -- Get the course_id from the lesson
  SELECT course_id INTO v_course_id
  FROM public.lessons
  WHERE id = NEW.lesson_id;
  
  IF v_course_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get total lessons in course
  SELECT COALESCE(lessons_count, 0) INTO v_total_lessons
  FROM public.courses
  WHERE id = v_course_id;
  
  -- Count completed lessons for this user in this course
  SELECT COUNT(DISTINCT lc.lesson_id) INTO v_completed_count
  FROM public.lesson_completions lc
  JOIN public.lessons l ON l.id = lc.lesson_id
  WHERE lc.user_id = NEW.user_id
    AND l.course_id = v_course_id;
  
  -- Update the enrollment
  UPDATE public.course_enrollments
  SET 
    completed_lessons = v_completed_count,
    progress = CASE 
      WHEN v_total_lessons > 0 
      THEN ROUND((v_completed_count::numeric / v_total_lessons::numeric) * 100)
      ELSE 0 
    END
  WHERE user_id = NEW.user_id
    AND course_id = v_course_id;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS trg_update_enrollment_on_completion ON public.lesson_completions;
CREATE TRIGGER trg_update_enrollment_on_completion
AFTER INSERT ON public.lesson_completions
FOR EACH ROW
EXECUTE FUNCTION public.update_enrollment_on_lesson_completion();

-- Run the sync function to update existing data
SELECT public.sync_enrollment_progress();