import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Legacy install page - redirects to the unified /download page
 * This ensures backwards compatibility for any existing links
 */
export default function Install() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the unified download page
    navigate('/download', { replace: true });
  }, [navigate]);

  return null;
}
