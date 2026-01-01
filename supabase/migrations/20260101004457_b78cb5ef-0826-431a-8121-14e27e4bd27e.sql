-- 1. Drop the existing trigger that runs on INSERT OR UPDATE
DROP TRIGGER IF EXISTS trigger_auto_generate_course_slug ON public.courses;

-- 2. Create a new trigger that ONLY runs on INSERT
-- This prevents slug regeneration when course is updated
CREATE TRIGGER trigger_auto_generate_course_slug
  BEFORE INSERT ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_course_slug();

-- 3. Create a validation function to protect slug integrity on updates
CREATE OR REPLACE FUNCTION public.validate_course_slug_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If slug is being changed
  IF OLD.slug IS DISTINCT FROM NEW.slug THEN
    -- Allow if new slug is null/empty (will be regenerated) - but this shouldn't happen on UPDATE
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
      -- Keep the old slug - never allow empty slug on update
      NEW.slug := OLD.slug;
      RETURN NEW;
    END IF;
    
    -- Validate the new slug format
    -- Must be: English lowercase, dash-separated, max 60 chars, no special chars
    IF NEW.slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' THEN
      RAISE EXCEPTION 'Invalid slug format. Must be lowercase English letters, numbers, and dashes only.';
    END IF;
    
    IF LENGTH(NEW.slug) > 60 THEN
      RAISE EXCEPTION 'Slug must be 60 characters or less.';
    END IF;
    
    -- Check for uniqueness
    IF EXISTS (SELECT 1 FROM public.courses WHERE slug = NEW.slug AND id != NEW.id) THEN
      RAISE EXCEPTION 'Slug already exists. Choose a unique slug.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Create trigger for slug validation on UPDATE only
CREATE TRIGGER trigger_validate_course_slug_update
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION validate_course_slug_update();

-- 5. Add a NOT NULL constraint to slug column to ensure it's always present
-- First, ensure all existing courses have slugs (they should, but safety first)
UPDATE public.courses 
SET slug = generate_course_slug(title_ar, grade, id) 
WHERE slug IS NULL OR slug = '';

-- 6. Now add the NOT NULL constraint
ALTER TABLE public.courses ALTER COLUMN slug SET NOT NULL;

-- 7. Add unique constraint on slug for database-level protection
ALTER TABLE public.courses ADD CONSTRAINT courses_slug_unique UNIQUE (slug);