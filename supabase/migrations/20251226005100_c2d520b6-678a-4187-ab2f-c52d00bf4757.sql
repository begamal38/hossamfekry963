-- Restore Foreign Key Constraints for Data Integrity
-- This ensures referential integrity and automatic cleanup when users are deleted

-- First, delete any orphaned records that don't have valid user references
DELETE FROM public.profiles WHERE user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.course_enrollments WHERE user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.lesson_attendance WHERE user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.exam_results WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Restore foreign key constraints with CASCADE DELETE for proper cleanup
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.course_enrollments 
  ADD CONSTRAINT course_enrollments_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.lesson_attendance 
  ADD CONSTRAINT lesson_attendance_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.exam_results 
  ADD CONSTRAINT exam_results_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;