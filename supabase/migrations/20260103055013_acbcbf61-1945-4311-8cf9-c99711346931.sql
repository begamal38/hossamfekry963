-- Create assistant teacher permissions table (explicit export flag)
CREATE TABLE IF NOT EXISTS public.assistant_teacher_permissions (
  user_id uuid PRIMARY KEY,
  can_export_students boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.assistant_teacher_permissions ENABLE ROW LEVEL SECURITY;

-- Admins can manage permissions
CREATE POLICY "Admins can manage assistant export permissions"
ON public.assistant_teacher_permissions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Assistant teachers can read their own permission row
CREATE POLICY "Assistant teachers can view their own export permission"
ON public.assistant_teacher_permissions
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  AND public.has_role(auth.uid(), 'assistant_teacher')
);

-- Keep updated_at current
DROP TRIGGER IF EXISTS update_assistant_teacher_permissions_updated_at ON public.assistant_teacher_permissions;
CREATE TRIGGER update_assistant_teacher_permissions_updated_at
BEFORE UPDATE ON public.assistant_teacher_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
