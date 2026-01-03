import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type EntityType = 'lesson' | 'profile';

interface UseShortIdResult {
  uuid: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to resolve a short_id or UUID to an actual UUID
 * Supports backwards compatibility - if given a UUID, returns it directly
 */
export function useShortId(
  id: string | undefined,
  entityType: EntityType
): UseShortIdResult {
  const [uuid, setUuid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const resolve = async () => {
      setLoading(true);
      setError(null);

      // Check if it's already a UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      
      if (isUUID) {
        setUuid(id);
        setLoading(false);
        return;
      }

      // It's a short_id (numeric)
      const shortId = parseInt(id, 10);
      if (isNaN(shortId)) {
        setError('Invalid ID format');
        setLoading(false);
        return;
      }

      try {
        let result: { uuid: string } | null = null;

        if (entityType === 'lesson') {
          const { data, error: dbError } = await supabase
            .from('lessons')
            .select('id')
            .eq('short_id', shortId)
            .maybeSingle();
          
          if (dbError) throw dbError;
          if (data) result = { uuid: data.id };
        } else if (entityType === 'profile') {
          const { data, error: dbError } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('short_id', shortId)
            .maybeSingle();
          
          if (dbError) throw dbError;
          if (data) result = { uuid: data.user_id };
        }

        if (result) {
          setUuid(result.uuid);
        } else {
          setError('Not found');
        }
      } catch (err) {
        console.error(`Error resolving ${entityType} short_id:`, err);
        setError('Failed to resolve ID');
      } finally {
        setLoading(false);
      }
    };

    resolve();
  }, [id, entityType]);

  return { uuid, loading, error };
}

/**
 * Get the short_id for display in URLs
 * Returns short_id if available, otherwise falls back to UUID
 */
export function getShortUrl(shortId: number | null | undefined, uuid: string): string {
  return shortId ? String(shortId) : uuid;
}
