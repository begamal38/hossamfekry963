-- Add RLS policies for assistant teachers to manage courses
CREATE POLICY "Assistant teachers can insert courses"
ON public.courses
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'assistant_teacher'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Assistant teachers can update courses"
ON public.courses
FOR UPDATE
USING (has_role(auth.uid(), 'assistant_teacher'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Assistant teachers can delete courses"
ON public.courses
FOR DELETE
USING (has_role(auth.uid(), 'assistant_teacher'::app_role) OR has_role(auth.uid(), 'admin'::app_role));