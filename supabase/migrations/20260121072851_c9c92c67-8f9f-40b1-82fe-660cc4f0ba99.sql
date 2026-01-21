-- Update handle_new_user trigger to also save attendance_mode
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
    COALESCE((new.raw_user_meta_data ->> 'attendance_mode')::attendance_mode, 'online')
  );
  
  -- Assign default 'student' role to new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'student');
  
  RETURN new;
END;
$function$;