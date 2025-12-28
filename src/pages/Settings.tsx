import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Camera, Save, Lock, Eye, EyeOff } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { DeviceManagement } from '@/components/settings/DeviceManagement';
import { useUserRole } from '@/hooks/useUserRole';

const GRADE_OPTIONS = [
  { value: 'second_arabic', labelAr: 'تانية ثانوي عربي', labelEn: '2nd Secondary - Arabic' },
  { value: 'second_languages', labelAr: 'تانية ثانوي لغات', labelEn: '2nd Secondary - Languages' },
  { value: 'third_arabic', labelAr: 'تالته ثانوي عربي', labelEn: '3rd Secondary - Arabic' },
  { value: 'third_languages', labelAr: 'تالته ثانوي لغات', labelEn: '3rd Secondary - Languages' },
];

const Settings: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isStudent, isAssistantTeacher, isAdmin } = useUserRole();
  
  // Students cannot change grade after initial setup
  const canChangeGrade = isAssistantTeacher() || isAdmin();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [grade, setGrade] = useState('');
  const [initialGrade, setInitialGrade] = useState(''); // Track initial grade for validation
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
          .select('full_name, phone, grade, avatar_url')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error) throw error;
        
        if (data) {
          setFullName(data.full_name || '');
          setPhone(data.phone || '');
          setGrade(data.grade || '');
          setInitialGrade(data.grade || ''); // Store initial grade
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
    
    // VALIDATION: Students cannot change grade once set
    if (isStudent() && initialGrade && grade !== initialGrade) {
      toast({
        variant: 'destructive',
        title: 'غير مسموح',
        description: 'لا يمكن تغيير المرحلة الدراسية بعد التسجيل. تواصل مع الإدارة للمساعدة.',
      });
      setGrade(initialGrade); // Reset to original
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
        })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      toast({
        title: 'تم الحفظ',
        description: 'تم تحديث بيانات الحساب بنجاح',
      });
    } catch (err) {
      console.error('Error updating profile:', err);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل في تحديث البيانات',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'يرجى إدخال كلمة المرور الجديدة وتأكيدها',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'كلمة المرور الجديدة وتأكيدها غير متطابقتين',
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
        title: 'تم التغيير',
        description: 'تم تغيير كلمة المرور بنجاح',
      });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Error changing password:', err);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: err.message || 'فشل في تغيير كلمة المرور',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const getGradeLabel = (value: string) => {
    const option = GRADE_OPTIONS.find(o => o.value === value);
    return option ? option.labelAr : value;
  };

  return (
    <div className={cn("min-h-screen bg-muted/30", isRTL && "rtl")}>
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="mb-8 animate-fade-in-up">
            <h1 className="text-3xl font-bold text-foreground mb-2">إعدادات الحساب</h1>
            <p className="text-muted-foreground">قم بتعديل بيانات حسابك</p>
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
                <label className="text-sm font-medium text-foreground">الاسم بالكامل</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="أدخل اسمك بالكامل"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Email (Read Only) */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">البريد الإلكتروني</label>
                <Input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">لا يمكن تغيير البريد الإلكتروني</p>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">رقم الواتساب</label>
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
                  <label className="text-sm font-medium text-foreground">المرحلة الدراسية</label>
                  {initialGrade ? (
                    // Students with set grade see read-only display
                    <div className="w-full h-10 px-3 rounded-md border border-input bg-muted text-foreground flex items-center">
                      {GRADE_OPTIONS.find(o => o.value === grade)?.labelAr || grade}
                    </div>
                  ) : (
                    // Students without grade can set it
                    <select
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">اختر المرحلة</option>
                      {GRADE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.labelAr}
                        </option>
                      ))}
                    </select>
                  )}
                  {initialGrade && (
                    <p className="text-xs text-muted-foreground">لا يمكن تغيير المرحلة الدراسية بعد التسجيل</p>
                  )}
                </div>
              )}

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
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    حفظ التغييرات
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Password Change Section */}
          <div className="bg-card rounded-2xl border border-border p-6 md:p-8 mt-6 animate-fade-in-up animation-delay-200">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              تغيير كلمة المرور
            </h2>

            <div className="space-y-6">
              {/* New Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">كلمة المرور الجديدة</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="أدخل كلمة المرور الجديدة"
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
                <label className="text-sm font-medium text-foreground">تأكيد كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="أعد إدخال كلمة المرور الجديدة"
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
                    جاري التغيير...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    تغيير كلمة المرور
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Device Management Section - Only for students */}
          {isStudent() && (
            <div className="bg-card rounded-2xl border border-border p-6 md:p-8 mt-6 animate-fade-in-up animation-delay-300">
              <DeviceManagement />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Settings;