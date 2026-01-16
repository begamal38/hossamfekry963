-- Create top_students table for displaying top students on homepage
CREATE TABLE public.top_students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name_ar TEXT NOT NULL,
  student_name_en TEXT NOT NULL,
  display_month TEXT NOT NULL, -- e.g., "November 2024"
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.top_students ENABLE ROW LEVEL SECURITY;

-- Public can read active top students (for homepage display)
CREATE POLICY "Anyone can view active top students"
ON public.top_students
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Only staff can manage top students
CREATE POLICY "Staff can manage top students"
ON public.top_students
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'assistant_teacher')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'assistant_teacher')
  )
);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.top_students;

-- Create trigger for updated_at
CREATE TRIGGER update_top_students_updated_at
BEFORE UPDATE ON public.top_students
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();