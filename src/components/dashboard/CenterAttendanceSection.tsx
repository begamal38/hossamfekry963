import React, { useEffect, useState } from 'react';
import { MapPin, Calendar, CheckCircle, XCircle, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import ar from 'date-fns/locale/ar';

interface AttendanceRecord {
  id: string;
  status: string;
  session: {
    session_date: string;
    session_time: string;
    group: {
      name: string;
    };
  };
}

interface CenterGroupMembership {
  id: string;
  group: {
    id: string;
    name: string;
    days_of_week: string[];
    time_slot: string;
  };
}

interface CenterAttendanceSectionProps {
  isArabic: boolean;
}

export const CenterAttendanceSection: React.FC<CenterAttendanceSectionProps> = ({ isArabic }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [groupMembership, setGroupMembership] = useState<CenterGroupMembership | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState({ present: 0, absent: 0, total: 0 });

  useEffect(() => {
    if (!user) return;
    fetchAttendanceData();
  }, [user]);

  const fetchAttendanceData = async () => {
    if (!user) return;

    try {
      // Fetch group membership
      const { data: membership, error: membershipError } = await supabase
        .from('center_group_members')
        .select(`
          id,
          group:center_groups(id, name, days_of_week, time_slot)
        `)
        .eq('student_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (membershipError) throw membershipError;
      setGroupMembership(membership as unknown as CenterGroupMembership);

      // Fetch attendance records
      const { data: attendance, error: attendanceError } = await supabase
        .from('center_session_attendance')
        .select(`
          id,
          status,
          session:center_sessions(
            session_date,
            session_time,
            group:center_groups(name)
          )
        `)
        .eq('student_id', user.id)
        .order('marked_at', { ascending: false })
        .limit(10);

      if (attendanceError) throw attendanceError;
      setAttendanceRecords(attendance as unknown as AttendanceRecord[]);

      // Calculate stats
      const { data: allAttendance, error: statsError } = await supabase
        .from('center_session_attendance')
        .select('status')
        .eq('student_id', user.id);

      if (statsError) throw statsError;

      const presentCount = (allAttendance || []).filter((a) => a.status === 'present').length;
      const absentCount = (allAttendance || []).filter((a) => a.status === 'absent').length;
      setStats({
        present: presentCount,
        absent: absentCount,
        total: presentCount + absentCount,
      });
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysLabel = (days: string[]) => {
    const dayLabels: Record<string, { ar: string; en: string }> = {
      saturday: { ar: 'السبت', en: 'Sat' },
      sunday: { ar: 'الأحد', en: 'Sun' },
      monday: { ar: 'الاثنين', en: 'Mon' },
      tuesday: { ar: 'الثلاثاء', en: 'Tue' },
      wednesday: { ar: 'الأربعاء', en: 'Wed' },
      thursday: { ar: 'الخميس', en: 'Thu' },
      friday: { ar: 'الجمعة', en: 'Fri' },
    };

    return days.map((d) => (isArabic ? dayLabels[d]?.ar : dayLabels[d]?.en) || d).join(' - ');
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-20 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const attendanceRate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

  return (
    <section className="bg-card rounded-xl border border-border p-6">
      <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-primary" />
        {isArabic ? 'حضور السنتر' : 'Center Attendance'}
      </h2>

      {/* Group Membership */}
      {groupMembership?.group ? (
        <div className="bg-primary/5 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">{isArabic ? 'مجموعتك' : 'Your Group'}</span>
            <Badge variant="outline">{groupMembership.group.name}</Badge>
          </div>
          <div className="text-sm text-muted-foreground flex flex-wrap gap-3">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {getDaysLabel(groupMembership.group.days_of_week)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {groupMembership.group.time_slot}
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-muted/50 rounded-lg p-4 mb-6 text-center text-muted-foreground">
          {isArabic ? 'لم يتم تعيينك في مجموعة سنتر بعد' : 'You are not assigned to a center group yet'}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-500/10 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.present}</div>
          <div className="text-xs text-muted-foreground">{isArabic ? 'حاضر' : 'Present'}</div>
        </div>
        <div className="bg-red-500/10 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
          <div className="text-xs text-muted-foreground">{isArabic ? 'غائب' : 'Absent'}</div>
        </div>
        <div className="bg-primary/10 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-primary">{attendanceRate}%</div>
          <div className="text-xs text-muted-foreground">{isArabic ? 'نسبة الحضور' : 'Rate'}</div>
        </div>
      </div>

      {/* Recent Attendance */}
      <h3 className="font-medium mb-3">{isArabic ? 'آخر سجلات الحضور' : 'Recent Attendance'}</h3>
      {attendanceRecords.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-4">
          {isArabic ? 'لا توجد سجلات حضور' : 'No attendance records yet'}
        </p>
      ) : (
        <div className="space-y-2">
          {attendanceRecords.map((record) => (
            <div key={record.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <p className="text-sm font-medium">
                  {format(new Date(record.session.session_date), 'EEEE, d MMM', {
                    locale: isArabic ? ar : undefined,
                  })}
                </p>
                <p className="text-xs text-muted-foreground">{record.session.group.name}</p>
              </div>
              {record.status === 'present' ? (
                <Badge className="bg-green-500/10 text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {isArabic ? 'حاضر' : 'Present'}
                </Badge>
              ) : (
                <Badge className="bg-red-500/10 text-red-600">
                  <XCircle className="h-3 w-3 mr-1" />
                  {isArabic ? 'غائب' : 'Absent'}
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
