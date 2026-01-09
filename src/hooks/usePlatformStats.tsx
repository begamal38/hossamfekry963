import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PlatformStats {
  totalStudents: number;
  totalLessons: number;
  weeklyViews: number;
  loading: boolean;
}

// Cache for stats to avoid repeated queries
let statsCache: { data: Omit<PlatformStats, 'loading'>; timestamp: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const usePlatformStats = (): PlatformStats => {
  const [stats, setStats] = useState<PlatformStats>({
    totalStudents: 0,
    totalLessons: 0,
    weeklyViews: 0,
    loading: true,
  });

  useEffect(() => {
    const fetchStats = async () => {
      // Check cache first
      if (statsCache && Date.now() - statsCache.timestamp < CACHE_TTL_MS) {
        setStats({ ...statsCache.data, loading: false });
        return;
      }

      try {
        // Fetch all stats in parallel
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const [
          { count: studentsCount },
          { count: lessonsCount },
          { count: weeklyViewsCount },
        ] = await Promise.all([
          // Count students with 'student' role
          supabase
            .from('user_roles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'student'),
          
          // Count published lessons
          supabase
            .from('lessons')
            .select('*', { count: 'exact', head: true }),
          
          // Count focus sessions in last week (represents engaged views)
          supabase
            .from('focus_sessions')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', oneWeekAgo.toISOString()),
        ]);

        const newStats = {
          totalStudents: studentsCount || 0,
          totalLessons: lessonsCount || 0,
          weeklyViews: weeklyViewsCount || 0,
        };

        // Update cache
        statsCache = { data: newStats, timestamp: Date.now() };
        
        setStats({ ...newStats, loading: false });
      } catch (error) {
        console.error('Error fetching platform stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, []);

  return stats;
};
