import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, User, BookOpen, RefreshCw, PauseCircle, PlayCircle, CreditCard, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { ManualEnrollment } from '@/components/assistant/ManualEnrollment';
import { BulkEnrollment } from '@/components/assistant/BulkEnrollment';
import { useCourseActivitySummary } from '@/hooks/useCourseActivitySummary';
import { ActivityGuidePanel } from '@/components/assistant/ActivityGuidePanel';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { StatusSummaryCard } from '@/components/dashboard/StatusSummaryCard';
import { AssistantPageHeader } from '@/components/assistant/AssistantPageHeader';
import { SearchFilterBar } from '@/components/assistant/SearchFilterBar';
import { MobileDataCard } from '@/components/assistant/MobileDataCard';
import { EmptyState } from '@/components/assistant/EmptyState';
import { FloatingActionButton } from '@/components/assistant/FloatingActionButton';

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
    email: string | null;
  };
  course?: {
    title: string;
    title_ar: string;
    grade: string;
  };
}

const Enrollments = () => {
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
  const [showManualEnroll, setShowManualEnroll] = useState(false);
  const { calculateAndFreezeSummary, loading: summaryLoading } = useCourseActivitySummary();

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

  const fetchEnrollments = useCallback(async () => {
    if (!user || !canAccessDashboard()) return;
    setLoading(true);

    try {
      const { data: studentRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'student');

      if (rolesError) throw rolesError;

      const studentUserIds = studentRoles?.map(r => r.user_id) || [];

      if (studentUserIds.length === 0) {
        setEnrollments([]);
        setFilteredEnrollments([]);
        setLoading(false);
        return;
      }

      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select('*')
        .in('user_id', studentUserIds)
        .order('enrolled_at', { ascending: false });

      if (enrollmentsError) throw enrollmentsError;

      if (!enrollmentsData || enrollmentsData.length === 0) {
        setEnrollments([]);
        setFilteredEnrollments([]);
        setLoading(false);
        return;
      }

      const userIds = [...new Set(enrollmentsData.map(e => e.user_id))];
      const courseIds = [...new Set(enrollmentsData.map(e => e.course_id))];

      const [profilesRes, coursesRes] = await Promise.all([
        supabase.from('profiles').select('user_id, full_name, phone, email').in('user_id', userIds),
        supabase.from('courses').select('id, title, title_ar, grade').in('id', courseIds),
      ]);

      const profilesMap = new Map(profilesRes.data?.map(p => [p.user_id, p]) || []);
      const coursesMap = new Map(coursesRes.data?.map(c => [c.id, c]) || []);

      const enrichedEnrollments = enrollmentsData.map(enrollment => ({
        ...enrollment,
        profile: profilesMap.get(enrollment.user_id),
        course: coursesMap.get(enrollment.course_id),
      }));

      setEnrollments(enrichedEnrollments);
      setFilteredEnrollments(enrichedEnrollments);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'حدث خطأ أثناء تحميل الاشتراكات' : 'Failed to load enrollments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, canAccessDashboard, isRTL, toast]);

  useEffect(() => {
    if (!roleLoading && canAccessDashboard()) {
      fetchEnrollments();
    }
  }, [user, roleLoading, canAccessDashboard, fetchEnrollments]);

  useEffect(() => {
    let filtered = enrollments;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.profile?.full_name?.toLowerCase().includes(term) ||
          e.profile?.phone?.includes(searchTerm) ||
          e.profile?.email?.toLowerCase().includes(term) ||
          e.course?.title?.toLowerCase().includes(term) ||
          e.course?.title_ar?.includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((e) => e.status === statusFilter);
    }

    setFilteredEnrollments(filtered);
  }, [searchTerm, statusFilter, enrollments]);

  const updateEnrollmentStatus = async (enrollmentId: string, newStatus: string, enrollment?: Enrollment) => {
    if (!user) return;
    setUpdating(enrollmentId);

    try {
      const updateData: Record<string, unknown> = { status: newStatus };
      
      if (newStatus === 'active') {
        updateData.activated_by = user.id;
        updateData.activated_at = new Date().toISOString();
        updateData.suspended_at = null;
        updateData.suspended_by = null;
        updateData.suspended_reason = null;
      }

      if (newStatus === 'suspended') {
        updateData.suspended_at = new Date().toISOString();
        updateData.suspended_by = user.id;
        updateData.suspended_reason = 'Payment pending';
      }

      if (newStatus === 'expired' && enrollment) {
        await calculateAndFreezeSummary({
          userId: enrollment.user_id,
          courseId: enrollment.course_id,
          frozenBy: user.id,
        });
      }

      const { error } = await supabase
        .from('course_enrollments')
        .update(updateData)
        .eq('id', enrollmentId);

      if (error) throw error;

      const statusMessages: Record<string, { ar: string; en: string }> = {
        active: { ar: 'تم تفعيل الاشتراك', en: 'Enrollment activated' },
        suspended: { ar: 'تم إيقاف الاشتراك مؤقتاً', en: 'Enrollment suspended' },
        expired: { ar: 'تم إنهاء الاشتراك وحفظ ملخص النشاط', en: 'Enrollment ended and activity summary saved' },
      };

      toast({
        title: isRTL ? 'تم التحديث' : 'Updated',
        description: isRTL ? statusMessages[newStatus]?.ar : statusMessages[newStatus]?.en,
      });

      setEnrollments(prev => prev.map(e => 
        e.id === enrollmentId ? { ...e, status: newStatus, activated_at: newStatus === 'active' ? new Date().toISOString() : e.activated_at } : e
      ));
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

  const getStatusConfig = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: { ar: string; en: string }; className?: string }> = {
      pending: { variant: 'secondary', label: { ar: 'معلق', en: 'Pending' } },
      active: { variant: 'default', label: { ar: 'نشط', en: 'Active' } },
      suspended: { variant: 'outline', label: { ar: 'موقوف', en: 'Suspended' }, className: 'border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-950' },
      expired: { variant: 'destructive', label: { ar: 'منتهي', en: 'Expired' } },
    };
    return config[status] || { variant: 'outline' as const, label: { ar: status, en: status } };
  };

  // Stats
  const stats = {
    total: enrollments.length,
    active: enrollments.filter(e => e.status === 'active').length,
    pending: enrollments.filter(e => e.status === 'pending').length,
    suspended: enrollments.filter(e => e.status === 'suspended').length,
  };

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'all';

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderEnrollmentActions = (enrollment: Enrollment) => {
    const isUpdating = updating === enrollment.id;

    if (enrollment.status === 'pending') {
      return (
        <Button
          size="sm"
          onClick={() => updateEnrollmentStatus(enrollment.id, 'active')}
          disabled={isUpdating}
          className="bg-green-600 hover:bg-green-700 flex-1"
        >
          {isUpdating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 me-1" />}
          {isRTL ? 'تفعيل' : 'Activate'}
        </Button>
      );
    }

    if (enrollment.status === 'active') {
      return (
        <>
          <Button
            size="sm"
            variant="outline"
            className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950 flex-1"
            onClick={() => updateEnrollmentStatus(enrollment.id, 'suspended', enrollment)}
            disabled={isUpdating}
          >
            {isUpdating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <PauseCircle className="h-4 w-4 me-1" />}
            {isRTL ? 'إيقاف' : 'Suspend'}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => updateEnrollmentStatus(enrollment.id, 'expired', enrollment)}
            disabled={isUpdating || summaryLoading}
            className="flex-1"
          >
            {(isUpdating || summaryLoading) ? <RefreshCw className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 me-1" />}
            {isRTL ? 'إنهاء' : 'End'}
          </Button>
        </>
      );
    }

    if (enrollment.status === 'suspended') {
      return (
        <>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 flex-1"
            onClick={() => updateEnrollmentStatus(enrollment.id, 'active')}
            disabled={isUpdating}
          >
            {isUpdating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4 me-1" />}
            {isRTL ? 'تفعيل' : 'Reactivate'}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => updateEnrollmentStatus(enrollment.id, 'expired', enrollment)}
            disabled={isUpdating || summaryLoading}
            className="flex-1"
          >
            {(isUpdating || summaryLoading) ? <RefreshCw className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 me-1" />}
            {isRTL ? 'إنهاء' : 'End'}
          </Button>
        </>
      );
    }

    if (enrollment.status === 'expired') {
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={() => updateEnrollmentStatus(enrollment.id, 'active')}
          disabled={isUpdating}
          className="flex-1"
        >
          {isUpdating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 me-1" />}
          {isRTL ? 'إعادة تفعيل' : 'Reactivate'}
        </Button>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-mobile-nav" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      
      <PullToRefresh onRefresh={fetchEnrollments} className="h-[calc(100vh-4rem)] md:h-auto md:overflow-visible">
        <main className="pt-20 sm:pt-24 pb-8">
          <div className="container mx-auto px-3 sm:px-4 max-w-2xl">
            {/* Header */}
            <AssistantPageHeader
              title={isRTL ? 'إدارة الاشتراكات' : 'Enrollments'}
              subtitle={`${filteredEnrollments.length} ${isRTL ? 'اشتراك' : 'enrollments'}`}
              icon={CreditCard}
              isRTL={isRTL}
              actions={
                <div className="flex items-center gap-2">
                  <BulkEnrollment isArabic={isRTL} onEnrollmentComplete={fetchEnrollments} />
                </div>
              }
            />

            {/* Status Summary */}
            <StatusSummaryCard
              primaryText={loading ? '...' : `${stats.active} ${isRTL ? 'اشتراك نشط' : 'Active'}`}
              secondaryText={stats.pending > 0 
                ? `${stats.pending} ${isRTL ? 'بانتظار التفعيل' : 'pending activation'}`
                : (isRTL ? 'كل الاشتراكات مُعالجة' : 'All enrollments processed')
              }
              badge={stats.pending > 0 ? `${stats.pending} ${isRTL ? 'معلق' : 'pending'}` : undefined}
              badgeVariant={stats.pending > 0 ? 'warning' : 'success'}
              isRTL={isRTL}
              className="mb-4"
            />

            {/* Search & Filters */}
            <SearchFilterBar
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder={isRTL ? 'بحث بالاسم أو الكورس...' : 'Search by name or course...'}
              filters={[
                {
                  value: statusFilter,
                  onChange: setStatusFilter,
                  options: [
                    { value: 'all', label: isRTL ? 'الكل' : 'All' },
                    { value: 'pending', label: isRTL ? 'معلق' : 'Pending' },
                    { value: 'active', label: isRTL ? 'نشط' : 'Active' },
                    { value: 'suspended', label: isRTL ? 'موقوف' : 'Suspended' },
                    { value: 'expired', label: isRTL ? 'منتهي' : 'Expired' },
                  ],
                },
              ]}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={clearFilters}
              isRTL={isRTL}
            />

            {/* Activity Guide Panel - shown when filtering expired enrollments */}
            {statusFilter === 'expired' && <ActivityGuidePanel className="mb-4" />}

            {/* Enrollments List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : filteredEnrollments.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title={isRTL ? 'لا يوجد اشتراكات' : 'No enrollments found'}
                description={hasActiveFilters 
                  ? (isRTL ? 'جرب تغيير الفلاتر' : 'Try adjusting filters')
                  : (isRTL ? 'أضف اشتراك جديد للبدء' : 'Add a new enrollment to get started')
                }
                actionLabel={!hasActiveFilters ? (isRTL ? 'تسجيل طالب' : 'Enroll Student') : undefined}
                onAction={!hasActiveFilters ? () => setShowManualEnroll(true) : undefined}
              />
            ) : (
              <div className="space-y-3">
                {filteredEnrollments.map((enrollment) => {
                  const statusConfig = getStatusConfig(enrollment.status);
                  return (
                    <MobileDataCard
                      key={enrollment.id}
                      title={enrollment.profile?.full_name || (isRTL ? 'بدون اسم' : 'No name')}
                      subtitle={isRTL ? enrollment.course?.title_ar : enrollment.course?.title}
                      icon={User}
                      iconColor="text-primary"
                      iconBgColor="bg-primary/10"
                      badge={isRTL ? statusConfig.label.ar : statusConfig.label.en}
                      badgeVariant={statusConfig.variant}
                      badgeClassName={statusConfig.className}
                      isRTL={isRTL}
                      metadata={[
                        {
                          label: new Date(enrollment.enrolled_at).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
                            month: 'short',
                            day: 'numeric'
                          }),
                          icon: Calendar,
                        },
                        ...(enrollment.profile?.phone ? [{
                          label: enrollment.profile.phone,
                        }] : []),
                      ]}
                      actions={
                        <div className="flex gap-2 mt-3 w-full">
                          {renderEnrollmentActions(enrollment)}
                        </div>
                      }
                    />
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </PullToRefresh>

      {/* Floating Action Button */}
      <FloatingActionButton
        onClick={() => setShowManualEnroll(true)}
        label={isRTL ? 'تسجيل طالب' : 'Enroll'}
      />

      {/* Manual Enrollment Dialog */}
      {showManualEnroll && (
        <ManualEnrollment 
          isArabic={isRTL} 
          onEnrollmentComplete={() => {
            setShowManualEnroll(false);
            fetchEnrollments();
          }}
        />
      )}
    </div>
  );
};

export default Enrollments;
