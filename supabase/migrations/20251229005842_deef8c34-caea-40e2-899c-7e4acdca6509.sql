-- Add is_primary column to courses table for 2026 structure normalization
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT false;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_courses_is_primary ON public.courses(is_primary);

-- Update courses matching 2026 structure to be primary
-- This matches courses with grades: second_arabic, second_languages, third_arabic, third_languages
UPDATE public.courses 
SET is_primary = true 
WHERE grade IN ('second_arabic', 'second_languages', 'third_arabic', 'third_languages');

-- Add comment for documentation
COMMENT ON COLUMN public.courses.is_primary IS 'Primary courses are the official 2026 academic courses that appear publicly';