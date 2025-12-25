import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Users, BookOpen, CreditCard, TrendingUp, Clock, CheckCircle, Award, ClipboardList, BarChart3, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';

interface Stats {
  totalStudents: number;
  totalEnrollments: number;
  pendingEnrollments: number;
  activeEnrollments: number;
  totalLessons: number;
  totalExams: number;
  totalAttendance: number;
  avgExamScore: number;
}

interface Profile {
  full_name: string | null;
}

export default function AssistantDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { canAccessDashboard, loading: roleLoading } = useUserRole();
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalEnrollments: 0,
    pendingEnrollments: 0,
    activeEnrollments: 0,
    totalLessons: 0,
    totalExams: 0,
    totalAttendance: 0,
    avgExamScore: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!roleLoading && !canAccessDashboard()) {
      navigate('/');
    }
  }, [roleLoading, canAccessDashboard, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user || !canAccessDashboard()) return;

      try {
        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .maybeSingle();
        
        setProfile(profileData);

        // Fetch all stats in parallel
        const [
          { count: studentsCount },
          { data: enrollments },
          { count: lessonsCount },
          { count: examsCount },
          { count: attendanceCount },
          { data: examResults }
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('course_enrollments').select('status'),
          supabase.from('lessons').select('*', { count: 'exact', head: true }),
          supabase.from('exams').select('*', { count: 'exact', head: true }),
          supabase.from('lesson_attendance').select('*', { count: 'exact', head: true }),
          supabase.from('exam_results').select('score, exams:exam_id(max_score)')
        ]);

        const totalEnrollments = enrollments?.length || 0;
        const pendingEnrollments = enrollments?.filter(e => e.status === 'pending').length || 0;
        const activeEnrollments = enrollments?.filter(e => e.status === 'active').length || 0;

        const avgExamScore = (examResults || []).length > 0
          ? Math.round((examResults || []).reduce((sum, r) => {
              const maxScore = (r.exams as any)?.max_score || 100;
              return sum + ((r.score / maxScore) * 100);
            }, 0) / examResults!.length)
          : 0;

        setStats({
          totalStudents: studentsCount || 0,
          totalEnrollments,
          pendingEnrollments,
          activeEnrollments,
          totalLessons: lessonsCount || 0,
          totalExams: examsCount || 0,
          totalAttendance: attendanceCount || 0,
          avgExamScore,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!roleLoading && canAccessDashboard()) {
      fetchStats();
    }
  }, [user, roleLoading, canAccessDashboard]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: isRTL ? 'إجمالي الطلاب' : 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'bg-primary/10 text-primary',
      link: '/assistant/students',
    },
    {
      title: isRTL ? 'الاشتراكات المعلقة' : 'Pending Enrollments',
      value: stats.pendingEnrollments,
      icon: Clock,
      color: 'bg-yellow-500/10 text-yellow-600',
      link: '/assistant/enrollments',
    },
    {
      title: isRTL ? 'الاشتراكات النشطة' : 'Active Enrollments',
      value: stats.activeEnrollments,
      icon: CheckCircle,
      color: 'bg-green-500/10 text-green-600',
      link: '/assistant/enrollments',
    },
    {
      title: isRTL ? 'إجمالي الدروس' : 'Total Lessons',
      value: stats.totalLessons,
      icon: BookOpen,
      color: 'bg-blue-500/10 text-blue-600',
      link: '/assistant/lessons',
    },
    {
      title: isRTL ? 'الامتحانات' : 'Exams',
      value: stats.totalExams,
      icon: Award,
      color: 'bg-purple-500/10 text-purple-600',
      link: '/assistant/grades',
    },
    {
      title: isRTL ? 'الحضور الكلي' : 'Total Attendance',
      value: stats.totalAttendance,
      icon: ClipboardList,
      color: 'bg-accent/10 text-accent',
      link: '/assistant/attendance',
    },
  ];

  const fullName = profile?.full_name || user?.email?.split('@')[0] || '';
  const firstName = fullName.split(' ')[0];

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            {isRTL ? `ازيك يا ${firstName}! 👋` : `Welcome ${firstName}! 👋`}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isRTL ? 'لوحة تحكم المدرس المساعد' : 'Assistant Teacher Dashboard'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {statCards.map((stat, index) => (
            <Link
              key={index}
              to={stat.link}
              className="bg-card border border-border rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:border-primary/50"
            >
              <div className="flex flex-col">
                <div className={`p-2 rounded-lg ${stat.color} w-fit mb-2`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {loading ? '...' : stat.value}
                </p>
                <p className="text-muted-foreground text-xs mt-1">{stat.title}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            {isRTL ? 'إجراءات سريعة' : 'Quick Actions'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button asChild className="h-auto py-4 flex-col gap-2">
              <Link to="/assistant/students">
                <Users className="h-6 w-6" />
                <span>{isRTL ? 'إدارة الطلاب' : 'Manage Students'}</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2">
              <Link to="/assistant/enrollments">
                <CreditCard className="h-6 w-6" />
                <span>{isRTL ? 'إدارة الاشتراكات' : 'Manage Enrollments'}</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2">
              <Link to="/assistant/lessons">
                <BookOpen className="h-6 w-6" />
                <span>{isRTL ? 'إدارة الدروس' : 'Manage Lessons'}</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2">
              <Link to="/assistant/attendance">
                <ClipboardList className="h-6 w-6" />
                <span>{isRTL ? 'تسجيل الحضور' : 'Record Attendance'}</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2">
              <Link to="/assistant/grades">
                <Award className="h-6 w-6" />
                <span>{isRTL ? 'تسجيل الدرجات' : 'Record Grades'}</span>
              </Link>
            </Button>
            <Button variant="secondary" asChild className="h-auto py-4 flex-col gap-2 border-2 border-primary/20">
              <Link to="/assistant/reports">
                <BarChart3 className="h-6 w-6" />
                <span>{isRTL ? 'التقارير والإحصائيات' : 'Reports & Stats'}</span>
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
