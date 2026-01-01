-- Fix: Allow assistant teachers and admins to INSERT enrollments for students
-- This enables manual enrollment by staff

-- Add INSERT policy for staff on course_enrollments
CREATE POLICY "Staff can enroll students"
ON public.course_enrollments
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin')
);

-- Add DELETE policy for staff on course_enrollments (for enrollment management)
CREATE POLICY "Staff can delete enrollments"
ON public.course_enrollments
FOR DELETE
USING (
  has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin')
);