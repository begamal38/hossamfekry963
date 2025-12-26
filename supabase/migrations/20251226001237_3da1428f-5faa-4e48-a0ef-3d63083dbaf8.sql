
-- إزالة قيود المفاتيح الأجنبية للسماح ببيانات تجريبية
ALTER TABLE public.course_enrollments DROP CONSTRAINT IF EXISTS course_enrollments_user_id_fkey;
ALTER TABLE public.lesson_attendance DROP CONSTRAINT IF EXISTS lesson_attendance_user_id_fkey;
ALTER TABLE public.exam_results DROP CONSTRAINT IF EXISTS exam_results_user_id_fkey;
