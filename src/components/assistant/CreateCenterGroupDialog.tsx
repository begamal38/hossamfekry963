/**
 * Create Center Group Dialog
 * 
 * Allows assistant teachers to create new center groups
 * for bulk student management and subscription activation.
 */

import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, Calendar, GraduationCap, BookOpen, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateCenterGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupCreated?: () => void;
}

// Grade options
const GRADE_OPTIONS = [
  { value: 'second_secondary', labelAr: 'تانية ثانوي', labelEn: '2nd Secondary' },
  { value: 'third_secondary', labelAr: 'تالته ثانوي', labelEn: '3rd Secondary' },
];

// Language track options
const LANGUAGE_TRACK_OPTIONS = [
  { value: 'arabic', labelAr: 'عربي', labelEn: 'Arabic' },
  { value: 'languages', labelAr: 'لغات', labelEn: 'Languages' },
];

// Weekdays for selection
const WEEKDAYS = [
  { value: 'saturday', labelAr: 'السبت', labelEn: 'Sat' },
  { value: 'sunday', labelAr: 'الأحد', labelEn: 'Sun' },
  { value: 'monday', labelAr: 'الاثنين', labelEn: 'Mon' },
  { value: 'tuesday', labelAr: 'الثلاثاء', labelEn: 'Tue' },
  { value: 'wednesday', labelAr: 'الأربعاء', labelEn: 'Wed' },
  { value: 'thursday', labelAr: 'الخميس', labelEn: 'Thu' },
  { value: 'friday', labelAr: 'الجمعة', labelEn: 'Fri' },
];

export function CreateCenterGroupDialog({
  open,
  onOpenChange,
  onGroupCreated,
}: CreateCenterGroupDialogProps) {
  const { language, isRTL } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const isArabic = language === 'ar';

  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [languageTrack, setLanguageTrack] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [timeSlot, setTimeSlot] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const tr = (ar: string, en: string) => isArabic ? ar : en;

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = tr('اسم المجموعة مطلوب', 'Group name is required');
    }

    if (!grade) {
      newErrors.grade = tr('يرجى اختيار الصف', 'Please select grade');
    }

    if (!languageTrack) {
      newErrors.languageTrack = tr('يرجى اختيار المسار', 'Please select track');
    }

    if (selectedDays.length < 2) {
      newErrors.days = tr('يرجى اختيار يومين على الأقل', 'Please select at least 2 days');
    }

    if (!timeSlot) {
      newErrors.time = tr('يرجى تحديد الوقت', 'Please set the time');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('center_groups')
        .insert({
          name: name.trim(),
          grade,
          language_track: languageTrack,
          days_of_week: selectedDays,
          time_slot: timeSlot,
          assistant_teacher_id: user.id,
          is_active: true,
        });

      if (error) throw error;

      toast({
        title: tr('تم إنشاء المجموعة ✅', 'Group Created ✅'),
        description: tr('تم إنشاء مجموعة السنتر بنجاح', 'Center group created successfully'),
      });

      // Reset form
      setName('');
      setGrade('');
      setLanguageTrack('');
      setSelectedDays([]);
      setTimeSlot('');
      setErrors({});

      onOpenChange(false);
      onGroupCreated?.();
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        variant: 'destructive',
        title: tr('خطأ', 'Error'),
        description: tr('فشل إنشاء المجموعة، حاول مرة أخرى', 'Failed to create group, please try again'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setGrade('');
    setLanguageTrack('');
    setSelectedDays([]);
    setTimeSlot('');
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <span>{tr('إنشاء مجموعة سنتر', 'Create Center Group')}</span>
          </DialogTitle>
          <DialogDescription>
            {tr('أنشئ مجموعة جديدة للطلاب في السنتر', 'Create a new group for center students')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Group Name */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4 text-muted-foreground" />
              {tr('اسم المجموعة', 'Group Name')}
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={tr('مثال: مجموعة الثلاثاء والخميس', 'e.g., Tuesday-Thursday Group')}
              className={cn("h-12", errors.name && "border-destructive")}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          {/* Grade */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              {tr('الصف الدراسي', 'Grade')}
            </label>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger className={cn("h-12", errors.grade && "border-destructive")}>
                <SelectValue placeholder={tr('اختر الصف', 'Select grade')} />
              </SelectTrigger>
              <SelectContent>
                {GRADE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {isArabic ? option.labelAr : option.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.grade && <p className="text-sm text-destructive">{errors.grade}</p>}
          </div>

          {/* Language Track */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              {tr('المسار', 'Track')}
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
                  {isArabic ? option.labelAr : option.labelEn}
                </button>
              ))}
            </div>
            {errors.languageTrack && <p className="text-sm text-destructive">{errors.languageTrack}</p>}
          </div>

          {/* Days Selection */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {tr('أيام الحضور (اختر يومين على الأقل)', 'Attendance Days (select at least 2)')}
            </label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((day) => (
                <Badge
                  key={day.value}
                  variant={selectedDays.includes(day.value) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer px-3 py-1.5 text-sm transition-all",
                    selectedDays.includes(day.value) 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-primary/10"
                  )}
                  onClick={() => toggleDay(day.value)}
                >
                  {isArabic ? day.labelAr : day.labelEn}
                  {selectedDays.includes(day.value) && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
            {errors.days && <p className="text-sm text-destructive">{errors.days}</p>}
          </div>

          {/* Time Slot */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-muted-foreground" />
              {tr('وقت الحصة', 'Session Time')}
            </label>
            <Input
              type="time"
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className={cn("h-12", errors.time && "border-destructive")}
            />
            {errors.time && <p className="text-sm text-destructive">{errors.time}</p>}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {tr('إلغاء', 'Cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : null}
            {tr('إنشاء المجموعة', 'Create Group')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
