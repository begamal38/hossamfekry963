import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, User, BookOpen, RefreshCw, PauseCircle, PlayCircle, CreditCard, Calendar, MapPin, Wifi } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

import { BulkEnrollment } from '@/components/assistant/BulkEnrollment';
import { useCourseActivitySummary } from '@/hooks/useCourseActivitySummary';
import { ActivityGuidePanel } from '@/components/assistant/ActivityGuidePanel';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { StatusSummaryCard } from '@/components/dashboard/StatusSummaryCard';
import { AssistantPageHeader } from '@/components/assistant/AssistantPageHeader';
import { SearchFilterBar } from '@/components/assistant/SearchFilterBar';
import { MobileDataCard } from '@/components/assistant/MobileDataCard';
import { EmptyState } from '@/components/assistant/EmptyState';
import { useAssistantFilters, applyEnrollmentFilters, CenterGroup, FilterableEnrollment } from '@/hooks/useAssistantFilters';
import { useCenterGroups } from '@/hooks/useCenterGroups';


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
    grade?: string | null;
    academic_year?: string | null;
    language_track?: string | null;
    attendance_mode?: 'online' | 'center' | 'hybrid' | null;
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
  const [updating, setUpdating] = useState<string | null>(null);
  
  const { calculateAndFreezeSummary, loading: summaryLoading } = useCourseActivitySummary();
  const { groups: centerGroups, loading: groupsLoading } = useCenterGroups();
  
  // Center group member mapping (userId -> groupId)
  const [centerGroupMembers, setCenterGroupMembers] = useState<Map<string, string>>(new Map());

  // Unified filters from shared hook
  const {
    searchTerm,
    setSearchTerm,
    hasActiveFilters,
    clearFilters,
    buildFilterConfig,
    filterState,
  } = useAssistantFilters({
    includeStatus: true,
    includeCenterGroup: true,
    centerGroups: centerGroups as CenterGroup[],
  });

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

  // Fetch center group members for mapping
  const fetchCenterGroupMembers = useCallback(async () => {
    const { data, error } = await supabase
      .from('center_group_members')
      .select('student_id, group_id')
      .eq('is_active', true);
    
    if (!error && data) {
      const mapping = new Map<string, string>();
      data.forEach(m => mapping.set(m.student_id, m.group_id));
      setCenterGroupMembers(mapping);
    }
  }, []);

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
        supabase.from('profiles').select('user_id, full_name, phone, email, grade, academic_year, language_track, attendance_mode').in('user_id', userIds),
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
      fetchCenterGroupMembers();
    }
  }, [user, roleLoading, canAccessDashboard, fetchEnrollments, fetchCenterGroupMembers]);

  // Apply unified filters whenever filter state or enrollments change
  useEffect(() => {
    const filtered = applyEnrollmentFilters(
      enrollments as FilterableEnrollment[],
      filterState,
      centerGroupMembers
    );
    setFilteredEnrollments(filtered as Enrollment[]);
  }, [enrollments, filterState, centerGroupMembers]);

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
    // Soft, muted status badges - not screaming
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: { ar: string; en: string }; className?: string }> = {
      pending: { variant: 'secondary', label: { ar: 'معلق', en: 'Pending' }, className: 'bg-muted text-muted-foreground' },
      active: { variant: 'default', label: { ar: 'نشط', en: 'Active' }, className: 'bg-green-500/15 text-green-700 dark:text-green-400 border-transparent' },
      suspended: { variant: 'outline', label: { ar: 'موقوف', en: 'Suspended' }, className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-transparent' },
      expired: { variant: 'secondary', label: { ar: 'منتهي', en: 'Expired' }, className: 'bg-muted/80 text-muted-foreground' },
    };
    return config[status] || { variant: 'outline' as const, label: { ar: status, en: status } };
  };

  // Helper to get grade label
  const getGradeLabel = (grade?: string) => {
    if (!grade) return null;
    const gradeMap: Record<string, { ar: string; en: string }> = {
      'second_arabic': { ar: 'تانية ثانوي عربي', en: '2nd Sec Arabic' },
      'second_languages': { ar: 'تانية ثانوي لغات', en: '2nd Sec Languages' },
      'third_arabic': { ar: 'تالتة ثانوي عربي', en: '3rd Sec Arabic' },
      'third_languages': { ar: 'تالتة ثانوي لغات', en: '3rd Sec Languages' },
    };
    return gradeMap[grade] || { ar: grade, en: grade };
  };

  // Stats
  const stats = {
    total: enrollments.length,
    active: enrollments.filter(e => e.status === 'active').length,
    pending: enrollments.filter(e => e.status === 'pending').length,
    suspended: enrollments.filter(e => e.status === 'suspended').length,
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-3.5 h-3.5 rounded-full bg-primary animate-pulse-dot"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  const renderEnrollmentActions = (enrollment: Enrollment) => {
    const isUpdating = updating === enrollment.id;

    // Pending: Single activate action
    if (enrollment.status === 'pending') {
      return (
        <Button
          size="sm"
          onClick={() => updateEnrollmentStatus(enrollment.id, 'active')}
          disabled={isUpdating}
          className="bg-green-600 hover:bg-green-700 text-white flex-1"
        >
          {isUpdating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 me-1.5" />}
          {isRTL ? 'تفعيل' : 'Activate'}
        </Button>
      );
    }

    // Active: Suspend (primary/outline) + End (destructive, visually separated)
    if (enrollment.status === 'active') {
      return (
        <div className="flex gap-2 w-full">
          {/* Primary action: Suspend - outline style */}
          <Button
            size="sm"
            variant="outline"
            className="flex-1 border-border hover:bg-muted"
            onClick={() => updateEnrollmentStatus(enrollment.id, 'suspended', enrollment)}
            disabled={isUpdating}
          >
            {isUpdating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <PauseCircle className="h-4 w-4 me-1.5" />}
            {isRTL ? 'إيقاف' : 'Suspend'}
          </Button>
          {/* Destructive action: End - separated, never first */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => updateEnrollmentStatus(enrollment.id, 'expired', enrollment)}
            disabled={isUpdating || summaryLoading}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            {(isUpdating || summaryLoading) ? <RefreshCw className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 me-1" />}
            {isRTL ? 'إنهاء' : 'End'}
          </Button>
        </div>
      );
    }

    // Suspended: Reactivate (primary) + End (destructive)
    if (enrollment.status === 'suspended') {
      return (
        <div className="flex gap-2 w-full">
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white flex-1"
            onClick={() => updateEnrollmentStatus(enrollment.id, 'active')}
            disabled={isUpdating}
          >
            {isUpdating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4 me-1.5" />}
            {isRTL ? 'تفعيل' : 'Reactivate'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => updateEnrollmentStatus(enrollment.id, 'expired', enrollment)}
            disabled={isUpdating || summaryLoading}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            {(isUpdating || summaryLoading) ? <RefreshCw className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 me-1" />}
            {isRTL ? 'إنهاء' : 'End'}
          </Button>
        </div>
      );
    }

    // Expired: Reactivate option
    if (enrollment.status === 'expired') {
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={() => updateEnrollmentStatus(enrollment.id, 'active')}
          disabled={isUpdating}
          className="flex-1"
        >
          {isUpdating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 me-1.5" />}
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
          <div className="container mx-auto px-3 sm:px-4 max-w-2xl lg:max-w-3xl">
            {/* Header - Clear hierarchy: Title primary, count secondary */}
            <AssistantPageHeader
              title={isRTL ? 'إدارة الاشتراكات' : 'Manage Enrollments'}
              subtitle={loading ? '...' : `${stats.active} ${isRTL ? 'نشط' : 'active'} • ${stats.total} ${isRTL ? 'إجمالي' : 'total'}`}
              icon={CreditCard}
              isRTL={isRTL}
            />

            {/* Status Summary - Secondary visual, not competing with title */}
            <StatusSummaryCard
              primaryText={stats.pending > 0 
                ? `${stats.pending} ${isRTL ? 'بانتظار التفعيل' : 'pending activation'}`
                : (isRTL ? 'لا يوجد اشتراكات معلقة' : 'No pending enrollments')
              }
              secondaryText={stats.suspended > 0 
                ? `${stats.suspended} ${isRTL ? 'موقوف' : 'suspended'}`
                : undefined
              }
              badge={stats.pending > 5 
                ? (isRTL ? 'يحتاج تدخل' : 'Needs Action')
                : stats.pending > 0 
                ? (isRTL ? 'محتاج متابعة' : 'Review')
                : (isRTL ? 'كله تمام' : 'All Good')
              }
              badgeVariant={stats.pending > 5 ? 'danger' : stats.pending > 0 ? 'warning' : 'success'}
              isRTL={isRTL}
              className="mb-5"
            />

            {/* Search & Filters - Grouped visually */}
            <div className="bg-card border border-border rounded-xl p-3 mb-4">
              <SearchFilterBar
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder={isRTL ? 'بحث بالاسم أو رقم الموبايل...' : 'Search by name or phone...'}
                filters={buildFilterConfig(isRTL)}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={clearFilters}
                isRTL={isRTL}
                className="mb-0"
              />
            </div>

            {/* Activity Guide Panel - shown when filtering expired enrollments */}
            {filterState.statusFilter === 'expired' && <ActivityGuidePanel className="mb-4" />}

            {/* Enrollments List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-3 h-3 rounded-full bg-primary animate-pulse-dot"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            ) : filteredEnrollments.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title={isRTL ? 'لا يوجد اشتراكات' : 'No enrollments found'}
                description={hasActiveFilters 
                  ? (isRTL ? 'جرب تغيير الفلاتر' : 'Try adjusting filters')
                  : (isRTL ? 'لم يتم تسجيل أي اشتراك حتى الآن' : 'No enrollments have been made yet')
                }
                hint={!hasActiveFilters 
                  ? (isRTL ? 'اضغط على + لإضافة اشتراك' : 'Tap + to add an enrollment')
                  : undefined}
                actionLabel={hasActiveFilters ? (isRTL ? 'مسح الفلاتر' : 'Clear Filters') : undefined}
                onAction={hasActiveFilters ? clearFilters : undefined}
              />
            ) : (
              <div className="space-y-3">
                {filteredEnrollments.map((enrollment) => {
                  const statusConfig = getStatusConfig(enrollment.status);
                  const gradeLabel = getGradeLabel(enrollment.course?.grade);
                  const modeLabel = enrollment.profile?.attendance_mode === 'center' 
                    ? (isRTL ? 'سنتر' : 'Center')
                    : enrollment.profile?.attendance_mode === 'online'
                    ? (isRTL ? 'أونلاين' : 'Online')
                    : null;
                  
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
                      secondaryBadge={modeLabel || undefined}
                      secondaryBadgeVariant={enrollment.profile?.attendance_mode === 'center' ? 'secondary' : 'muted'}
                      isRTL={isRTL}
                      metadata={[
                        // Grade info - primary identifier
                        ...(gradeLabel ? [{
                          label: isRTL ? gradeLabel.ar : gradeLabel.en,
                          icon: BookOpen,
                          className: 'text-primary font-medium',
                        }] : []),
                        // Phone number
                        ...(enrollment.profile?.phone ? [{
                          label: enrollment.profile.phone,
                        }] : []),
                        // Date enrolled
                        {
                          label: new Date(enrollment.enrolled_at).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
                            month: 'short',
                            day: 'numeric'
                          }),
                          icon: Calendar,
                        },
                      ]}
                      actions={
                        <div className="flex gap-2 mt-3 pt-3 border-t border-border/50 w-full">
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

      {/* Enrollment Options - Using BulkEnrollment with FAB trigger */}
      <BulkEnrollment 
        isArabic={isRTL} 
        onEnrollmentComplete={fetchEnrollments}
        showAsFab={true}
      />
    </div>
  );
};

export default Enrollments;
