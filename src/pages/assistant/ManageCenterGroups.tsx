/**
 * Manage Center Groups Page
 * 
 * Allows assistant teachers to view, create, and manage center groups.
 * Includes bulk subscription activation by group.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Plus, 
  Calendar, 
  Clock, 
  GraduationCap, 
  BookOpen,
  CheckCircle,
  ChevronRight,
  Zap,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCenterGroups, CenterGroup } from '@/hooks/useCenterGroups';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CreateCenterGroupDialog } from '@/components/assistant/CreateCenterGroupDialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Day labels
const DAY_LABELS: Record<string, { ar: string; en: string }> = {
  saturday: { ar: 'سبت', en: 'Sat' },
  sunday: { ar: 'أحد', en: 'Sun' },
  monday: { ar: 'اثنين', en: 'Mon' },
  tuesday: { ar: 'ثلاثاء', en: 'Tue' },
  wednesday: { ar: 'أربعاء', en: 'Wed' },
  thursday: { ar: 'خميس', en: 'Thu' },
  friday: { ar: 'جمعة', en: 'Fri' },
};

// Grade labels
const GRADE_LABELS: Record<string, { ar: string; en: string }> = {
  second_secondary: { ar: 'تانية ثانوي', en: '2nd Secondary' },
  third_secondary: { ar: 'تالته ثانوي', en: '3rd Secondary' },
};

// Track labels
const TRACK_LABELS: Record<string, { ar: string; en: string }> = {
  arabic: { ar: 'عربي', en: 'Arabic' },
  languages: { ar: 'لغات', en: 'Languages' },
};

interface Course {
  id: string;
  title: string;
  title_ar: string;
}

export default function ManageCenterGroups() {
  const { user, loading: authLoading } = useAuth();
  const { canAccessDashboard, loading: roleLoading } = useUserRole();
  const { isRTL, language } = useLanguage();
  const { groups, loading, refetch, activateGroupSubscriptions, deleteGroup } = useCenterGroups();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isArabic = language === 'ar';

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [activatingGroup, setActivatingGroup] = useState<string | null>(null);
  const [deleteConfirmGroup, setDeleteConfirmGroup] = useState<CenterGroup | null>(null);
  const [deleting, setDeleting] = useState(false);

  const hasAccess = canAccessDashboard();
  const tr = (ar: string, en: string) => isArabic ? ar : en;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    if (!authLoading && !roleLoading && user && !hasAccess) {
      navigate('/');
    }
  }, [user, authLoading, roleLoading, hasAccess, navigate]);

  // Fetch courses for bulk activation
  useEffect(() => {
    const fetchCourses = async () => {
      const { data } = await supabase
        .from('courses')
        .select('id, title, title_ar')
        .eq('is_hidden', false)
        .order('title_ar');
      setCourses(data || []);
    };
    fetchCourses();
  }, []);

  const formatDays = (days: string[]) => {
    return days
      .map(day => DAY_LABELS[day]?.[isArabic ? 'ar' : 'en'] || day)
      .join(' - ');
  };

  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? (isArabic ? 'م' : 'PM') : (isArabic ? 'ص' : 'AM');
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch {
      return time;
    }
  };

  const handleActivateGroup = async (groupId: string) => {
    if (!selectedCourse) {
      toast({
        variant: 'destructive',
        title: tr('خطأ', 'Error'),
        description: tr('يرجى اختيار كورس أولاً', 'Please select a course first'),
      });
      return;
    }

    setActivatingGroup(groupId);
    try {
      const result = await activateGroupSubscriptions(groupId, selectedCourse);
      
      toast({
        title: tr('تم التفعيل ✅', 'Activated ✅'),
        description: tr(
          `تم تفعيل ${result.activated} طالب (${result.alreadyActive} نشط بالفعل)`,
          `Activated ${result.activated} students (${result.alreadyActive} already active)`
        ),
      });
    } catch (error) {
      console.error('Error activating group:', error);
      toast({
        variant: 'destructive',
        title: tr('خطأ', 'Error'),
        description: tr('فشل تفعيل المجموعة', 'Failed to activate group'),
      });
    } finally {
      setActivatingGroup(null);
    }
  };

  const handleDeleteGroup = async () => {
    if (!deleteConfirmGroup) return;

    setDeleting(true);
    try {
      const success = await deleteGroup(deleteConfirmGroup.id);
      if (success) {
        toast({
          title: tr('تم الحذف ✅', 'Deleted ✅'),
          description: tr('تم حذف المجموعة بنجاح', 'Group deleted successfully'),
        });
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        variant: 'destructive',
        title: tr('خطأ', 'Error'),
        description: tr('فشل حذف المجموعة', 'Failed to delete group'),
      });
    } finally {
      setDeleting(false);
      setDeleteConfirmGroup(null);
    }
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

  return (
    <div className="min-h-screen bg-muted/30 pb-mobile-nav" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      
      <main className="pt-20 sm:pt-24 pb-8">
        <div className="container mx-auto px-3 sm:px-4 max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">
                {tr('مجموعات السنتر', 'Center Groups')}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {tr('إدارة مجموعات طلاب السنتر', 'Manage center student groups')}
              </p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              {tr('إنشاء مجموعة', 'Create Group')}
            </Button>
          </div>

          {/* Bulk Activation Controls */}
          <div className="bg-card border rounded-xl p-4 mb-6">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              {tr('تفعيل جماعي للاشتراكات', 'Bulk Subscription Activation')}
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="sm:flex-1">
                  <SelectValue placeholder={tr('اختر الكورس للتفعيل', 'Select course to activate')} />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {isArabic ? course.title_ar : course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground sm:hidden">
                {tr('اختر الكورس ثم اضغط "تفعيل" على المجموعة المطلوبة', 'Select course then click "Activate" on the desired group')}
              </p>
            </div>
          </div>

          {/* Groups List */}
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
          ) : groups.length === 0 ? (
            <div className="text-center py-12 bg-card border rounded-xl">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">
                {tr('لا توجد مجموعات', 'No Groups Yet')}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {tr('أنشئ مجموعتك الأولى للبدء', 'Create your first group to get started')}
              </p>
              <Button onClick={() => setCreateDialogOpen(true)} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                {tr('إنشاء مجموعة', 'Create Group')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="bg-card border rounded-xl p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Group Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{group.name}</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <GraduationCap className="h-3 w-3" />
                              {GRADE_LABELS[group.grade]?.[isArabic ? 'ar' : 'en']}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              {TRACK_LABELS[group.language_track]?.[isArabic ? 'ar' : 'en']}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Group Details */}
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDays(group.days_of_week)}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTime(group.time_slot)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          {group.member_count || 0} {tr('طالب', 'students')}
                        </Badge>
                        {!group.is_active && (
                          <Badge variant="destructive" className="text-xs">
                            {tr('غير نشط', 'Inactive')}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleActivateGroup(group.id)}
                        disabled={!selectedCourse || activatingGroup === group.id}
                        className="gap-1"
                      >
                        {activatingGroup === group.id ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                        ) : (
                          <CheckCircle className="h-3 w-3" />
                        )}
                        {tr('تفعيل', 'Activate')}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive gap-1"
                        onClick={() => setDeleteConfirmGroup(group)}
                      >
                        <Trash2 className="h-3 w-3" />
                        {tr('حذف', 'Delete')}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Group Dialog */}
      <CreateCenterGroupDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onGroupCreated={refetch}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmGroup} onOpenChange={(open) => !open && setDeleteConfirmGroup(null)}>
        <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {tr('حذف المجموعة؟', 'Delete Group?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {tr(
                `هل أنت متأكد من حذف "${deleteConfirmGroup?.name}"؟ سيتم إزالة جميع الطلاب من المجموعة.`,
                `Are you sure you want to delete "${deleteConfirmGroup?.name}"? All students will be removed from the group.`
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              {tr('إلغاء', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : null}
              {tr('حذف', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
