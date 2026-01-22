/**
 * Edit Center Group Dialog
 * 
 * Allows assistant teachers to edit center group details (name, schedule).
 */

import React, { useState, useEffect } from 'react';
import { Edit3, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { CenterGroup, useCenterGroups } from '@/hooks/useCenterGroups';

interface EditCenterGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: CenterGroup | null;
  onGroupUpdated: () => void;
}

const WEEKDAYS = [
  { value: 'saturday', labelAr: 'السبت', labelEn: 'Saturday' },
  { value: 'sunday', labelAr: 'الأحد', labelEn: 'Sunday' },
  { value: 'monday', labelAr: 'الاثنين', labelEn: 'Monday' },
  { value: 'tuesday', labelAr: 'الثلاثاء', labelEn: 'Tuesday' },
  { value: 'wednesday', labelAr: 'الأربعاء', labelEn: 'Wednesday' },
  { value: 'thursday', labelAr: 'الخميس', labelEn: 'Thursday' },
  { value: 'friday', labelAr: 'الجمعة', labelEn: 'Friday' },
];

export function EditCenterGroupDialog({
  open,
  onOpenChange,
  group,
  onGroupUpdated,
}: EditCenterGroupDialogProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { updateGroup } = useCenterGroups();
  const isArabic = language === 'ar';

  const [name, setName] = useState('');
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>([]);
  const [timeSlot, setTimeSlot] = useState('');
  const [loading, setSaving] = useState(false);

  // Populate fields when group changes
  useEffect(() => {
    if (group) {
      setName(group.name);
      setDaysOfWeek(group.days_of_week || []);
      setTimeSlot(group.time_slot || '');
    }
  }, [group]);

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setName('');
      setDaysOfWeek([]);
      setTimeSlot('');
    }
  }, [open]);

  const toggleDay = (day: string) => {
    setDaysOfWeek(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleSave = async () => {
    if (!group) return;

    if (!name.trim()) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'اسم المجموعة مطلوب' : 'Group name is required',
      });
      return;
    }

    if (daysOfWeek.length < 1) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'اختر يوم واحد على الأقل' : 'Select at least one day',
      });
      return;
    }

    if (!timeSlot) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'الموعد مطلوب' : 'Time slot is required',
      });
      return;
    }

    setSaving(true);
    try {
      const success = await updateGroup(group.id, {
        name: name.trim(),
        days_of_week: daysOfWeek,
        time_slot: timeSlot,
      });

      if (success) {
        toast({
          title: isArabic ? 'تم التحديث ✅' : 'Updated ✅',
          description: isArabic ? 'تم تحديث بيانات المجموعة' : 'Group details updated successfully',
        });
        onGroupUpdated();
        onOpenChange(false);
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error('Error updating group:', error);
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'فشل تحديث المجموعة' : 'Failed to update group',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir={isArabic ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-primary" />
            {isArabic ? 'تعديل المجموعة' : 'Edit Group'}
          </DialogTitle>
          <DialogDescription>
            {isArabic 
              ? 'تعديل اسم المجموعة والمواعيد'
              : 'Edit group name and schedule'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Group Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {isArabic ? 'اسم المجموعة' : 'Group Name'}
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isArabic ? 'مثال: مجموعة السبت' : 'e.g., Saturday Group'}
            />
          </div>

          {/* Days Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {isArabic ? 'أيام الحضور' : 'Attendance Days'}
            </label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((day) => (
                <Badge
                  key={day.value}
                  variant={daysOfWeek.includes(day.value) ? 'default' : 'outline'}
                  className="cursor-pointer select-none transition-colors"
                  onClick={() => toggleDay(day.value)}
                >
                  {isArabic ? day.labelAr : day.labelEn}
                </Badge>
              ))}
            </div>
          </div>

          {/* Time Slot */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              {isArabic ? 'موعد الحصة' : 'Time Slot'}
            </label>
            <Select value={timeSlot} onValueChange={setTimeSlot}>
              <SelectTrigger>
                <SelectValue placeholder={isArabic ? 'اختر الموعد' : 'Select time'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="09:00">{isArabic ? '٩:٠٠ ص' : '9:00 AM'}</SelectItem>
                <SelectItem value="10:00">{isArabic ? '١٠:٠٠ ص' : '10:00 AM'}</SelectItem>
                <SelectItem value="11:00">{isArabic ? '١١:٠٠ ص' : '11:00 AM'}</SelectItem>
                <SelectItem value="12:00">{isArabic ? '١٢:٠٠ م' : '12:00 PM'}</SelectItem>
                <SelectItem value="13:00">{isArabic ? '١:٠٠ م' : '1:00 PM'}</SelectItem>
                <SelectItem value="14:00">{isArabic ? '٢:٠٠ م' : '2:00 PM'}</SelectItem>
                <SelectItem value="15:00">{isArabic ? '٣:٠٠ م' : '3:00 PM'}</SelectItem>
                <SelectItem value="16:00">{isArabic ? '٤:٠٠ م' : '4:00 PM'}</SelectItem>
                <SelectItem value="17:00">{isArabic ? '٥:٠٠ م' : '5:00 PM'}</SelectItem>
                <SelectItem value="18:00">{isArabic ? '٦:٠٠ م' : '6:00 PM'}</SelectItem>
                <SelectItem value="19:00">{isArabic ? '٧:٠٠ م' : '7:00 PM'}</SelectItem>
                <SelectItem value="20:00">{isArabic ? '٨:٠٠ م' : '8:00 PM'}</SelectItem>
                <SelectItem value="21:00">{isArabic ? '٩:٠٠ م' : '9:00 PM'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {isArabic ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading 
              ? (isArabic ? 'جاري الحفظ...' : 'Saving...')
              : (isArabic ? 'حفظ التغييرات' : 'Save Changes')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
