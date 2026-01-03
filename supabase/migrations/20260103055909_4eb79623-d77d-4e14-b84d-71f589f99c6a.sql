-- Create trigger to auto-grant export permission for new assistant teachers
CREATE OR REPLACE FUNCTION public.handle_new_assistant_teacher()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Only for assistant_teacher role
  IF NEW.role = 'assistant_teacher' THEN
    INSERT INTO public.assistant_teacher_permissions (user_id, can_export_students)
    VALUES (NEW.user_id, true)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger on user_roles insert
DROP TRIGGER IF EXISTS on_assistant_teacher_created ON public.user_roles;
CREATE TRIGGER on_assistant_teacher_created
  AFTER INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_assistant_teacher();