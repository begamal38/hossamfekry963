
-- Update handle_new_user trigger to set study_mode_confirmed = true 
-- when attendance_mode is explicitly provided during signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    full_name, 
    phone, 
    grade, 
    academic_year, 
    language_track, 
    email, 
    governorate,
    attendance_mode,
    study_mode_confirmed
  )
  VALUES (
    new.id, 
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'grade',
    new.raw_user_meta_data ->> 'academic_year',
    new.raw_user_meta_data ->> 'language_track',
    new.email,
    new.raw_user_meta_data ->> 'governorate',
    -- CRITICAL: Cast to attendance_mode enum, but DO NOT default to 'online'
    -- If metadata doesn't have attendance_mode, store NULL to force ProfileCompletionPrompt
    CASE 
      WHEN new.raw_user_meta_data ->> 'attendance_mode' IS NOT NULL 
      THEN (new.raw_user_meta_data ->> 'attendance_mode')::attendance_mode
      ELSE NULL
    END,
    -- CRITICAL FIX: Set study_mode_confirmed = true ONLY when attendance_mode was explicitly provided
    -- This prevents the ProfileCompletionPrompt from appearing for users who already selected their mode
    CASE 
      WHEN new.raw_user_meta_data ->> 'attendance_mode' IS NOT NULL 
      THEN true
      ELSE false
    END
  );
  
  -- Assign default 'student' role to new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'student');
  
  RETURN new;
END;
$$;
