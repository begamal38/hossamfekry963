-- Fix the trigger to allow INITIAL setting of attendance_mode (when OLD.attendance_mode is NULL)
-- This is critical for new students completing their profile after Google signup
CREATE OR REPLACE FUNCTION public.prevent_student_attendance_mode_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- If attendance_mode is being changed
  IF OLD.attendance_mode IS DISTINCT FROM NEW.attendance_mode THEN
    -- ALLOW if this is the INITIAL setting (OLD was NULL, NEW is not NULL)
    -- This is required for profile completion after Google signup
    IF OLD.attendance_mode IS NULL AND NEW.attendance_mode IS NOT NULL THEN
      -- Allow the change - this is first-time setup
      RETURN NEW;
    END IF;
    
    -- Check if the current user is an assistant teacher or admin
    IF NOT (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin')) THEN
      -- Revert the attendance_mode to old value (block student from changing)
      NEW.attendance_mode := OLD.attendance_mode;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;