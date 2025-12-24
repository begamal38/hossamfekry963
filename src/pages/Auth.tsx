import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.jpg';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

// Validation schemas
const emailSchema = z.string().email('Invalid email address').max(255);
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters').max(72);
const nameSchema = z.string().min(2, 'Name must be at least 2 characters').max(100);
const phoneSchema = z.string().regex(/^(\+?20)?0?1[0125][0-9]{8}$/, 'رقم الموبايل غير صحيح');

const GRADE_OPTIONS = [
  { value: 'second_arabic', labelAr: 'ثانية ثانوي عربي', labelEn: '2nd Year - Arabic' },
  { value: 'second_languages', labelAr: 'ثانية ثانوي لغات', labelEn: '2nd Year - Languages' },
  { value: 'third_arabic', labelAr: 'ثالثة ثانوي عربي', labelEn: '3rd Year - Arabic' },
  { value: 'third_languages', labelAr: 'ثالثة ثانوي لغات', labelEn: '3rd Year - Languages' },
];

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [grade, setGrade] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string; phone?: string; grade?: string }>({});

  const { user, signIn, signUp, signInWithGoogle } = useAuth();
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; name?: string; phone?: string; grade?: string } = {};
    
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

      if (!grade) {
        newErrors.grade = 'يرجى اختيار المرحلة الدراسية';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendOtp = async () => {
    const phoneResult = phoneSchema.safeParse(phone);
    if (!phoneResult.success) {
      setErrors({ ...errors, phone: phoneResult.error.errors[0].message });
      return;
    }

    setOtpLoading(true);
    try {
      const response = await supabase.functions.invoke('send-otp', {
        body: { phone }
      });

      if (response.error) {
        throw response.error;
      }

      setOtpSent(true);
      setShowOtpInput(true);
      toast({
        title: 'تم إرسال الكود',
        description: 'تم إرسال كود التحقق على واتساب',
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل في إرسال كود التحقق',
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'كود التحقق يجب أن يكون 6 أرقام',
      });
      return;
    }

    setOtpLoading(true);
    try {
      const response = await supabase.functions.invoke('verify-otp', {
        body: { phone, otp }
      });

      if (response.error || !response.data?.verified) {
        throw new Error('Invalid OTP');
      }

      setPhoneVerified(true);
      setShowOtpInput(false);
      toast({
        title: 'تم التحقق',
        description: 'تم التحقق من رقم الموبايل بنجاح',
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'كود التحقق غير صحيح',
      });
    } finally {
      setOtpLoading(false);
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // For signup, require phone verification if phone is provided
    if (!isLogin && phone && !phoneVerified) {
      toast({
        variant: 'destructive',
        title: 'التحقق مطلوب',
        description: 'يرجى التحقق من رقم الموبايل أولاً',
      });
      return;
    }
    
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
          navigate('/dashboard');
        }
      } else {
        const { error } = await signUp(email, password, fullName, phone, grade);
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
          navigate('/dashboard');
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
          <img 
            src={logo} 
            alt="Hossam Fekry" 
            className="h-16 w-auto mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-foreground">
            {isLogin ? 'مرحباً بعودتك' : 'إنشاء حساب جديد'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isLogin 
              ? 'سجل دخولك لمتابعة رحلة تعلم الكيمياء'
              : 'ابدأ رحلتك في تعلم الكيمياء اليوم'
            }
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-xl">
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
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setPhoneVerified(false);
                      setOtpSent(false);
                      setShowOtpInput(false);
                    }}
                    className={cn("pl-10 pr-24", errors.phone && "border-destructive")}
                    disabled={phoneVerified}
                  />
                  {!phoneVerified && phone && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 text-xs"
                      onClick={sendOtp}
                      disabled={otpLoading || otpSent}
                    >
                      {otpLoading ? '...' : otpSent ? 'تم الإرسال' : 'تحقق'}
                    </Button>
                  )}
                  {phoneVerified && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-sm">✓</span>
                  )}
                </div>
                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                
                {/* OTP Input */}
                {showOtpInput && !phoneVerified && (
                  <div className="flex gap-2 mt-2">
                    <Input
                      type="text"
                      placeholder="أدخل كود التحقق"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={verifyOtp}
                      disabled={otpLoading || otp.length !== 6}
                    >
                      {otpLoading ? '...' : 'تأكيد'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Grade Selection - Only for Signup */}
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">المرحلة الدراسية</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className={cn(
                    "w-full h-10 px-3 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring",
                    errors.grade ? "border-destructive" : "border-input"
                  )}
                >
                  <option value="">اختر المرحلة الدراسية</option>
                  {GRADE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.labelAr}
                    </option>
                  ))}
                </select>
                {errors.grade && <p className="text-sm text-destructive">{errors.grade}</p>}
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
                  setShowOtpInput(false);
                  setOtpSent(false);
                  setPhoneVerified(false);
                }}
                className="mr-2 text-primary font-medium hover:underline"
              >
                {isLogin ? 'إنشاء حساب' : 'تسجيل الدخول'}
              </button>
            </p>
          </div>
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
