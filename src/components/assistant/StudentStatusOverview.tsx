import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserPlus, AlertTriangle, Moon, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

interface StatusCounts {
  new: number;
  active: number;
  at_risk: number;
  dormant: number;
}

interface StudentStatusOverviewProps {
  isRTL: boolean;
}

export const StudentStatusOverview: React.FC<StudentStatusOverviewProps> = ({ isRTL }) => {
  const [counts, setCounts] = useState<StatusCounts>({ new: 0, active: 0, at_risk: 0, dormant: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const now = new Date();
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

        // Get all students
        const { data: students } = await supabase
          .from('profiles')
          .select('user_id, created_at')
          .in('user_id', (
            await supabase.from('user_roles').select('user_id').eq('role', 'student')
          ).data?.map(r => r.user_id) || []);

        if (!students || students.length === 0) {
          setLoading(false);
          return;
        }

        // Get latest focus session per student
        const { data: focusSessions } = await supabase
          .from('focus_sessions')
          .select('user_id, started_at')
          .order('started_at', { ascending: false });

        // Build last-activity map
        const lastActivity: Record<string, string> = {};
        (focusSessions || []).forEach(s => {
          if (!lastActivity[s.user_id]) {
            lastActivity[s.user_id] = s.started_at;
          }
        });

        const result: StatusCounts = { new: 0, active: 0, at_risk: 0, dormant: 0 };

        students.forEach(s => {
          const accountAge = (now.getTime() - new Date(s.created_at).getTime()) / (1000 * 60 * 60 * 24);
          
          if (accountAge < 3) {
            result.new++;
            return;
          }

          const lastAct = lastActivity[s.user_id];
          if (!lastAct) {
            result.dormant++;
            return;
          }

          const daysSince = (now.getTime() - new Date(lastAct).getTime()) / (1000 * 60 * 60 * 24);

          if (daysSince >= 14) result.dormant++;
          else if (daysSince >= 7) result.at_risk++;
          else result.active++;
        });

        setCounts(result);
      } catch (err) {
        console.error('StudentStatusOverview error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  const statuses = [
    { key: 'new', icon: UserPlus, label: isRTL ? 'جديد' : 'New', count: counts.new, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { key: 'active', icon: Zap, label: isRTL ? 'نشط' : 'Active', count: counts.active, color: 'text-green-500', bg: 'bg-green-500/10' },
    { key: 'at_risk', icon: AlertTriangle, label: isRTL ? 'معرّض' : 'At Risk', count: counts.at_risk, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { key: 'dormant', icon: Moon, label: isRTL ? 'خامل' : 'Dormant', count: counts.dormant, color: 'text-red-500', bg: 'bg-red-500/10' },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-16 rounded-xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {statuses.map((s, i) => {
        const Icon = s.icon;
        return (
          <motion.div
            key={s.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link
              to="/assistant/students"
              className={`flex flex-col items-center gap-1 p-2.5 rounded-xl ${s.bg} hover:opacity-80 transition-opacity`}
            >
              <Icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-base font-bold text-foreground tabular-nums">{s.count}</span>
              <span className="text-[10px] text-muted-foreground">{s.label}</span>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
};
