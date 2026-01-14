import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { EGYPTIAN_GOVERNORATES } from '@/constants/governorates';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Validation schemas
const emailSchema = z.string().email('البريد الإلكتروني غير صحيح').max(255);
const passwordSchema = z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل').max(72);
// Quadruple name validation: minimum 4 words
const nameSchema = z.string()
  .min(8, 'الاسم قصير جداً')
  .max(100, 'الاسم طويل جداً')
  .refine(
    (name) => name.trim().split(/\s+/).filter(word => word.length > 0).length >= 4,
    { message: 'يرجى إدخال الاسم الرباعي كاملاً (4 كلمات على الأقل)' }
  );
// Egyptian phone: exactly 11 digits starting with 01 followed by 0, 1, 2, or 5
const phoneSchema = z.string()
  .regex(/^01[0125][0-9]{8}$/, 'رقم الموبايل غير صحيح - يجب أن يكون 11 رقم');

// Academic year options
const ACADEMIC_YEAR_OPTIONS = [
  { value: 'second_secondary', labelAr: 'تانية ثانوي', labelEn: '2nd Secondary' },
  { value: 'third_secondary', labelAr: 'تالته ثانوي', labelEn: '3rd Secondary' },
];

// Language track options
const LANGUAGE_TRACK_OPTIONS = [
  { value: 'arabic', labelAr: 'عربي', labelEn: 'Arabic' },
  { value: 'languages', labelAr: 'لغات', labelEn: 'Languages' },
];

// Combined grade label for display
const getGroupLabel = (academicYear: string, languageTrack: string, isArabic: boolean) => {
  const yearLabel = ACADEMIC_YEAR_OPTIONS.find(o => o.value === academicYear);
  const trackLabel = LANGUAGE_TRACK_OPTIONS.find(o => o.value === languageTrack);
  if (!yearLabel || !trackLabel) return '';
  return isArabic 
    ? `${yearLabel.labelAr} - ${trackLabel.labelAr}`
    : `${yearLabel.labelEn} - ${trackLabel.labelEn}`;
};

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'signup');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [languageTrack, setLanguageTrack] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [showGroupConfirmation, setShowGroupConfirmation] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string; phone?: string; academicYear?: string; languageTrack?: string; governorate?: string }>({});

  const { user, signIn, signUp, signInWithGoogle } = useAuth();
  const { loading: roleLoading, hasAttemptedFetch, isAssistantTeacher, isAdmin } = useUserRole();
  const { toast } = useToast();
  const navigate = useNavigate();

  // المنصة عربية أولاً: صفحة الدخول/التسجيل RTL دائماً
  const isRTL = true;
  const iconSideClass = 'right-3';
  const inputIconPadding = 'pr-10';
  const textStartAlign = 'text-right';

  // إظهار أخطاء تسجيل الدخول بجوجل لو رجعت في الرابط (بدون ما يبان Toast)
  useEffect(() => {
    const searchParamsObj = new URLSearchParams(window.location.search);
    const hashParamsObj = new URLSearchParams((window.location.hash || '').replace(/^#/, ''));

    const error =
      searchParamsObj.get('error') ||
      searchParamsObj.get('error_code') ||
      hashParamsObj.get('error') ||
      hashParamsObj.get('error_code');

    const errorDescription =
      searchParamsObj.get('error_description') ||
      hashParamsObj.get('error_description');

    if (!error && !errorDescription) return;

    toast({
      variant: 'destructive',
      title: 'فشل تسجيل الدخول',
      description:
        decodeURIComponent(errorDescription || '') ||
        'حصلت مشكلة أثناء تسجيل الدخول، جرّب تاني.',
    });

    // تنظيف الرابط عشان مايتكررش التوست
    try {
      searchParamsObj.delete('error');
      searchParamsObj.delete('error_code');
      searchParamsObj.delete('error_description');
      const nextSearch = searchParamsObj.toString();

      // امسح الـ hash كمان (لو الخطأ جاي من هناك)
      if (window.location.hash) {
        window.history.replaceState(null, '', `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}`);
      }

      navigate(`/auth${nextSearch ? `?${nextSearch}` : ''}`, { replace: true });
    } catch {
      // ignore
    }
  }, [navigate, toast]);

  // بعد تسجيل الدخول: ننتظر تحميل الدور ثم نوجّه المستخدم صح
  useEffect(() => {
    if (!user) return;

    // لو فيه redirect صريح (مثلاً صفحة طلبت تسجيل دخول)
    const redirect = searchParams.get('redirect');
    if (redirect) {
      navigate(redirect, { replace: true });
      return;
    }

    // مهم جداً: ما نعملش redirect قبل ما الدور يتحسم (عشان ما يحصلش لخبطة/Loop)
    if (roleLoading || !hasAttemptedFetch) return;

    // قواعد المنصة:
    // - الطالب -> الرئيسية
    // - المدرس المساعد/الأدمن -> تحويل آمن للوحة المدرس
    // Fail-safe: لو الدور مش واضح لأي سبب، اسمح بالدخول (الرئيسية)
    if (isAssistantTeacher() || isAdmin()) {
      navigate('/assistant-transition', { replace: true });
      return;
    }

    navigate('/', { replace: true });
  }, [user, roleLoading, hasAttemptedFetch, searchParams, navigate, isAssistantTeacher, isAdmin]);
  const validateForm = () => {
    const newErrors: { email?: string; password?: string; name?: string; phone?: string; academicYear?: string; languageTrack?: string; governorate?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    if (!isLogin) {
      const nameResult = nameSchema.safeParse(fullName.trim());
      if (!nameResult.success) {
        newErrors.name = nameResult.error.errors[0].message;
      }

      // Phone is REQUIRED for signup
      if (!phone || phone.trim() === '') {
        newErrors.phone = 'رقم الموبايل مطلوب';
      } else {
        const phoneResult = phoneSchema.safeParse(phone.trim());
        if (!phoneResult.success) {
          newErrors.phone = phoneResult.error.errors[0].message;
        }
      }

      if (!academicYear) {
        newErrors.academicYear = 'يرجى اختيار الصف الدراسي';
      }

      if (!languageTrack) {
        newErrors.languageTrack = 'يرجى اختيار نوع التعليم';
      }

      if (!governorate) {
        newErrors.governorate = 'يرجى اختيار المحافظة';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        // Handle specific Google OAuth errors in Arabic
        let errorMessage = 'حصلت مشكلة أثناء تسجيل الدخول، حاول مرة أخرى.';
        
        if (error.message.includes('popup_closed')) {
          errorMessage = 'تم إغلاق نافذة تسجيل الدخول. حاول مرة أخرى.';
        } else if (error.message.includes('access_denied')) {
          errorMessage = 'تم رفض الوصول. يرجى المحاولة مرة أخرى.';
        } else if (error.message.includes('network')) {
          errorMessage = 'خطأ في الاتصال. تحقق من اتصالك بالإنترنت.';
        }
        
        toast({
          variant: 'destructive',
          title: 'فشل تسجيل الدخول بـ Google',
          description: errorMessage,
        });
      }
      // Success is handled by OAuth redirect - no need for toast here
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'حصلت مشكلة أثناء تسجيل الدخول، حاول مرة أخرى.',
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setErrors({ email: emailResult.error.errors[0].message });
      return;
    }

    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });

      if (error) throw error;

      toast({
        title: 'تم الإرسال',
        description: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني',
      });
      setIsForgotPassword(false);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: err.message || 'فشل في إرسال رابط إعادة التعيين',
      });
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          const isInvalid = error.message.includes('Invalid login credentials');
          toast({
            variant: 'destructive',
            title: 'فشل تسجيل الدخول',
            description: isInvalid ? 'الإيميل أو كلمة المرور غير صحيحة.' : (error.message || 'حصلت مشكلة، حاول مرة أخرى.'),
          });
        }
      } else {
        const { error } = await signUp(email, password, fullName, phone, academicYear, languageTrack, governorate);
        if (error) {
          const already = error.message.toLowerCase().includes('already') || error.message.toLowerCase().includes('registered');
          toast({
            variant: 'destructive',
            title: 'فشل إنشاء الحساب',
            description: already ? 'هذا البريد مسجل بالفعل. جرّب تسجيل الدخول.' : (error.message || 'حصلت مشكلة، حاول مرة أخرى.'),
          });
        }
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'حصلت مشكلة، حاول مرة أخرى.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading screen when user is authenticated but role is still loading
  // This prevents the "nothing happens" issue on mobile
  const isPostLoginLoading = user && (roleLoading || !hasAttemptedFetch);

  if (isPostLoginLoading) {
    return (
      <div
        dir={isRTL ? 'rtl' : 'ltr'}
        lang="ar"
        className={cn("min-h-screen bg-gradient-hero flex items-center justify-center p-4", isRTL && "rtl")}
      >
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-pulse-glow animation-delay-200" />

        <div className="relative text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">جاري تحميل حسابك...</h2>
          <p className="text-muted-foreground">يرجى الانتظار لحظة</p>
        </div>
      </div>
    );
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} lang="ar" className={cn("min-h-screen bg-background flex flex-col", isRTL && "rtl")}>
      <Navbar />
      {/* Mobile-first header with gradient - Vodafone inspired */}
      <div className="pt-16 bg-gradient-to-br from-primary via-primary to-accent pt-safe-top pb-8 px-4 rounded-b-[2rem] relative overflow-hidden">
        {/* Abstract shapes for visual interest */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-4 left-4 w-20 h-20 bg-white/5 rounded-full" />

        <div className="relative z-10 pt-4">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {isForgotPassword ? 'استعادة كلمة المرور' : isLogin ? 'أهلاً بيك!' : 'ابدأ رحلتك'}
          </h1>
          <p className="text-white/80 text-sm md:text-base">
            {isForgotPassword
              ? 'هنبعتلك رابط لإعادة تعيين كلمة المرور'
              : isLogin
                ? 'سجّل دخولك وكمّل مذاكرتك'
                : 'سجّل في ثواني وابدأ تعلم الكيمياء'}
          </p>
        </div>
      </div>
      
      {/* Main content area - pulled up to overlap header */}
      <div className="flex-1 px-4 -mt-4 pb-8">
        <div className="bg-card rounded-2xl shadow-lg border border-border p-5 md:p-6 max-w-md mx-auto overflow-hidden">
          <AnimatePresence mode="wait">
            {isForgotPassword ? (
              /* Forgot Password Form */
              <motion.form
                key="forgot-password"
                initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                onSubmit={handleForgotPassword}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">البريد الإلكتروني</label>
                  <div className="relative">
                    <Mail
                      className={cn(
                        "absolute top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground",
                        iconSideClass
                      )}
                    />
                    <Input
                      type="email"
                      placeholder="أدخل بريدك الإلكتروني"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={cn(inputIconPadding, "h-12 text-base", errors.email && "border-destructive")}
                    />
                  </div>
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-12 text-base font-semibold rounded-xl"
                  disabled={resetLoading}
                >
                  {resetLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      جاري الإرسال...
                    </span>
                  ) : (
                    'إرسال رابط الاستعادة'
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setErrors({});
                  }}
                  className="w-full text-center text-primary font-medium hover:underline py-2"
                >
                  ← العودة لتسجيل الدخول
                </button>
              </motion.form>
            ) : (
              <motion.div
                key={isLogin ? 'login' : 'signup'}
                initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
              {/* Google Sign In - Featured prominently for signup */}
              {!isLogin && (
                <div className="mb-5 p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">⚡</span>
                    <span className="text-sm font-semibold text-foreground">أسرع طريقة للتسجيل</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    سجّل بحسابك في Google في ثانية واحدة - من غير باسورد!
                  </p>
                  <Button
                    type="button"
                    size="lg"
                    className="w-full h-12 gap-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm font-medium rounded-xl"
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading}
                  >
                    {googleLoading ? (
                      <div className="w-5 h-5 border-2 border-gray-400/30 border-t-gray-600 rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                    )}
                    التسجيل بـ Google
                  </Button>
                </div>
              )}

              {/* Login: Simple Google button */}
              {isLogin && (
                <Button
                  type="button"
                  size="lg"
                  className="w-full h-12 mb-4 gap-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm font-medium rounded-xl"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                >
                  {googleLoading ? (
                    <div className="w-5 h-5 border-2 border-gray-400/30 border-t-gray-600 rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  الدخول بـ Google
                </Button>
              )}

              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-card text-muted-foreground">
                    {isLogin ? 'أو بالإيميل' : 'أو سجّل بالإيميل'}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name - Only for Signup */}
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">الاسم الرباعي</label>
                <p className="text-xs text-muted-foreground">
                  ⚠️ اكتب اسمك زي ما هو في البطاقة
                </p>
                <div className="relative">
                  <User
                    className={cn(
                      "absolute top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground",
                      iconSideClass
                    )}
                  />
                  <Input
                    type="text"
                    placeholder="الاسم الأول + الأب + الجد + العائلة"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={cn(inputIconPadding, "h-12 text-base rounded-xl", errors.name && "border-destructive")}
                  />
                </div>
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>
            )}

            {/* Phone - Only for Signup */}
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">رقم الواتساب</label>
                 <div className="relative">
                   <Phone
                     className={cn(
                       "absolute top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground",
                       iconSideClass
                     )}
                   />
                   <Input
                     type="tel"
                     placeholder="01xxxxxxxxx"
                     value={phone}
                     onChange={(e) => setPhone(e.target.value)}
                     className={cn(inputIconPadding, "h-12 text-base rounded-xl", errors.phone && "border-destructive")}
                   />
                 </div>
                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
              </div>
            )}

            {/* Academic Group Selection - Only for Signup */}
            {!isLogin && (
              <div className="space-y-3">
                {/* Academic Year Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">الصف الدراسي</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ACADEMIC_YEAR_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setAcademicYear(option.value)}
                        className={cn(
                          "p-3.5 rounded-xl border-2 text-sm font-semibold transition-all",
                          academicYear === option.value
                            ? "border-primary bg-primary/10 text-primary shadow-sm"
                            : "border-border bg-background hover:border-primary/50"
                        )}
                      >
                        {option.labelAr}
                      </button>
                    ))}
                  </div>
                  {errors.academicYear && <p className="text-sm text-destructive">{errors.academicYear}</p>}
                </div>

                {/* Language Track Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">نوع التعليم</label>
                  <div className="grid grid-cols-2 gap-2">
                    {LANGUAGE_TRACK_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setLanguageTrack(option.value)}
                        className={cn(
                          "p-3.5 rounded-xl border-2 text-sm font-semibold transition-all",
                          languageTrack === option.value
                            ? "border-primary bg-primary/10 text-primary shadow-sm"
                            : "border-border bg-background hover:border-primary/50"
                        )}
                      >
                        {option.labelAr}
                      </button>
                    ))}
                  </div>
                  {errors.languageTrack && <p className="text-sm text-destructive">{errors.languageTrack}</p>}
                </div>

                {/* Governorate Selection */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    المحافظة
                  </label>
                  <Select value={governorate} onValueChange={setGovernorate}>
                    <SelectTrigger className={cn("h-12 rounded-xl text-base", errors.governorate && "border-destructive")}>
                      <SelectValue placeholder="اختر محافظتك" />
                    </SelectTrigger>
                    <SelectContent>
                      {EGYPTIAN_GOVERNORATES.map((gov) => (
                        <SelectItem key={gov.value} value={gov.value}>
                          {gov.label_ar}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.governorate && <p className="text-sm text-destructive">{errors.governorate}</p>}
                </div>

                {/* Selected Group Preview */}
                {academicYear && languageTrack && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-center">
                    <p className="text-xs text-muted-foreground">مجموعتك:</p>
                    <p className="font-bold text-primary">
                      {getGroupLabel(academicYear, languageTrack, true)}
                    </p>
                  </div>
                )}

                {/* Warning note - compact */}
                <p className="text-xs text-muted-foreground text-center">
                  ⚠️ لا يمكن تغيير المجموعة بعد التسجيل
                </p>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">البريد الإلكتروني</label>
              <div className="relative">
                <Mail
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground",
                    iconSideClass
                  )}
                />
                <Input
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(inputIconPadding, "h-12 text-base rounded-xl", errors.email && "border-destructive")}
                />
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">كلمة المرور</label>
              <div className="relative">
                <Lock
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground",
                    iconSideClass
                  )}
                />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="6 أحرف على الأقل"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(
                    inputIconPadding,
                    isRTL ? 'pl-10' : 'pr-10',
                    "h-12 text-base rounded-xl",
                    errors.password && "border-destructive"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1",
                    isRTL ? 'left-3' : 'right-3'
                  )}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              
              {/* Forgot Password Link - Only show on login */}
              {isLogin && (
                <div className={textStartAlign}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setErrors({});
                    }}
                    className="text-sm text-primary hover:underline"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full h-12 text-base font-semibold rounded-xl"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  {isLogin ? 'جاري الدخول...' : 'جاري التسجيل...'}
                </span>
              ) : (
                isLogin ? 'تسجيل الدخول' : 'إنشاء حساب'
              )}
            </Button>
          </form>

          {/* Toggle Auth Mode */}
          <div className="mt-5 pt-4 border-t border-border text-center">
            <p className="text-sm text-muted-foreground inline-flex items-center justify-center gap-1 flex-wrap">
              <span>{isLogin ? 'مش معانا لسه؟' : 'عندك حساب؟'}</span>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                }}
                className="text-primary font-semibold hover:underline"
              >
                {isLogin ? 'سجّل دلوقتي' : 'سجّل دخول'}
              </button>
            </p>
          </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Back to Home - subtle */}
        <div className="mt-4 text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← الرجوع للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Auth;
