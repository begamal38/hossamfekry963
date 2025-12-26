-- Create notification type enum
CREATE TYPE public.notification_type AS ENUM (
  'course_announcement',
  'lesson_available',
  'lesson_reminder',
  'exam_available',
  'exam_reminder',
  'exam_completed',
  'attendance_center',
  'attendance_online',
  'attendance_followup',
  'system_message'
);

-- Create notification target type enum
CREATE TYPE public.notification_target_type AS ENUM (
  'all',
  'course',
  'lesson',
  'user',
  'grade',
  'attendance_mode'
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  message TEXT NOT NULL,
  message_ar TEXT NOT NULL,
  target_type notification_target_type NOT NULL DEFAULT 'all',
  target_id UUID NULL,
  target_value TEXT NULL,
  course_id UUID NULL REFERENCES public.courses(id) ON DELETE SET NULL,
  lesson_id UUID NULL REFERENCES public.lessons(id) ON DELETE SET NULL,
  exam_id UUID NULL REFERENCES public.exams(id) ON DELETE SET NULL,
  sender_id UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notification reads table (tracks which users read which notifications)
CREATE TABLE public.notification_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(notification_id, user_id)
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

-- Notifications policies
-- Everyone can view notifications (filtering happens in app logic)
CREATE POLICY "Users can view notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only assistants/admins can create notifications
CREATE POLICY "Assistants can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));

-- Only assistants/admins can delete notifications
CREATE POLICY "Assistants can delete notifications"
ON public.notifications
FOR DELETE
USING (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));

-- Notification reads policies
-- Users can view their own reads
CREATE POLICY "Users can view their notification reads"
ON public.notification_reads
FOR SELECT
USING (auth.uid() = user_id);

-- Users can mark notifications as read
CREATE POLICY "Users can mark notifications as read"
ON public.notification_reads
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Assistants can view all reads
CREATE POLICY "Assistants can view all notification reads"
ON public.notification_reads
FOR SELECT
USING (has_role(auth.uid(), 'assistant_teacher') OR has_role(auth.uid(), 'admin'));