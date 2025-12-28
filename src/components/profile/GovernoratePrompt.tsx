import { useState } from 'react';
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
import { MapPin } from 'lucide-react';

interface GovernoratePromptProps {
  userId: string;
  onComplete: () => void;
}

const GovernoratePrompt = ({ userId, onComplete }: GovernoratePromptProps) => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const { toast } = useToast();
  const [governorate, setGovernorate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!governorate) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'يرجى اختيار المحافظة' : 'Please select your governorate',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ governorate })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: isRTL ? 'تم الحفظ' : 'Saved',
        description: isRTL ? 'تم حفظ المحافظة بنجاح' : 'Governorate saved successfully',
      });
      onComplete();
    } catch (error) {
      console.error('Error saving governorate:', error);
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'حدث خطأ أثناء الحفظ' : 'An error occurred while saving',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent 
        className="sm:max-w-md [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className={isRTL ? 'text-right' : 'text-left'}>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {isRTL ? 'اختر محافظتك' : 'Select Your Governorate'}
          </DialogTitle>
          <DialogDescription>
            {isRTL 
              ? 'يرجى اختيار محافظتك للمتابعة. هذه المعلومات مطلوبة لإكمال ملفك الشخصي.'
              : 'Please select your governorate to continue. This information is required to complete your profile.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Select value={governorate} onValueChange={setGovernorate}>
            <SelectTrigger className={isRTL ? 'text-right' : 'text-left'}>
              <SelectValue placeholder={isRTL ? 'اختر المحافظة' : 'Select governorate'} />
            </SelectTrigger>
            <SelectContent>
              {EGYPTIAN_GOVERNORATES.map((gov) => (
                <SelectItem key={gov.value} value={gov.value}>
                  {isRTL ? gov.label_ar : gov.label_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            onClick={handleSubmit} 
            className="w-full" 
            disabled={loading || !governorate}
          >
            {loading 
              ? (isRTL ? 'جاري الحفظ...' : 'Saving...') 
              : (isRTL ? 'حفظ والمتابعة' : 'Save and Continue')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GovernoratePrompt;
