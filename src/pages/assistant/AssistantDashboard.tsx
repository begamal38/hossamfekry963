import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Users, BookOpen, CreditCard, TrendingUp, Clock, CheckCircle } from 'lucide-react';
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
}

export default function AssistantDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { canAccessDashboard, loading: roleLoading } = useUserRole();
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalEnrollments: 0,
    pendingEnrollments: 0,
    activeEnrollments: 0,
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
        // Fetch total students
        const { count: studentsCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Fetch enrollments stats
        const { data: enrollments } = await supabase
          .from('course_enrollments')
          .select('status');

        const totalEnrollments = enrollments?.length || 0;
        const pendingEnrollments = enrollments?.filter(e => e.status === 'pending').length || 0;
        const activeEnrollments = enrollments?.filter(e => e.status === 'active').length || 0;

        setStats({
          totalStudents: studentsCount || 0,
          totalEnrollments,
          pendingEnrollments,
          activeEnrollments,
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
      title: isRTL ? 'إجمالي الاشتراكات' : 'Total Enrollments',
      value: stats.totalEnrollments,
      icon: TrendingUp,
      color: 'bg-accent/10 text-accent',
      link: '/assistant/enrollments',
    },
  ];

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            {isRTL ? 'لوحة تحكم المدرس المساعد' : 'Assistant Teacher Dashboard'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isRTL ? 'مرحباً بك في لوحة التحكم' : 'Welcome to your dashboard'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <Link
              key={index}
              to={stat.link}
              className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-primary/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">{stat.title}</p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    {loading ? '...' : stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            {isRTL ? 'إجراءات سريعة' : 'Quick Actions'}
          </h2>
          <div className="flex flex-wrap gap-4">
            <Button asChild>
              <Link to="/assistant/students">
                <Users className="h-4 w-4 me-2" />
                {isRTL ? 'إدارة الطلاب' : 'Manage Students'}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/assistant/enrollments">
                <CreditCard className="h-4 w-4 me-2" />
                {isRTL ? 'إدارة الاشتراكات' : 'Manage Enrollments'}
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
