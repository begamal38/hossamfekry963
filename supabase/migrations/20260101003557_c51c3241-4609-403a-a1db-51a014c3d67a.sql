-- Improve slug generation with better Arabic-to-English mapping
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
    WHEN p_grade = 'second_languages' THEN 'grade-11-lang'
    WHEN p_grade = 'second_arabic' THEN 'grade-11-ar'
    WHEN p_grade = 'third_languages' THEN 'grade-12-lang'
    WHEN p_grade = 'third_arabic' THEN 'grade-12-ar'
    WHEN p_grade ILIKE '%ثانية%' OR p_grade ILIKE '%تانية%' THEN 'grade-11'
    WHEN p_grade ILIKE '%ثالثة%' OR p_grade ILIKE '%تالتة%' THEN 'grade-12'
    WHEN p_grade ILIKE '%أولى%' OR p_grade ILIKE '%اولى%' THEN 'grade-10'
    ELSE 'course'
  END;
  
  -- Detect language track from title only if not already in grade
  IF v_grade_slug NOT LIKE '%lang%' AND v_grade_slug NOT LIKE '%ar%' THEN
    v_lang_track := CASE 
      WHEN p_title_ar ILIKE '%لغات%' THEN '-lang'
      WHEN p_title_ar ILIKE '%عربي%' THEN '-ar'
      ELSE ''
    END;
  ELSE
    v_lang_track := '';
  END IF;
  
  -- Map subject/content type from title
  v_subject_slug := CASE 
    WHEN p_title_ar ILIKE '%كيمياء%' THEN '-chemistry'
    WHEN p_title_ar ILIKE '%أساسيات%' OR p_title_ar ILIKE '%اساسيات%' THEN '-basics'
    WHEN p_title_ar ILIKE '%مراجعة%' THEN '-review'
    WHEN p_title_ar ILIKE '%كامل%' THEN '-full'
    ELSE ''
  END;
  
  -- Build base slug: grade + subject + lang
  v_base_slug := v_grade_slug || v_subject_slug || v_lang_track;
  
  -- Remove any double dashes
  v_base_slug := regexp_replace(v_base_slug, '-+', '-', 'g');
  v_base_slug := trim(both '-' from v_base_slug);
  
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

-- Regenerate slugs for all courses with better mappings
UPDATE public.courses
SET slug = generate_course_slug(title_ar, grade, id);