-- Create install_events table to track PWA installations (SSOT for install statistics)
CREATE TABLE public.install_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  device_type TEXT NOT NULL CHECK (device_type IN ('android', 'ios', 'windows', 'macos', 'linux', 'unknown')),
  browser_info TEXT,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.install_events ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (for anonymous tracking)
CREATE POLICY "Anyone can record install events"
ON public.install_events
FOR INSERT
WITH CHECK (true);

-- Policy: Only authenticated users can view aggregated stats (no personal data exposed)
CREATE POLICY "Authenticated users can view own install events"
ON public.install_events
FOR SELECT
USING (auth.uid() = user_id);

-- Create index for efficient aggregation queries
CREATE INDEX idx_install_events_device_type ON public.install_events(device_type);
CREATE INDEX idx_install_events_created_at ON public.install_events(created_at);

-- Create function to get install statistics (public, aggregated only)
CREATE OR REPLACE FUNCTION public.get_install_statistics()
RETURNS TABLE (
  total_installs BIGINT,
  android_installs BIGINT,
  ios_installs BIGINT,
  windows_installs BIGINT,
  macos_installs BIGINT,
  other_installs BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_installs,
    COUNT(*) FILTER (WHERE device_type = 'android')::BIGINT as android_installs,
    COUNT(*) FILTER (WHERE device_type = 'ios')::BIGINT as ios_installs,
    COUNT(*) FILTER (WHERE device_type = 'windows')::BIGINT as windows_installs,
    COUNT(*) FILTER (WHERE device_type = 'macos')::BIGINT as macos_installs,
    COUNT(*) FILTER (WHERE device_type NOT IN ('android', 'ios', 'windows', 'macos'))::BIGINT as other_installs
  FROM public.install_events;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;