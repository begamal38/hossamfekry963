-- Add a short sequential ID to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS short_id SERIAL;

-- Create unique index on short_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_short_id ON public.profiles(short_id);

-- Create function to get user_id by short_id
CREATE OR REPLACE FUNCTION public.get_user_id_by_short_id(p_short_id integer)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id FROM public.profiles WHERE short_id = p_short_id LIMIT 1;
$$;