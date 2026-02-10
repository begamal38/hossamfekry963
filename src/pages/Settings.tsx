import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Camera, Save, Lock, Eye, EyeOff, MapPin, Bell, Volume2, VolumeX } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { GoogleAccountLinking } from '@/components/settings/GoogleAccountLinking';
import { useUserRole } from '@/hooks/useUserRole';
import { EGYPTIAN_GOVERNORATES } from '@/constants/governorates';
import { useNotificationSound } from '@/hooks/useNotificationSound';
const GRADE_OPTIONS = [
  { value: 'second_arabic', labelAr: 'تانية ثانوي عربي', labelEn: '2nd Secondary - Arabic' },
  { value: 'second_languages', labelAr: 'تانية ثانوي لغات', labelEn: '2nd Secondary - Languages' },
  { value: 'third_arabic', labelAr: 'تالته ثانوي عربي', labelEn: '3rd Secondary - Arabic' },
  { value: 'third_languages', labelAr: 'تالته ثانوي لغات', labelEn: '3rd Secondary - Languages' },
];

const Settings: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { isRTL, language } = useLanguage();
  const isArabic = language === 'ar';
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isStudent, isAssistantTeacher, isAdmin } = useUserRole();
  const { soundEnabled, toggleSound } = useNotificationSound();
  
  // Students cannot change grade after initial setup
  const canChangeGrade = isAssistantTeacher() || isAdmin();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [grade, setGrade] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [initialGrade, setInitialGrade] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  // Password change states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, phone, grade, avatar_url, governorate')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error) throw error;
        
        if (data) {
          setFullName(data.full_name || '');
          setPhone(data.phone || '');
          setGrade(data.grade || '');
          setGovernorate(data.governorate || '');
          setInitialGrade(data.grade || '');
          setAvatarUrl(data.avatar_url || '');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    if (isStudent() && initialGrade && grade !== initialGrade) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'غير مسموح' : 'Not Allowed',
        description: isArabic 
          ? 'لا يمكن تغيير المرحلة الدراسية بعد التسجيل. تواصل مع الإدارة للمساعدة.'
          : 'You cannot change your academic level after registration. Contact support for help.',
      });
      setGrade(initialGrade);
      return;
    }
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone,
          grade: grade,
          governorate: governorate,
        })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      toast({
        title: isArabic ? 'تم الحفظ' : 'Saved',
        description: isArabic ? 'تم تحديث بيانات الحساب بنجاح' : 'Account info updated successfully',
      });
    } catch (err) {
      console.error('Error updating profile:', err);
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'فشل في تحديث البيانات' : 'Failed to update info',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'يرجى إدخال كلمة المرور الجديدة وتأكيدها' : 'Please enter and confirm new password',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'كلمة المرور الجديدة وتأكيدها غير متطابقتين' : 'Passwords do not match',
      });
      return;
    }

    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: isArabic ? 'تم التغيير' : 'Changed',
        description: isArabic ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully',
      });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Error changing password:', err);
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ' : 'Error',
        description: err.message || (isArabic ? 'فشل في تغيير كلمة المرور' : 'Failed to change password'),
      });
    } finally {
      setSavingPassword(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
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
    <div className={cn("min-h-screen bg-muted/30 pb-mobile-nav", isRTL && "rtl")}>
      <Navbar />
      
      <main className="pt-24 pb-16 content-appear">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="mb-8 animate-fade-in-up">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {isArabic ? 'إعدادات الحساب' : 'Account Settings'}
            </h1>
            <p className="text-muted-foreground">
              {isArabic ? 'قم بتعديل بيانات حسابك' : 'Update your account info'}
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6 md:p-8 animate-fade-in-up animation-delay-100">
            {/* Avatar Section */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-4 border-primary/20">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-primary" />
                  )}
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {isArabic ? 'الاسم بالكامل' : 'Full Name'}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={isArabic ? 'أدخل اسمك بالكامل' : 'Enter your full name'}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Email (Read Only) */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {isArabic ? 'البريد الإلكتروني' : 'Email'}
                </label>
                <Input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  {isArabic ? 'لا يمكن تغيير البريد الإلكتروني' : 'Email cannot be changed'}
                </p>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {isArabic ? 'رقم الواتساب' : 'WhatsApp Number'}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="01xxxxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Grade - Only show for students */}
              {isStudent() && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {isArabic ? 'المرحلة الدراسية' : 'Academic Level'}
                  </label>
                  {initialGrade ? (
                    <div className="w-full h-10 px-3 rounded-md border border-input bg-muted text-foreground flex items-center">
                      {isArabic 
                        ? (GRADE_OPTIONS.find(o => o.value === grade)?.labelAr || grade)
                        : (GRADE_OPTIONS.find(o => o.value === grade)?.labelEn || grade)
                      }
                    </div>
                  ) : (
                    <select
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">{isArabic ? 'اختر المرحلة' : 'Select level'}</option>
                      {GRADE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {isArabic ? option.labelAr : option.labelEn}
                        </option>
                      ))}
                    </select>
                  )}
                  {initialGrade && (
                    <p className="text-xs text-muted-foreground">
                      {isArabic 
                        ? 'لا يمكن تغيير المرحلة الدراسية بعد التسجيل'
                        : 'Academic level cannot be changed after registration'}
                    </p>
                  )}
                </div>
              )}

              {/* Governorate */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  {isArabic ? 'المحافظة' : 'Governorate'}
                </label>
                <select
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">{isArabic ? 'اختر المحافظة' : 'Select governorate'}</option>
                  {EGYPTIAN_GOVERNORATES.map((gov) => (
                    <option key={gov.value} value={gov.value}>
                      {isArabic ? gov.label_ar : gov.label_en}
                    </option>
                  ))}
                </select>
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full gap-2"
                size="lg"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    {isArabic ? 'جاري الحفظ...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {isArabic ? 'حفظ التغييرات' : 'Save Changes'}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Password Change Section */}
          <div className="bg-card rounded-2xl border border-border p-6 md:p-8 mt-6 animate-fade-in-up animation-delay-200">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              {isArabic ? 'تغيير كلمة المرور' : 'Change Password'}
            </h2>

            <div className="space-y-6">
              {/* New Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {isArabic ? 'كلمة المرور الجديدة' : 'New Password'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder={isArabic ? 'أدخل كلمة المرور الجديدة' : 'Enter new password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {isArabic ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder={isArabic ? 'أعد إدخال كلمة المرور الجديدة' : 'Re-enter new password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Change Password Button */}
              <Button
                onClick={handleChangePassword}
                disabled={savingPassword}
                variant="outline"
                className="w-full gap-2"
                size="lg"
              >
                {savingPassword ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    {isArabic ? 'جاري التغيير...' : 'Changing...'}
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    {isArabic ? 'تغيير كلمة المرور' : 'Change Password'}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Notification Settings Section */}
          <div className="bg-card rounded-2xl border border-border p-6 md:p-8 mt-6 animate-fade-in-up animation-delay-250">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              {isArabic ? 'إعدادات الإشعارات' : 'Notification Settings'}
            </h2>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div className="flex items-center gap-3">
                {soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-primary" />
                ) : (
                  <VolumeX className="w-5 h-5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium text-foreground">
                    {isArabic ? 'صوت الإشعارات' : 'Notification Sound'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {soundEnabled 
                      ? (isArabic ? 'مفعّل - سيصدر صوت عند وصول إشعار جديد' : 'Enabled - Sound will play on new notifications')
                      : (isArabic ? 'معطّل' : 'Disabled')
                    }
                  </p>
                </div>
              </div>
              <Button
                variant={soundEnabled ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleSound(!soundEnabled)}
                className="gap-2"
              >
                {soundEnabled 
                  ? (isArabic ? 'تعطيل' : 'Disable')
                  : (isArabic ? 'تفعيل' : 'Enable')
                }
              </Button>
            </div>
          </div>

          {/* Google Account Linking Section - Hidden: Manual identity linking not available in Lovable Cloud */}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Settings;
