-- Remove the overly permissive DELETE policy that allows anyone to delete any enrollment
DROP POLICY IF EXISTS "Service role can delete enrollments" ON course_enrollments;