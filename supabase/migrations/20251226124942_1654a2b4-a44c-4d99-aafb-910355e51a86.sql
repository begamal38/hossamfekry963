-- Allow assistant teachers and admins to view all user roles
CREATE POLICY "Assistant teachers can view all roles"
ON public.user_roles
FOR SELECT
USING (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));