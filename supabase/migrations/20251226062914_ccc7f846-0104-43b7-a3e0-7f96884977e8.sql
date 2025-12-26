-- Remove the id column and make user_id the primary key
-- First, drop the existing primary key constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey;

-- Drop the id column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS id;

-- Add primary key constraint on user_id
ALTER TABLE public.profiles ADD PRIMARY KEY (user_id);