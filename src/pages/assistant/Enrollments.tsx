import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CheckCircle, XCircle, ArrowLeft, User, BookOpen, RefreshCw, FileText, PauseCircle, PlayCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { ManualEnrollment } from '@/components/assistant/ManualEnrollment';
import { BulkEnrollment } from '@/components/assistant/BulkEnrollment';
import { useCourseActivitySummary } from '@/hooks/useCourseActivitySummary';
import { ActivityGuidePanel } from '@/components/assistant/ActivityGuidePanel';

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

  const fetchEnrollments = async () => {
    if (!user || !canAccessDashboard()) return;
    setLoading(true);

    try {
      // First, get only student user_ids (exclude assistant_teacher and admin)
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

      // Fetch enrollments only for students
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

      // Get unique user_ids and course_ids
      const userIds = [...new Set(enrollmentsData.map(e => e.user_id))];
      const courseIds = [...new Set(enrollmentsData.map(e => e.course_id))];

      // Fetch profiles and courses in parallel
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
  };

  useEffect(() => {
    if (!roleLoading && canAccessDashboard()) {
      fetchEnrollments();
    }
  }, [user, roleLoading]);

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
        // Clear suspension data when reactivating
        updateData.suspended_at = null;
        updateData.suspended_by = null;
        updateData.suspended_reason = null;
      }

      if (newStatus === 'suspended') {
        updateData.suspended_at = new Date().toISOString();
        updateData.suspended_by = user.id;
        updateData.suspended_reason = 'Payment pending'; // Default reason
      }

      // If expiring/ending course access, freeze the activity summary
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

      // Update local state instead of refetching
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

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: { ar: string; en: string }; className?: string }> = {
      pending: { variant: 'secondary', label: { ar: 'معلق', en: 'Pending' } },
      active: { variant: 'default', label: { ar: 'نشط', en: 'Active' } },
      suspended: { variant: 'outline', label: { ar: 'موقوف', en: 'Suspended' }, className: 'border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-950' },
      expired: { variant: 'destructive', label: { ar: 'منتهي', en: 'Expired' } },
    };

    const { variant, label, className } = config[status] || { variant: 'outline', label: { ar: status, en: status } };

    return (
      <Badge variant={variant} className={className}>
        {isRTL ? label.ar : label.en}
      </Badge>
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
    <div className="min-h-screen bg-background pb-mobile-nav" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
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
          <div className="flex items-center gap-3">
            <BulkEnrollment isArabic={isRTL} onEnrollmentComplete={fetchEnrollments} />
            <ManualEnrollment isArabic={isRTL} onEnrollmentComplete={fetchEnrollments} />
            <Button variant="outline" size="sm" onClick={fetchEnrollments} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${isRTL ? 'ms-2' : 'me-2'} ${loading ? 'animate-spin' : ''}`} />
              {isRTL ? 'تحديث' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
              <Input
                placeholder={isRTL ? 'بحث بالاسم أو الكورس أو البريد...' : 'Search by name, course or email...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={isRTL ? 'pr-10' : 'pl-10'}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-background border border-input rounded-lg text-foreground min-w-[150px]"
            >
              <option value="all">{isRTL ? 'جميع الحالات' : 'All Status'}</option>
              <option value="pending">{isRTL ? 'معلق' : 'Pending'}</option>
              <option value="active">{isRTL ? 'نشط' : 'Active'}</option>
              <option value="suspended">{isRTL ? 'موقوف' : 'Suspended'}</option>
              <option value="expired">{isRTL ? 'منتهي' : 'Expired'}</option>
            </select>
          </div>
        </div>

        {/* Activity Guide Panel - shown when filtering expired enrollments */}
        {statusFilter === 'expired' && (
          <ActivityGuidePanel className="mb-6" />
        )}

        {/* Enrollments List */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">{isRTL ? 'جاري التحميل...' : 'Loading...'}</p>
            </div>
          ) : filteredEnrollments.length === 0 ? (
            <div className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">
                {isRTL ? 'لا يوجد اشتراكات' : 'No enrollments found'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-sm font-medium text-muted-foreground`}>
                      {isRTL ? 'الطالب' : 'Student'}
                    </th>
                    <th className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-sm font-medium text-muted-foreground`}>
                      {isRTL ? 'الكورس' : 'Course'}
                    </th>
                    <th className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-sm font-medium text-muted-foreground`}>
                      {isRTL ? 'الحالة' : 'Status'}
                    </th>
                    <th className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-sm font-medium text-muted-foreground hidden md:table-cell`}>
                      {isRTL ? 'تاريخ الاشتراك' : 'Enrolled At'}
                    </th>
                    <th className={`px-6 py-4 ${isRTL ? 'text-right' : 'text-left'} text-sm font-medium text-muted-foreground`}>
                      {isRTL ? 'الإجراءات' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredEnrollments.map((enrollment) => (
                    <tr key={enrollment.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {enrollment.profile?.full_name || (isRTL ? 'بدون اسم' : 'No name')}
                            </p>
                            <p className="text-sm text-muted-foreground truncate" dir="ltr">
                              {enrollment.profile?.phone || enrollment.profile?.email || '-'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-foreground truncate">
                              {isRTL ? enrollment.course?.title_ar : enrollment.course?.title}
                            </p>
                            {enrollment.course?.grade && (
                              <p className="text-xs text-muted-foreground">
                                {enrollment.course.grade}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(enrollment.status)}</td>
                      <td className="px-6 py-4 text-muted-foreground hidden md:table-cell">
                        {new Date(enrollment.enrolled_at).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
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
                              {updating === enrollment.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className={`h-4 w-4 ${isRTL ? 'ms-1' : 'me-1'}`} />
                                  {isRTL ? 'تفعيل' : 'Activate'}
                                </>
                              )}
                            </Button>
                          )}
                          {enrollment.status === 'active' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
                                onClick={() => updateEnrollmentStatus(enrollment.id, 'suspended', enrollment)}
                                disabled={updating === enrollment.id}
                                title={isRTL ? 'إيقاف مؤقت - الطالب يشوف الدروس القديمة فقط' : 'Suspend - student can only view completed lessons'}
                              >
                                {updating === enrollment.id ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <PauseCircle className={`h-4 w-4 ${isRTL ? 'ms-1' : 'me-1'}`} />
                                    {isRTL ? 'إيقاف' : 'Suspend'}
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateEnrollmentStatus(enrollment.id, 'expired', enrollment)}
                                disabled={updating === enrollment.id || summaryLoading}
                                title={isRTL ? 'إنهاء نهائي - يحفظ ملخص النشاط' : 'End permanently - saves activity summary'}
                              >
                                {(updating === enrollment.id || summaryLoading) ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <XCircle className={`h-4 w-4 ${isRTL ? 'ms-1' : 'me-1'}`} />
                                    {isRTL ? 'إنهاء' : 'End'}
                                  </>
                                )}
                              </Button>
                            </>
                          )}
                          {enrollment.status === 'suspended' && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => updateEnrollmentStatus(enrollment.id, 'active')}
                                disabled={updating === enrollment.id}
                              >
                                {updating === enrollment.id ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <PlayCircle className={`h-4 w-4 ${isRTL ? 'ms-1' : 'me-1'}`} />
                                    {isRTL ? 'إعادة تفعيل' : 'Reactivate'}
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateEnrollmentStatus(enrollment.id, 'expired', enrollment)}
                                disabled={updating === enrollment.id || summaryLoading}
                              >
                                {(updating === enrollment.id || summaryLoading) ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <XCircle className={`h-4 w-4 ${isRTL ? 'ms-1' : 'me-1'}`} />
                                    {isRTL ? 'إنهاء' : 'End'}
                                  </>
                                )}
                              </Button>
                            </>
                          )}
                          {enrollment.status === 'expired' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateEnrollmentStatus(enrollment.id, 'active')}
                              disabled={updating === enrollment.id}
                            >
                              {updating === enrollment.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className={`h-4 w-4 ${isRTL ? 'ms-1' : 'me-1'}`} />
                                  {isRTL ? 'إعادة تفعيل' : 'Reactivate'}
                                </>
                              )}
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
};

export default Enrollments;