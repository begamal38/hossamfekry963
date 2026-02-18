import React from 'react';
import { Trophy, Zap, Target, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import type { StudentBehaviorMetrics } from '@/hooks/useStudentBehavior';

interface AchievementBadgesProps {
  metrics: StudentBehaviorMetrics;
  isArabic: boolean;
}

interface Badge {
  icon: React.ElementType;
  label: string;
  labelAr: string;
  color: string;
  bg: string;
  earned: boolean;
}

export const AchievementBadges: React.FC<AchievementBadgesProps> = ({ metrics, isArabic }) => {
  const badges: Badge[] = [
    {
      icon: Star,
      label: 'Top Performer',
      labelAr: 'متفوق',
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      earned: metrics.avgExamScore >= 85,
    },
    {
      icon: Zap,
      label: 'Consistent Learner',
      labelAr: 'منتظم',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      earned: metrics.totalFocusSessions >= 10,
    },
    {
      icon: Target,
      label: 'Exam Master',
      labelAr: 'محترف الامتحانات',
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      earned: metrics.examAttempts >= 5 && metrics.avgExamScore >= 70,
    },
    {
      icon: Trophy,
      label: 'Dedicated',
      labelAr: 'مجتهد',
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      earned: metrics.totalFocusMinutes >= 300,
    },
  ];

  const earnedBadges = badges.filter(b => b.earned);
  if (earnedBadges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {earnedBadges.map((badge, i) => {
        const Icon = badge.icon;
        return (
          <motion.div
            key={badge.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${badge.bg} border border-border/30`}
          >
            <Icon className={`w-3.5 h-3.5 ${badge.color}`} />
            <span className="text-[11px] font-medium text-foreground">
              {isArabic ? badge.labelAr : badge.label}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
};
