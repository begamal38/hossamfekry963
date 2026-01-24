
-- ═══════════════════════════════════════════════════════════════════
-- DATA HYGIENE: Validation trigger to enforce group/attendance_mode consistency
-- Prevents online students from being added to center groups
-- ═══════════════════════════════════════════════════════════════════

-- Create validation function
CREATE OR REPLACE FUNCTION public.validate_center_group_membership()
RETURNS TRIGGER AS $$
BEGIN
  -- Only validate on insert or when is_active is set to true
  IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.is_active = true)) THEN
    -- Check if student's attendance_mode is 'center' or 'hybrid'
    IF NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = NEW.student_id 
      AND attendance_mode IN ('center', 'hybrid')
    ) THEN
      RAISE EXCEPTION 'Cannot add online student to center group. Student must have attendance_mode = center or hybrid.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on center_group_members
DROP TRIGGER IF EXISTS validate_group_membership_trigger ON center_group_members;
CREATE TRIGGER validate_group_membership_trigger
  BEFORE INSERT OR UPDATE ON center_group_members
  FOR EACH ROW
  EXECUTE FUNCTION validate_center_group_membership();

-- ═══════════════════════════════════════════════════════════════════
-- Also add trigger to auto-deactivate group memberships when 
-- a student changes to online mode
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.sync_group_on_mode_change()
RETURNS TRIGGER AS $$
BEGIN
  -- When attendance_mode changes to 'online', deactivate all group memberships
  IF NEW.attendance_mode = 'online' AND OLD.attendance_mode != 'online' THEN
    UPDATE center_group_members 
    SET is_active = false 
    WHERE student_id = NEW.user_id AND is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS sync_group_on_mode_change_trigger ON profiles;
CREATE TRIGGER sync_group_on_mode_change_trigger
  AFTER UPDATE OF attendance_mode ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_group_on_mode_change();
