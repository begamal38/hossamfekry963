import React, { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';

interface StudyStreakCardProps {
  isArabic: boolean;
}

export const StudyStreakCard: React.FC<StudyStreakCardProps> = ({ isArabic }) => {
  const { user } = useAuth();
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchStreak = async () => {
      // Get attendance dates for this user, ordered desc
      const { data } = await supabase
        .from('lesson_attendance')
        .select('attended_at')
        .eq('user_id', user.id)
        .order('attended_at', { ascending: false });

      if (!data || data.length === 0) {
        setStreak(0);
        return;
      }

      // Get unique dates
      const uniqueDates = [...new Set(
        data.map(d => new Date(d.attended_at).toDateString())
      )];

      // Count consecutive days from today/yesterday
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let count = 0;
      let checkDate = new Date(today);

      // Allow starting from today or yesterday
      const firstDate = new Date(uniqueDates[0]);
      firstDate.setHours(0, 0, 0, 0);
      
      const diffFromToday = Math.floor((today.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffFromToday > 1) {
        setStreak(0);
        return;
      }
      
      if (diffFromToday === 1) {
        checkDate.setDate(checkDate.getDate() - 1);
      }

      for (const dateStr of uniqueDates) {
        const d = new Date(dateStr);
        d.setHours(0, 0, 0, 0);
        if (d.getTime() === checkDate.getTime()) {
          count++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (d.getTime() < checkDate.getTime()) {
          break;
        }
      }

      setStreak(count);
    };

    fetchStreak();
  }, [user]);

  if (streak === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20"
    >
      <Flame className="w-5 h-5 text-orange-500" />
      <span className="text-sm font-bold text-orange-600 dark:text-orange-400 tabular-nums">
        {streak}
      </span>
      <span className="text-xs text-muted-foreground">
        {isArabic
          ? (streak === 1 ? 'يوم متواصل' : 'أيام متواصلة')
          : (streak === 1 ? 'day streak' : 'day streak')}
      </span>
    </motion.div>
  );
};
