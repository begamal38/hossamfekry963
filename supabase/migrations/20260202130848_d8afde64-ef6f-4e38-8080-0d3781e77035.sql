-- Create storage bucket for exam question images
INSERT INTO storage.buckets (id, name, public)
VALUES ('exam-images', 'exam-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users (assistant teachers) to upload images
CREATE POLICY "Assistant teachers can upload exam images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'exam-images' 
  AND auth.role() = 'authenticated'
);

-- Allow public read access to exam images
CREATE POLICY "Exam images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'exam-images');

-- Allow uploaders to update their images
CREATE POLICY "Uploaders can update exam images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'exam-images' 
  AND auth.role() = 'authenticated'
);

-- Allow uploaders to delete exam images
CREATE POLICY "Uploaders can delete exam images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'exam-images' 
  AND auth.role() = 'authenticated'
);