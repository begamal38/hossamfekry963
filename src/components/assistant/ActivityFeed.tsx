import React, { useEffect, useState } from 'react';
import { CheckCircle, FileText, UserPlus, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ActivityItem {
  id: string;
  type: 'exam_submitted' | 'lesson_completed' | 'enrollment';
  studentName: string;
  detail: string;
  timestamp: string;
}

interface ActivityFeedProps {
  isRTL: boolean;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ isRTL }) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const now = new Date();
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();

        // Fetch recent exam attempts
        const { data: exams } = await supabase
          .from('exam_attempts')
          .select('id, score, total_questions, completed_at, user_id, exams:exam_id(title_ar)')
          .eq('is_completed', true)
          .gte('completed_at', threeDaysAgo)
          .order('completed_at', { ascending: false })
          .limit(5);

        // Fetch recent lesson completions
        const { data: completions } = await supabase
          .from('lesson_completions')
          .select('id, completed_at, user_id, lessons:lesson_id(title_ar)')
          .gte('completed_at', threeDaysAgo)
          .order('completed_at', { ascending: false })
          .limit(5);

        // Fetch recent enrollments
        const { data: enrollments } = await supabase
          .from('course_enrollments')
          .select('id, enrolled_at, user_id, courses:course_id(title_ar)')
          .gte('enrolled_at', threeDaysAgo)
          .order('enrolled_at', { ascending: false })
          .limit(5);

        // Collect all user IDs
        const userIds = new Set<string>();
        (exams || []).forEach(e => userIds.add(e.user_id));
        (completions || []).forEach(c => userIds.add(c.user_id));
        (enrollments || []).forEach(e => userIds.add(e.user_id));

        // Fetch names
        let nameMap: Record<string, string> = {};
        if (userIds.size > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, full_name')
            .in('user_id', Array.from(userIds));
          
          (profiles || []).forEach(p => {
            nameMap[p.user_id] = p.full_name?.split(' ')[0] || '—';
          });
        }

        const items: ActivityItem[] = [];

        (exams || []).forEach(e => {
          items.push({
            id: `exam-${e.id}`,
            type: 'exam_submitted',
            studentName: nameMap[e.user_id] || '—',
            detail: (e.exams as any)?.title_ar || '',
            timestamp: e.completed_at || '',
          });
        });

        (completions || []).forEach(c => {
          items.push({
            id: `lesson-${c.id}`,
            type: 'lesson_completed',
            studentName: nameMap[c.user_id] || '—',
            detail: (c.lessons as any)?.title_ar || '',
            timestamp: c.completed_at,
          });
        });

        (enrollments || []).forEach(e => {
          items.push({
            id: `enroll-${e.id}`,
            type: 'enrollment',
            studentName: nameMap[e.user_id] || '—',
            detail: (e.courses as any)?.title_ar || '',
            timestamp: e.enrolled_at,
          });
        });

        // Sort by time desc
        items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setActivities(items.slice(0, 8));
      } catch (err) {
        console.error('ActivityFeed error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, []);

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'exam_submitted': return FileText;
      case 'lesson_completed': return CheckCircle;
      case 'enrollment': return UserPlus;
    }
  };

  const getColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'exam_submitted': return 'text-purple-500';
      case 'lesson_completed': return 'text-green-500';
      case 'enrollment': return 'text-blue-500';
    }
  };

  const getLabel = (type: ActivityItem['type']) => {
    if (isRTL) {
      switch (type) {
        case 'exam_submitted': return 'خلّص امتحان';
        case 'lesson_completed': return 'كمّل حصة';
        case 'enrollment': return 'اشترك في';
      }
    }
    switch (type) {
      case 'exam_submitted': return 'completed exam';
      case 'lesson_completed': return 'finished lesson';
      case 'enrollment': return 'enrolled in';
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 bg-muted/50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-6">
        <Clock className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">
          {isRTL ? 'مفيش نشاط جديد' : 'No recent activity'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {activities.map((item, i) => {
        const Icon = getIcon(item.type);
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: isRTL ? 12 : -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center bg-muted/70 flex-shrink-0`}>
              <Icon className={`w-3.5 h-3.5 ${getColor(item.type)}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-foreground truncate">
                <span className="font-semibold">{item.studentName}</span>
                {' '}{getLabel(item.type)}{' '}
                <span className="text-muted-foreground">{item.detail}</span>
              </p>
            </div>
            <span className="text-[10px] text-muted-foreground flex-shrink-0 tabular-nums">
              {item.timestamp && formatDistanceToNow(new Date(item.timestamp), {
                addSuffix: false,
                locale: isRTL ? ar : undefined,
              })}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
};
