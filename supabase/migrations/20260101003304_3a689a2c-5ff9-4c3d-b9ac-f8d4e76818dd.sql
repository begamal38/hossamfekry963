-- Add slug column to courses table
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_courses_slug ON public.courses(slug);

-- Function to generate slug from Arabic title
CREATE OR REPLACE FUNCTION public.generate_course_slug(
  p_title_ar text,
  p_grade text,
  p_course_id uuid DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slug text;
  v_base_slug text;
  v_counter integer := 0;
  v_grade_slug text;
  v_lang_track text;
  v_subject_slug text;
BEGIN
  -- Map Arabic grade to English
  v_grade_slug := CASE 
    WHEN p_grade ILIKE '%ثانية%' OR p_grade ILIKE '%تانية%' OR p_grade = 'second_secondary' THEN 'grade-11'
    WHEN p_grade ILIKE '%ثالثة%' OR p_grade ILIKE '%تالتة%' OR p_grade = 'third_secondary' THEN 'grade-12'
    WHEN p_grade ILIKE '%أولى%' OR p_grade ILIKE '%اولى%' OR p_grade = 'first_secondary' THEN 'grade-10'
    ELSE 'general'
  END;
  
  -- Detect language track from title
  v_lang_track := CASE 
    WHEN p_title_ar ILIKE '%لغات%' THEN 'lang'
    WHEN p_title_ar ILIKE '%عربي%' THEN 'ar'
    ELSE ''
  END;
  
  -- Map subject (chemistry focused platform)
  v_subject_slug := CASE 
    WHEN p_title_ar ILIKE '%كيمياء%' THEN 'chemistry'
    WHEN p_title_ar ILIKE '%أساسيات%' OR p_title_ar ILIKE '%اساسيات%' THEN 'basics'
    ELSE 'course'
  END;
  
  -- Build base slug
  IF v_lang_track != '' THEN
    v_base_slug := v_grade_slug || '-' || v_subject_slug || '-' || v_lang_track;
  ELSE
    v_base_slug := v_grade_slug || '-' || v_subject_slug;
  END IF;
  
  -- Ensure max 60 characters
  v_base_slug := LEFT(v_base_slug, 60);
  v_slug := v_base_slug;
  
  -- Check for uniqueness and append counter if needed
  WHILE EXISTS (
    SELECT 1 FROM public.courses 
    WHERE slug = v_slug 
    AND (p_course_id IS NULL OR id != p_course_id)
  ) LOOP
    v_counter := v_counter + 1;
    v_slug := v_base_slug || '-' || v_counter;
  END LOOP;
  
  RETURN v_slug;
END;
$$;

-- Trigger function to auto-generate slug on insert/update
CREATE OR REPLACE FUNCTION public.auto_generate_course_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only generate if slug is null or empty
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_course_slug(NEW.title_ar, NEW.grade, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for auto slug generation
DROP TRIGGER IF EXISTS trigger_auto_generate_course_slug ON public.courses;
CREATE TRIGGER trigger_auto_generate_course_slug
  BEFORE INSERT OR UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_course_slug();

-- Generate slugs for existing courses
UPDATE public.courses
SET slug = generate_course_slug(title_ar, grade, id)
WHERE slug IS NULL;