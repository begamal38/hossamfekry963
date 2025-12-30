-- Create storage bucket for course thumbnails
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('course-thumbnails', 'course-thumbnails', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view course thumbnails (public bucket)
CREATE POLICY "Course thumbnails are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-thumbnails');

-- Allow assistant teachers and admins to upload course thumbnails
CREATE POLICY "Staff can upload course thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-thumbnails' 
  AND (
    public.has_role(auth.uid(), 'assistant_teacher'::app_role) 
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Allow staff to update course thumbnails
CREATE POLICY "Staff can update course thumbnails"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'course-thumbnails'
  AND (
    public.has_role(auth.uid(), 'assistant_teacher'::app_role) 
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Allow staff to delete course thumbnails  
CREATE POLICY "Staff can delete course thumbnails"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'course-thumbnails'
  AND (
    public.has_role(auth.uid(), 'assistant_teacher'::app_role) 
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);