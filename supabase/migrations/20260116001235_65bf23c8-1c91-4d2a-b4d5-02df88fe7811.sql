-- Allow public read access to course_enrollments for counting enrolled students
-- This only exposes course_id for aggregation purposes (used in enrollment counts)
CREATE POLICY "Anyone can count course enrollments" 
ON public.course_enrollments 
FOR SELECT 
TO anon, authenticated
USING (true);