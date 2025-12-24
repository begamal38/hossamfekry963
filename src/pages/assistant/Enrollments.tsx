import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CheckCircle, XCircle, Clock, ArrowLeft, User, BookOpen } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: string;
  enrolled_at: string;
  activated_at: string | null;
  progress: number;
  profile?: {
    full_name: string | null;
    phone: string | null;
  };
  course?: {
    title: string;
    title_ar: string;
  };
}

export default function Enrollments() {
  const { user, loading: authLoading } = useAuth();
  const { canAccessDashboard, loading: roleLoading } = useUserRole();
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updating, setUpdating] = useState<string | null>(null);

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

  const fetchEnrollments = async () => {
    if (!user || !canAccessDashboard()) return;

    try {
      // Fetch enrollments
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select('*')
        .order('enrolled_at', { ascending: false });

      if (enrollmentsError) throw enrollmentsError;

      // Fetch profiles and courses for each enrollment
      const enrichedEnrollments = await Promise.all(
        (enrollmentsData || []).map(async (enrollment) => {
          const [profileRes, courseRes] = await Promise.all([
            supabase.from('profiles').select('full_name, phone').eq('user_id', enrollment.user_id).single(),
            supabase.from('courses').select('title, title_ar').eq('id', enrollment.course_id).single(),
          ]);

          return {
            ...enrollment,
            profile: profileRes.data,
            course: courseRes.data,
          };
        })
      );

      setEnrollments(enrichedEnrollments);
      setFilteredEnrollments(enrichedEnrollments);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!roleLoading && canAccessDashboard()) {
      fetchEnrollments();
    }
  }, [user, roleLoading, canAccessDashboard]);

  useEffect(() => {
    let filtered = enrollments;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (e) =>
          e.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.profile?.phone?.includes(searchTerm) ||
          e.course?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.course?.title_ar?.includes(searchTerm)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((e) => e.status === statusFilter);
    }

    setFilteredEnrollments(filtered);
  }, [searchTerm, statusFilter, enrollments]);

  const updateEnrollmentStatus = async (enrollmentId: string, newStatus: string) => {
    if (!user) return;
    setUpdating(enrollmentId);

    try {
      const { error } = await supabase
        .from('course_enrollments')
        .update({
          status: newStatus,
          activated_by: newStatus === 'active' ? user.id : null,
          activated_at: newStatus === 'active' ? new Date().toISOString() : null,
        })
        .eq('id', enrollmentId);

      if (error) throw error;

      toast({
        title: isRTL ? 'تم التحديث' : 'Updated',
        description: isRTL ? 'تم تحديث حالة الاشتراك بنجاح' : 'Enrollment status updated successfully',
      });

      await fetchEnrollments();
    } catch (error) {
      console.error('Error updating enrollment:', error);
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'حدث خطأ أثناء التحديث' : 'Failed to update enrollment',
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      active: 'bg-green-500/10 text-green-600 border-green-500/20',
      expired: 'bg-red-500/10 text-red-600 border-red-500/20',
    };

    const labels: Record<string, { ar: string; en: string }> = {
      pending: { ar: 'معلق', en: 'Pending' },
      active: { ar: 'نشط', en: 'Active' },
      expired: { ar: 'منتهي', en: 'Expired' },
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status] || ''}`}>
        {isRTL ? labels[status]?.ar : labels[status]?.en}
      </span>
    );
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/assistant')}>
            <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isRTL ? 'إدارة الاشتراكات' : 'Enrollment Management'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isRTL ? `${filteredEnrollments.length} اشتراك` : `${filteredEnrollments.length} enrollments`}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={isRTL ? 'بحث بالاسم أو الكورس...' : 'Search by name or course...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ps-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-background border border-input rounded-lg text-foreground"
            >
              <option value="all">{isRTL ? 'جميع الحالات' : 'All Status'}</option>
              <option value="pending">{isRTL ? 'معلق' : 'Pending'}</option>
              <option value="active">{isRTL ? 'نشط' : 'Active'}</option>
              <option value="expired">{isRTL ? 'منتهي' : 'Expired'}</option>
            </select>
          </div>
        </div>

        {/* Enrollments List */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : filteredEnrollments.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {isRTL ? 'لا يوجد اشتراكات' : 'No enrollments found'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-4 text-start text-sm font-medium text-muted-foreground">
                      {isRTL ? 'الطالب' : 'Student'}
                    </th>
                    <th className="px-6 py-4 text-start text-sm font-medium text-muted-foreground">
                      {isRTL ? 'الكورس' : 'Course'}
                    </th>
                    <th className="px-6 py-4 text-start text-sm font-medium text-muted-foreground">
                      {isRTL ? 'الحالة' : 'Status'}
                    </th>
                    <th className="px-6 py-4 text-start text-sm font-medium text-muted-foreground">
                      {isRTL ? 'تاريخ الاشتراك' : 'Enrolled At'}
                    </th>
                    <th className="px-6 py-4 text-start text-sm font-medium text-muted-foreground">
                      {isRTL ? 'الإجراءات' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredEnrollments.map((enrollment) => (
                    <tr key={enrollment.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {enrollment.profile?.full_name || (isRTL ? 'بدون اسم' : 'No name')}
                            </p>
                            <p className="text-sm text-muted-foreground" dir="ltr">
                              {enrollment.profile?.phone || '-'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">
                            {isRTL ? enrollment.course?.title_ar : enrollment.course?.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(enrollment.status)}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(enrollment.enrolled_at).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {enrollment.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => updateEnrollmentStatus(enrollment.id, 'active')}
                              disabled={updating === enrollment.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 me-1" />
                              {isRTL ? 'تفعيل' : 'Activate'}
                            </Button>
                          )}
                          {enrollment.status === 'active' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateEnrollmentStatus(enrollment.id, 'expired')}
                              disabled={updating === enrollment.id}
                            >
                              <XCircle className="h-4 w-4 me-1" />
                              {isRTL ? 'إلغاء' : 'Cancel'}
                            </Button>
                          )}
                          {enrollment.status === 'expired' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateEnrollmentStatus(enrollment.id, 'active')}
                              disabled={updating === enrollment.id}
                            >
                              <CheckCircle className="h-4 w-4 me-1" />
                              {isRTL ? 'إعادة تفعيل' : 'Reactivate'}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
