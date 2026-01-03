-- Drop the overly permissive policy for assistant teachers
DROP POLICY IF EXISTS "Assistants can view all devices" ON public.user_devices;

-- Create a more restrictive policy: assistants can only view devices of their assigned students
CREATE POLICY "Assistants can view assigned student devices" 
ON public.user_devices 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin')
  OR (
    has_role(auth.uid(), 'assistant_teacher')
    AND can_assistant_view_student(auth.uid(), user_id)
  )
);