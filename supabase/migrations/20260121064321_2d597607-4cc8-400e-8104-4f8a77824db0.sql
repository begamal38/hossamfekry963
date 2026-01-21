-- Add RLS policy to allow viewing active center groups during registration
-- This is needed so students can see available groups before signing up

CREATE POLICY "Anyone can view active center groups for registration"
ON public.center_groups
FOR SELECT
USING (is_active = true);