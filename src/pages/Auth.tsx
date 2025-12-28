import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';
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
const emailSchema = z.string().email('Invalid email address').max(255);
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters').max(72);
const nameSchema = z.string().min(2, 'Name must be at least 2 characters').max(100);
const phoneSchema = z.string().regex(/^(\+?20)?0?1[0125][0-9]{8}$/, 'رقم الموبايل غير صحيح');

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
  const { canAccessDashboard, isAssistantTeacher, isAdmin, loading: roleLoading } = useUserRole();
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect if already logged in - based on role (or explicit redirect)
  useEffect(() => {
    if (!user || roleLoading) return;

    const redirect = searchParams.get('redirect');
    if (redirect) {
      navigate(redirect);
      return;
    }

    // Check if user is assistant teacher or admin - they go to /assistant
    const isStaff = isAssistantTeacher() || isAdmin();
    navigate(isStaff ? '/assistant' : '/dashboard');
  }, [user, roleLoading, isAssistantTeacher, isAdmin, navigate, searchParams]);

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
      const nameResult = nameSchema.safeParse(fullName);
      if (!nameResult.success) {
        newErrors.name = nameResult.error.errors[0].message;
      }

      if (phone) {
        const phoneResult = phoneSchema.safeParse(phone);
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
        toast({
          variant: 'destructive',
          title: 'Google Sign In Failed',
          description: error.message,
        });
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Something went wrong with Google sign in.',
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
          if (error.message.includes('Invalid login credentials')) {
            toast({
              variant: 'destructive',
              title: 'Login Failed',
              description: 'Invalid email or password. Please try again.',
            });
          } else {
            toast({
              variant: 'destructive',
              title: 'Login Failed',
              description: error.message,
            });
          }
        } else {
          toast({
            title: 'Welcome back!',
            description: 'You have successfully logged in.',
          });
          // Redirect will happen automatically via useEffect
        }
      } else {
        const { error } = await signUp(email, password, fullName, phone, academicYear, languageTrack, governorate);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              variant: 'destructive',
              title: 'Signup Failed',
              description: 'This email is already registered. Please login instead.',
            });
          } else {
            toast({
              variant: 'destructive',
              title: 'Signup Failed',
              description: error.message,
            });
          }
        } else {
          toast({
            title: 'Account created!',
            description: 'Welcome to Hossam Fekry Chemistry Platform.',
          });
          // Redirect will happen automatically via useEffect (new users go to student dashboard)
        }
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Something went wrong. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("min-h-screen bg-gradient-hero flex items-center justify-center p-4", isRTL && "rtl")}>
      {/* Background Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-pulse-glow animation-delay-200" />
      
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/">
            <img 
              src={logo} 
              alt="Hossam Fekry" 
              className="h-16 w-auto mx-auto mb-4 hover:opacity-80 transition-opacity cursor-pointer"
            />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            {isForgotPassword 
              ? 'استعادة كلمة المرور'
              : isLogin ? 'مرحباً بعودتك' : 'إنشاء حساب جديد'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isForgotPassword
              ? 'أدخل بريدك الإلكتروني لإرسال رابط إعادة التعيين'
              : isLogin 
                ? 'سجل دخولك لمتابعة رحلة تعلم الكيمياء'
                : 'ابدأ رحلتك في تعلم الكيمياء اليوم'
            }
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-xl">
          {isForgotPassword ? (
            /* Forgot Password Form */
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="أدخل بريدك الإلكتروني"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={cn("pl-10", errors.email && "border-destructive")}
                  />
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={resetLoading}
              >
                {resetLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    جاري الإرسال...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    إرسال رابط الاستعادة
                    <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setErrors({});
                  }}
                  className="text-primary font-medium hover:underline"
                >
                  ← العودة لتسجيل الدخول
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Google Sign In Button */}
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full mb-6 gap-3"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
              >
                {googleLoading ? (
                  <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                {isLogin ? 'تسجيل الدخول بـ Google' : 'التسجيل بـ Google'}
              </Button>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-card text-muted-foreground">أو</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name - Only for Signup */}
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">الاسم بالكامل</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="أدخل اسمك بالكامل"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={cn("pl-10", errors.name && "border-destructive")}
                  />
                </div>
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>
            )}

            {/* Phone - Only for Signup */}
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">رقم الواتساب</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="01xxxxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={cn("pl-10", errors.phone && "border-destructive")}
                  />
                </div>
                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
              </div>
            )}

            {/* Academic Group Selection - Only for Signup */}
            {!isLogin && (
              <div className="space-y-4">
                {/* Warning Banner */}
                <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
                  <p className="text-sm text-warning-foreground font-medium flex items-center gap-2">
                    ⚠️ تنبيه مهم
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    لا يمكن تغيير المجموعة الدراسية بعد التسجيل. يرجى التأكد من اختيار البيانات الصحيحة.
                  </p>
                </div>

                {/* Academic Year Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">الصف الدراسي</label>
                  <div className="grid grid-cols-2 gap-3">
                    {ACADEMIC_YEAR_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setAcademicYear(option.value)}
                        className={cn(
                          "p-3 rounded-lg border-2 text-sm font-medium transition-all",
                          academicYear === option.value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card hover:border-primary/50"
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
                  <div className="grid grid-cols-2 gap-3">
                    {LANGUAGE_TRACK_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setLanguageTrack(option.value)}
                        className={cn(
                          "p-3 rounded-lg border-2 text-sm font-medium transition-all",
                          languageTrack === option.value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card hover:border-primary/50"
                        )}
                      >
                        {option.labelAr}
                      </button>
                    ))}
                  </div>
                  {errors.languageTrack && <p className="text-sm text-destructive">{errors.languageTrack}</p>}
                </div>

                {/* Governorate Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    المحافظة
                  </label>
                  <Select value={governorate} onValueChange={setGovernorate}>
                    <SelectTrigger className={cn(errors.governorate && "border-destructive")}>
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
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">المجموعة المختارة:</p>
                    <p className="font-semibold text-primary">
                      {getGroupLabel(academicYear, languageTrack, true)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="أدخل بريدك الإلكتروني"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn("pl-10", errors.email && "border-destructive")}
                />
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="أدخل كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn("pl-10 pr-10", errors.password && "border-destructive")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              
              {/* Forgot Password Link - Only show on login */}
              {isLogin && (
                <div className="text-left">
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
              variant="hero"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  {isLogin ? 'جاري تسجيل الدخول...' : 'جاري إنشاء الحساب...'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب'}
                  <ArrowRight className="w-5 h-5" />
                </span>
              )}
            </Button>
          </form>

          {/* Toggle Auth Mode */}
          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              {isLogin ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                }}
                className="mr-2 text-primary font-medium hover:underline"
              >
                {isLogin ? 'إنشاء حساب' : 'تسجيل الدخول'}
              </button>
            </p>
          </div>
            </>
          )}
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Button variant="ghost" asChild>
            <a href="/" className="text-muted-foreground hover:text-foreground">
              → العودة للرئيسية
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
