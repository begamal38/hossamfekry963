-- Function to recalculate course duration_hours based on lesson durations
CREATE OR REPLACE FUNCTION public.update_course_duration_hours()
RETURNS TRIGGER AS $$
DECLARE
  target_course_id uuid;
  total_mins integer;
BEGIN
  -- Determine which course_id to update
  IF TG_OP = 'DELETE' THEN
    target_course_id := OLD.course_id;
  ELSE
    target_course_id := NEW.course_id;
  END IF;

  -- Calculate total minutes for the course
  SELECT COALESCE(SUM(COALESCE(duration_minutes, 0)), 0)
  INTO total_mins
  FROM public.lessons
  WHERE course_id = target_course_id;

  -- Update course duration_hours (rounded up to nearest hour)
  UPDATE public.courses
  SET duration_hours = CEIL(total_mins::numeric / 60)
  WHERE id = target_course_id;

  -- If UPDATE changed course_id, also update the old course
  IF TG_OP = 'UPDATE' AND OLD.course_id IS DISTINCT FROM NEW.course_id THEN
    SELECT COALESCE(SUM(COALESCE(duration_minutes, 0)), 0)
    INTO total_mins
    FROM public.lessons
    WHERE course_id = OLD.course_id;

    UPDATE public.courses
    SET duration_hours = CEIL(total_mins::numeric / 60)
    WHERE id = OLD.course_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic course duration updates
DROP TRIGGER IF EXISTS update_course_duration_on_lesson_change ON public.lessons;

CREATE TRIGGER update_course_duration_on_lesson_change
AFTER INSERT OR UPDATE OF duration_minutes, course_id OR DELETE
ON public.lessons
FOR EACH ROW
EXECUTE FUNCTION public.update_course_duration_hours();