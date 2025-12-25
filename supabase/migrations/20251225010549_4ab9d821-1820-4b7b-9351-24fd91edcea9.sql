-- Add academic_year and language_track columns to profiles
-- These will be required for the group-based enrollment system
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS academic_year TEXT,
ADD COLUMN IF NOT EXISTS language_track TEXT;

-- Add check constraints for valid values
ALTER TABLE public.profiles
ADD CONSTRAINT check_academic_year 
CHECK (academic_year IS NULL OR academic_year IN ('second_secondary', 'third_secondary'));

ALTER TABLE public.profiles
ADD CONSTRAINT check_language_track
CHECK (language_track IS NULL OR language_track IN ('arabic', 'languages'));

-- Create an index for efficient filtering by group
CREATE INDEX IF NOT EXISTS idx_profiles_academic_group 
ON public.profiles(academic_year, language_track);

-- Update the handle_new_user function to include academic_year and language_track
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public 
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone, grade, academic_year, language_track)
  VALUES (
    new.id, 
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'grade',
    new.raw_user_meta_data ->> 'academic_year',
    new.raw_user_meta_data ->> 'language_track'
  );
  RETURN new;
END;
$$;