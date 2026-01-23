-- Remove the default 'online' attendance_mode from handle_new_user trigger
-- This ensures Google signups have NULL attendance_mode and are forced to choose

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    attendance_mode
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
    END
  );
  
  -- Assign default 'student' role to new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'student');
  
  RETURN new;
END;
$function$;

-- Add a comment explaining the change
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates profile and assigns student role. attendance_mode is NULL if not provided - no default to online.';