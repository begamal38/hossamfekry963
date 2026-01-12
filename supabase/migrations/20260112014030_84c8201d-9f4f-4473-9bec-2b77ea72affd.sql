-- Allow students to see assistant teacher roles (for messaging)
CREATE POLICY "Students can view assistant teacher roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (role = 'assistant_teacher');