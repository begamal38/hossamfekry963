-- Create a trigger function that prevents students from modifying their attendance_mode
CREATE OR REPLACE FUNCTION public.prevent_student_attendance_mode_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If attendance_mode is being changed
  IF OLD.attendance_mode IS DISTINCT FROM NEW.attendance_mode THEN
    -- Check if the current user is an assistant teacher or admin
    IF NOT (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin')) THEN
      -- Revert the attendance_mode to old value
      NEW.attendance_mode := OLD.attendance_mode;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS prevent_student_attendance_mode_change_trigger ON public.profiles;
CREATE TRIGGER prevent_student_attendance_mode_change_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_student_attendance_mode_change();

-- Add RLS policy for assistant teachers to update profiles (specifically for attendance_mode)
DROP POLICY IF EXISTS "Assistant teachers can update student attendance_mode" ON public.profiles;
CREATE POLICY "Assistant teachers can update student attendance_mode"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'assistant_teacher'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'assistant_teacher'::app_role) OR has_role(auth.uid(), 'admin'::app_role));