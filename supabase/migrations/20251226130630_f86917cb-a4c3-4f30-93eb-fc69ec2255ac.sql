-- Add missing foreign key constraints (checking if they exist first)

-- 1. Add foreign key from user_roles to auth.users (with CASCADE DELETE)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_roles_user_id_fkey'
  ) THEN
    ALTER TABLE public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- 2. Add foreign key from notification_reads to auth.users (with CASCADE DELETE)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'notification_reads_user_id_fkey'
  ) THEN
    ALTER TABLE public.notification_reads
    ADD CONSTRAINT notification_reads_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- 3. Ensure profiles.user_id is unique (one profile per user)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_user_id_unique'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
  END IF;
END $$;