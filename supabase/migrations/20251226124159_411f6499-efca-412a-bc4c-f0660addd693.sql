-- Add unique constraint to prevent duplicate user_id + role combinations
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_role_unique UNIQUE (user_id, role);