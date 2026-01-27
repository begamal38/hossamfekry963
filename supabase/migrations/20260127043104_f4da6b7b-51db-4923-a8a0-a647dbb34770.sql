-- =========================================
-- PROFILE COMPLETION DEBUG LOGGING TABLE
-- For internal admin debugging only
-- =========================================

CREATE TABLE IF NOT EXISTS public.profile_completion_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  attempted_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  validation_result JSONB NOT NULL DEFAULT '{}'::jsonb,
  write_result TEXT NOT NULL CHECK (write_result IN ('success', 'failed', 'rollback')),
  failure_reason TEXT,
  failure_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for efficient lookups
CREATE INDEX idx_profile_completion_logs_user_id ON public.profile_completion_logs(user_id);
CREATE INDEX idx_profile_completion_logs_created_at ON public.profile_completion_logs(created_at DESC);
CREATE INDEX idx_profile_completion_logs_write_result ON public.profile_completion_logs(write_result) WHERE write_result = 'failed';

-- Enable RLS - admins only
ALTER TABLE public.profile_completion_logs ENABLE ROW LEVEL SECURITY;

-- Only admin/assistant_teacher can view logs
CREATE POLICY "Admin and assistants can view completion logs"
ON public.profile_completion_logs
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'assistant_teacher')
);

-- Allow inserts from authenticated users (for their own logs)
-- Service role will handle all inserts
CREATE POLICY "Users can insert their own completion logs"
ON public.profile_completion_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON TABLE public.profile_completion_logs IS 'Internal debug log for profile completion attempts. Not visible to students. Used for admin diagnostics.';
COMMENT ON COLUMN public.profile_completion_logs.attempted_payload IS 'The data the student tried to save';
COMMENT ON COLUMN public.profile_completion_logs.validation_result IS 'Result of validation checks before save';
COMMENT ON COLUMN public.profile_completion_logs.write_result IS 'success, failed, or rollback';
COMMENT ON COLUMN public.profile_completion_logs.failure_reason IS 'Human-readable failure reason';
COMMENT ON COLUMN public.profile_completion_logs.failure_details IS 'Technical error details for debugging';