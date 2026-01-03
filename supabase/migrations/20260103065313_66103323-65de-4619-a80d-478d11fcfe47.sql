-- Add short sequential ID to courses
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS short_id SERIAL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_courses_short_id ON public.courses(short_id);

-- Add short sequential ID to lessons
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS short_id SERIAL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_lessons_short_id ON public.lessons(short_id);

-- Function to get course by short_id
CREATE OR REPLACE FUNCTION public.get_course_id_by_short_id(p_short_id integer)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.courses WHERE short_id = p_short_id LIMIT 1;
$$;

-- Function to get lesson by short_id
CREATE OR REPLACE FUNCTION public.get_lesson_id_by_short_id(p_short_id integer)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.lessons WHERE short_id = p_short_id LIMIT 1;
$$;