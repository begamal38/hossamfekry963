-- Create enum for attendance mode
CREATE TYPE public.attendance_mode AS ENUM ('online', 'center', 'hybrid');

-- Create enum for attendance type (how they attended a specific lesson)
CREATE TYPE public.attendance_type AS ENUM ('center', 'online');

-- Add attendance_mode to profiles
ALTER TABLE public.profiles 
ADD COLUMN attendance_mode public.attendance_mode NOT NULL DEFAULT 'online';

-- Add attendance_type to lesson_attendance
ALTER TABLE public.lesson_attendance 
ADD COLUMN attendance_type public.attendance_type NOT NULL DEFAULT 'center';

-- Add unique constraint to prevent duplicate attendance records
ALTER TABLE public.lesson_attendance 
ADD CONSTRAINT unique_lesson_attendance UNIQUE (user_id, lesson_id, attendance_type);