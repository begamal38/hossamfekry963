-- Allow assistant teachers to create conversations with students
CREATE POLICY "Assistant teachers can create conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = assistant_teacher_id);