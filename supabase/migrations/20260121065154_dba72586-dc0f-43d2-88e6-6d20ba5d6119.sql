-- Step 1: Drop old constraint and add new one that accepts both formats temporarily
ALTER TABLE public.profiles DROP CONSTRAINT grade_valid;

ALTER TABLE public.profiles ADD CONSTRAINT grade_valid 
CHECK (grade IS NULL OR grade = ANY (ARRAY['second_secondary', 'third_secondary', 'second_arabic', 'second_languages', 'third_arabic', 'third_languages']));

-- Step 2: Update existing data to use normalized format
UPDATE public.profiles 
SET grade = 'second_secondary' 
WHERE grade IN ('second_arabic', 'second_languages');

UPDATE public.profiles 
SET grade = 'third_secondary' 
WHERE grade IN ('third_arabic', 'third_languages');

-- Step 3: Replace constraint with final strict version
ALTER TABLE public.profiles DROP CONSTRAINT grade_valid;

ALTER TABLE public.profiles ADD CONSTRAINT grade_valid 
CHECK (grade IS NULL OR grade = ANY (ARRAY['second_secondary', 'third_secondary']));