-- Add database constraints to profiles table for data validation
-- This ensures validation at database layer, preventing API bypass attacks

-- Add length constraint for full_name (2-100 characters)
ALTER TABLE public.profiles 
  ADD CONSTRAINT full_name_length 
  CHECK (full_name IS NULL OR (char_length(full_name) BETWEEN 2 AND 100));

-- Add format constraint for Egyptian phone numbers
ALTER TABLE public.profiles 
  ADD CONSTRAINT phone_format 
  CHECK (phone IS NULL OR phone ~ '^(\+?20)?0?1[0125][0-9]{8}$');

-- Add enum constraint for grade
ALTER TABLE public.profiles
  ADD CONSTRAINT grade_valid 
  CHECK (grade IS NULL OR grade IN (
    'second_arabic', 'second_languages', 
    'third_arabic', 'third_languages'
  ));