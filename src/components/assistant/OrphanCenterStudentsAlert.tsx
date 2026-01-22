/**
 * Orphan Center Students Alert
 * 
 * Displays a warning in the assistant dashboard when there are
 * center students who are not assigned to any group.
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, UserPlus, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface OrphanStudent {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  grade: string | null;
  language_track: string | null;
  short_id: number;
}

const GRADE_LABELS: Record<string, string> = {
  second_secondary: 'تانية ثانوي',
  third_secondary: 'تالته ثانوي',
};

const TRACK_LABELS: Record<string, string> = {
  arabic: 'عربي',
  languages: 'لغات',
};

export function OrphanCenterStudentsAlert() {
  const navigate = useNavigate();
  const [orphanStudents, setOrphanStudents] = useState<OrphanStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchOrphanStudents = async () => {
      try {
        // Find center students without active group membership
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, full_name, phone, grade, language_track, short_id')
          .eq('attendance_mode', 'center')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
          setOrphanStudents([]);
          setLoading(false);
          return;
        }

        // Check which ones have active group membership
        const studentIds = data.map(s => s.user_id);
        const { data: memberships } = await supabase
          .from('center_group_members')
          .select('student_id')
          .in('student_id', studentIds)
          .eq('is_active', true);

        const memberSet = new Set(memberships?.map(m => m.student_id) || []);
        
        // Filter to only those without membership
        const orphans = data.filter(s => !memberSet.has(s.user_id));
        setOrphanStudents(orphans);
      } catch (err) {
        console.error('Error fetching orphan students:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrphanStudents();
  }, []);

  if (loading || orphanStudents.length === 0) {
    return null;
  }

  const displayedStudents = expanded ? orphanStudents : orphanStudents.slice(0, 3);

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-500/20 rounded-lg shrink-0">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-amber-700 dark:text-amber-400 mb-1">
            طلاب سنتر بدون مجموعة ({orphanStudents.length})
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            هؤلاء الطلاب اختاروا الدراسة في السنتر لكن لم يتم تعيينهم لمجموعة بعد
          </p>
          
          <div className="space-y-2">
            {displayedStudents.map((student) => (
              <div
                key={student.user_id}
                className="flex items-center justify-between gap-2 p-2 bg-background/50 rounded-lg"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">
                    {student.full_name || 'بدون اسم'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {GRADE_LABELS[student.grade || ''] || student.grade} - {TRACK_LABELS[student.language_track || ''] || student.language_track}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 gap-1 text-xs"
                  onClick={() => navigate(`/assistant/students/${student.short_id}`)}
                >
                  <UserPlus className="h-3 w-3" />
                  تعيين
                </Button>
              </div>
            ))}
          </div>

          {orphanStudents.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full text-amber-700 hover:text-amber-800 hover:bg-amber-500/10"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4 ml-1" />
                  إخفاء
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 ml-1" />
                  عرض الكل ({orphanStudents.length - 3} آخرين)
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
