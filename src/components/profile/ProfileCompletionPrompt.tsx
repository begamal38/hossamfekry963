import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EGYPTIAN_GOVERNORATES } from '@/constants/governorates';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, GraduationCap, MapPin, Phone, BookOpen, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';
import { cn } from '@/lib/utils';

interface MissingFields {
  grade: boolean;
  language_track: boolean;
  governorate: boolean;
  phone: boolean;
  full_name: boolean;
}

interface ProfileCompletionPromptProps {
  userId: string;
  missingFields: MissingFields;
  onComplete: () => void;
}

// Validation schemas
const nameSchema = z.string()
  .min(8, 'الاسم قصير جداً')
  .max(100, 'الاسم طويل جداً')
  .refine(
    (name) => name.trim().split(/\s+/).filter(word => word.length > 0).length >= 4,
    { message: 'يرجى إدخال الاسم الرباعي كاملاً (4 كلمات على الأقل)' }
  );

const phoneSchema = z.string()
  .regex(/^01[0125][0-9]{8}$/, 'رقم الموبايل غير صحيح - يجب أن يكون 11 رقم');

// Academic year options
const ACADEMIC_YEAR_OPTIONS = [
  { value: 'second_secondary', labelAr: 'تانية ثانوي' },
  { value: 'third_secondary', labelAr: 'تالته ثانوي' },
];

// Language track options
const LANGUAGE_TRACK_OPTIONS = [
  { value: 'arabic', labelAr: 'عربي' },
  { value: 'languages', labelAr: 'لغات' },
];

const ProfileCompletionPrompt = ({ userId, missingFields, onComplete }: ProfileCompletionPromptProps) => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const { toast } = useToast();
  
  const [fullName, setFullName] = useState('');
  const [grade, setGrade] = useState('');
  const [languageTrack, setLanguageTrack] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load existing profile data
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, grade, language_track, governorate, phone')
          .eq('user_id', userId)
          .single();

        if (data) {
          if (data.full_name) setFullName(data.full_name);
          if (data.grade) setGrade(data.grade);
          if (data.language_track) setLanguageTrack(data.language_track);
          if (data.governorate) setGovernorate(data.governorate);
          if (data.phone) setPhone(data.phone);
        }
      } catch (error) {
        console.error('Error loading existing profile:', error);
      }
    };

    loadExistingData();
  }, [userId]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (missingFields.full_name) {
      const nameResult = nameSchema.safeParse(fullName.trim());
      if (!nameResult.success) {
        newErrors.fullName = nameResult.error.errors[0].message;
      }
    }

    if (missingFields.grade && !grade) {
      newErrors.grade = 'يرجى اختيار الصف الدراسي';
    }

    if (missingFields.language_track && !languageTrack) {
      newErrors.languageTrack = 'يرجى اختيار نوع التعليم';
    }

    if (missingFields.governorate && !governorate) {
      newErrors.governorate = 'يرجى اختيار المحافظة';
    }

    if (missingFields.phone) {
      if (!phone || phone.trim() === '') {
        newErrors.phone = 'رقم الموبايل مطلوب';
      } else {
        const phoneResult = phoneSchema.safeParse(phone.trim());
        if (!phoneResult.success) {
          newErrors.phone = phoneResult.error.errors[0].message;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper function to compute proper grade value from academic year + language track
  const computeGradeValue = (academicYear: string, langTrack: string): string => {
    // DB expects: second_arabic, second_languages, third_arabic, third_languages
    if (academicYear === 'second_secondary') {
      return langTrack === 'languages' ? 'second_languages' : 'second_arabic';
    } else if (academicYear === 'third_secondary') {
      return langTrack === 'languages' ? 'third_languages' : 'third_arabic';
    }
    // Fallback - should not reach here
    return academicYear;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Build update data object - only include fields that are missing AND have values
      const updateData: Record<string, string | null> = {};
      
      if (missingFields.full_name && fullName.trim()) {
        updateData.full_name = fullName.trim();
      }
      
      // Handle grade + language_track combination
      // The DB constraint requires: second_arabic, second_languages, third_arabic, third_languages
      if ((missingFields.grade || missingFields.language_track) && grade && languageTrack) {
        const computedGrade = computeGradeValue(grade, languageTrack);
        updateData.grade = computedGrade;
        updateData.language_track = languageTrack;
      } else {
        // Handle individual field updates if only one is missing
        if (missingFields.language_track && languageTrack) {
          updateData.language_track = languageTrack;
        }
      }
      
      if (missingFields.governorate && governorate) {
        updateData.governorate = governorate;
      }
      
      // Phone number handling with duplicate check
      if (missingFields.phone && phone.trim()) {
        const phoneValue = phone.trim();
        
        // Check if phone already exists for another user
        const { data: existingPhone, error: phoneCheckError } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('phone', phoneValue)
          .neq('user_id', userId)
          .maybeSingle();
        
        if (phoneCheckError) {
          console.error('Error checking phone:', phoneCheckError);
        } else if (existingPhone) {
          // Phone belongs to another user
          setErrors(prev => ({ ...prev, phone: 'رقم الموبايل مستخدم بحساب آخر' }));
          setLoading(false);
          return;
        }
        
        updateData.phone = phoneValue;
      }

      // Check if there's anything to update
      if (Object.keys(updateData).length === 0) {
        toast({
          title: 'تم الحفظ بنجاح ✅',
          description: 'بياناتك محدثة بالفعل',
        });
        onComplete();
        return;
      }

      // First, check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('user_id, phone')
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking profile:', checkError);
        throw new Error('network');
      }

      let saveError;

      if (existingProfile) {
        // Profile exists - UPDATE it (most common case for Google OAuth)
        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('user_id', userId);
        saveError = error;
      } else {
        // Profile doesn't exist - INSERT it (rare edge case)
        const { error } = await supabase
          .from('profiles')
          .insert({ 
            user_id: userId, 
            ...updateData 
          });
        saveError = error;
      }

      if (saveError) {
        console.error('Error saving profile:', saveError);
        
        // Parse specific constraint errors for better messaging
        if (saveError.code === '23514') {
          // Check constraint violation
          if (saveError.message?.includes('grade_valid')) {
            throw new Error('grade_invalid');
          } else if (saveError.message?.includes('phone_format')) {
            throw new Error('phone_invalid');
          } else if (saveError.message?.includes('language_track')) {
            throw new Error('language_invalid');
          }
        } else if (saveError.code === '42501' || saveError.message?.includes('permission')) {
          throw new Error('permission');
        } else if (saveError.code === '23505') {
          // Unique constraint violation
          if (saveError.message?.includes('phone')) {
            setErrors(prev => ({ ...prev, phone: 'رقم الموبايل مستخدم بحساب آخر' }));
            setLoading(false);
            return;
          }
          throw new Error('duplicate');
        } else {
          throw new Error('save');
        }
      }

      // Success - refresh session to ensure auth state is current
      try {
        await supabase.auth.refreshSession();
      } catch {
        // Non-critical, continue
      }

      toast({
        title: 'تم الحفظ بنجاح ✅',
        description: 'تم تحديث بياناتك بنجاح',
      });
      onComplete();
    } catch (error) {
      console.error('Error saving profile:', error);
      
      // Provide descriptive error messages based on error type
      const errorMessage = error instanceof Error ? error.message : 'unknown';
      let title = 'تعذر حفظ البيانات';
      let description = '';
      
      switch (errorMessage) {
        case 'network':
          description = 'تعذر الاتصال بالخادم، تأكد من اتصالك بالإنترنت وحاول مرة أخرى';
          break;
        case 'permission':
          description = 'لا يمكن حفظ البيانات حالياً، يرجى تسجيل الخروج وإعادة تسجيل الدخول';
          break;
        case 'duplicate':
          description = 'البيانات موجودة بالفعل، جاري تحديث الصفحة...';
          setTimeout(() => window.location.reload(), 1500);
          break;
        case 'grade_invalid':
          title = 'خطأ في الصف الدراسي';
          description = 'يرجى اختيار الصف الدراسي ونوع التعليم بشكل صحيح';
          break;
        case 'phone_invalid':
          title = 'خطأ في رقم الموبايل';
          description = 'رقم الموبايل غير صحيح، يجب أن يبدأ بـ 01 ويتكون من 11 رقم';
          break;
        case 'language_invalid':
          title = 'خطأ في نوع التعليم';
          description = 'يرجى اختيار نوع التعليم (عربي أو لغات)';
          break;
        case 'save':
        default:
          description = 'حدث خطأ مؤقت، حاول لاحقاً';
      }
      
      toast({
        title,
        description,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Count missing fields
  const missingCount = Object.values(missingFields).filter(v => v).length;

  return (
    <Dialog open={true}>
      <DialogContent 
        className="sm:max-w-md max-h-[90vh] overflow-y-auto [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className={cn("text-right", !isRTL && "text-left")}>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <span>أكمل بياناتك 📝</span>
          </DialogTitle>
          <DialogDescription className="text-base">
            محتاجين شوية بيانات عشان تقدر تستخدم المنصة
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg mb-4">
          <div className="flex-1">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${((5 - missingCount) / 5) * 100}%` }}
              />
            </div>
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {missingCount} بيانات مطلوبة
          </span>
        </div>

        <div className="space-y-4">
          {/* Full Name */}
          {missingFields.full_name && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4 text-muted-foreground" />
                الاسم الرباعي
              </label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="أدخل اسمك رباعي"
                className={cn("h-12 text-base", errors.fullName && "border-destructive")}
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">{errors.fullName}</p>
              )}
            </div>
          )}

          {/* Phone */}
          {missingFields.phone && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Phone className="h-4 w-4 text-muted-foreground" />
                رقم الموبايل
              </label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="01xxxxxxxxx"
                className={cn("h-12 text-base text-left", errors.phone && "border-destructive")}
                dir="ltr"
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
            </div>
          )}

          {/* Grade (Academic Year) */}
          {missingFields.grade && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                الصف الدراسي
              </label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger className={cn("h-12 text-base", errors.grade && "border-destructive")}>
                  <SelectValue placeholder="اختر الصف الدراسي" />
                </SelectTrigger>
                <SelectContent>
                  {ACADEMIC_YEAR_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-base py-3">
                      {option.labelAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.grade && (
                <p className="text-sm text-destructive">{errors.grade}</p>
              )}
            </div>
          )}

          {/* Language Track */}
          {missingFields.language_track && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                نوع التعليم
              </label>
              <div className="grid grid-cols-2 gap-3">
                {LANGUAGE_TRACK_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setLanguageTrack(option.value)}
                    className={cn(
                      "h-12 rounded-xl border-2 font-medium transition-all",
                      languageTrack === option.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {option.labelAr}
                  </button>
                ))}
              </div>
              {errors.languageTrack && (
                <p className="text-sm text-destructive">{errors.languageTrack}</p>
              )}
            </div>
          )}

          {/* Governorate */}
          {missingFields.governorate && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                المحافظة
              </label>
              <Select value={governorate} onValueChange={setGovernorate}>
                <SelectTrigger className={cn("h-12 text-base", errors.governorate && "border-destructive")}>
                  <SelectValue placeholder="اختر المحافظة" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {EGYPTIAN_GOVERNORATES.map((gov) => (
                    <SelectItem key={gov.value} value={gov.value} className="text-base py-3">
                      {gov.label_ar}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.governorate && (
                <p className="text-sm text-destructive">{errors.governorate}</p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <Button 
            onClick={handleSubmit} 
            className="w-full h-12 text-base font-semibold rounded-xl mt-4" 
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                جاري الحفظ...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                حفظ والمتابعة
              </span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileCompletionPrompt;
