-- Create function to update lessons_count on courses table
CREATE OR REPLACE FUNCTION public.update_course_lessons_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT or UPDATE
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    UPDATE public.courses
    SET lessons_count = (
      SELECT COUNT(*) FROM public.lessons WHERE course_id = NEW.course_id
    )
    WHERE id = NEW.course_id;
    
    -- If UPDATE changed course_id, also update the old course
    IF (TG_OP = 'UPDATE' AND OLD.course_id IS DISTINCT FROM NEW.course_id) THEN
      UPDATE public.courses
      SET lessons_count = (
        SELECT COUNT(*) FROM public.lessons WHERE course_id = OLD.course_id
      )
      WHERE id = OLD.course_id;
    END IF;
    
    RETURN NEW;
  END IF;
  
  -- Handle DELETE
  IF (TG_OP = 'DELETE') THEN
    UPDATE public.courses
    SET lessons_count = (
      SELECT COUNT(*) FROM public.lessons WHERE course_id = OLD.course_id
    )
    WHERE id = OLD.course_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_course_lessons_count ON public.lessons;

-- Create trigger that fires on INSERT, UPDATE, DELETE of lessons
CREATE TRIGGER trigger_update_course_lessons_count
AFTER INSERT OR UPDATE OF course_id OR DELETE ON public.lessons
FOR EACH ROW
EXECUTE FUNCTION public.update_course_lessons_count();

-- Also sync all existing courses lessons_count to be accurate now
UPDATE public.courses c
SET lessons_count = (
  SELECT COUNT(*) FROM public.lessons l WHERE l.course_id = c.id
);