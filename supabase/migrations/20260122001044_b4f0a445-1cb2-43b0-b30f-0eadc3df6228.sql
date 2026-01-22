-- Create center_group_transfers table for tracking all group transfers as events
CREATE TABLE public.center_group_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  previous_group_id uuid REFERENCES public.center_groups(id) ON DELETE SET NULL,
  new_group_id uuid NOT NULL REFERENCES public.center_groups(id) ON DELETE CASCADE,
  performed_by uuid NOT NULL,
  reason text,
  transferred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add index for quick lookups
CREATE INDEX idx_center_group_transfers_student_id ON public.center_group_transfers(student_id);
CREATE INDEX idx_center_group_transfers_new_group_id ON public.center_group_transfers(new_group_id);
CREATE INDEX idx_center_group_transfers_transferred_at ON public.center_group_transfers(transferred_at);

-- Enable RLS
ALTER TABLE public.center_group_transfers ENABLE ROW LEVEL SECURITY;

-- Only admins and assistant teachers can view transfer history
CREATE POLICY "Staff can view transfer history" ON public.center_group_transfers
  FOR SELECT USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'assistant_teacher')
  );

-- Only admins and assistant teachers can create transfers
CREATE POLICY "Staff can create transfers" ON public.center_group_transfers
  FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'assistant_teacher')
  );

-- Add comment for documentation
COMMENT ON TABLE public.center_group_transfers IS 'Event log for student group transfers - preserves history for reporting';