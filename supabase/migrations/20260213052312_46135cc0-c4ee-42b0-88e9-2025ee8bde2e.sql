-- Create storage bucket for lesson infographic images
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson-infographics', 'lesson-infographics', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to infographic images
CREATE POLICY "Infographic images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'lesson-infographics');

-- Allow service role to upload (edge functions use service role key)
CREATE POLICY "Service role can upload infographic images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'lesson-infographics');