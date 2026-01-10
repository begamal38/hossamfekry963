-- Create table for tracking user consent and engagement events
CREATE TABLE public.platform_consent_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'cookie_accepted', 'cookie_declined', 'push_granted', 'push_denied', 'install_shown', 'pwa_installed'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_agent TEXT,
  device_type TEXT -- 'mobile', 'tablet', 'desktop'
);

-- Enable RLS
ALTER TABLE public.platform_consent_events ENABLE ROW LEVEL SECURITY;

-- Allow insert for all users (including anonymous)
CREATE POLICY "Anyone can insert consent events"
ON public.platform_consent_events
FOR INSERT
WITH CHECK (true);

-- Only assistants/admins can read consent events
CREATE POLICY "Assistants can view consent events"
ON public.platform_consent_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'assistant_teacher')
  )
);

-- Add index for querying by event type and date
CREATE INDEX idx_consent_events_type ON public.platform_consent_events(event_type);
CREATE INDEX idx_consent_events_created_at ON public.platform_consent_events(created_at);

-- Enable realtime for admin tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_consent_events;