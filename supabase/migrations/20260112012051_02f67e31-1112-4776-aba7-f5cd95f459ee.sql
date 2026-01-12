-- Add Google linking columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS google_email TEXT,
ADD COLUMN IF NOT EXISTS google_linked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS auth_methods TEXT[] DEFAULT ARRAY['password']::TEXT[];

-- Create index for google_id lookups
CREATE INDEX IF NOT EXISTS idx_profiles_google_id ON public.profiles(google_id) WHERE google_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.google_id IS 'Google OAuth subject ID for account linking';
COMMENT ON COLUMN public.profiles.google_email IS 'Email from Google OAuth when linked';
COMMENT ON COLUMN public.profiles.google_linked_at IS 'Timestamp when Google was linked';
COMMENT ON COLUMN public.profiles.auth_methods IS 'Available auth methods: password, google';