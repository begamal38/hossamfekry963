import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Plus, Trash2, GripVertical, Save, ArrowRight, ArrowLeft, Users } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AssistantPageHeader } from '@/components/assistant/AssistantPageHeader';

interface TopStudent {
  id: string;
  student_name_ar: string;
  student_name_en: string;
  display_month: string;
  display_order: number;
  is_active: boolean;
}

// Simple Arabic to English transliteration
const transliterateArabicToEnglish = (arabicName: string): string => {
  const translitMap: Record<string, string> = {
    'ا': 'a', 'أ': 'a', 'إ': 'e', 'آ': 'aa', 'ب': 'b', 'ت': 't', 'ث': 'th',
    'ج': 'g', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'z', 'ر': 'r', 'ز': 'z',
    'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a',
    'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
    'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a', 'ة': 'a', 'ء': '', 'ئ': 'e',
    'ؤ': 'o', ' ': ' '
  };
  
  let result = '';
  for (const char of arabicName) {
    result += translitMap[char] || char;
  }
  
  // Capitalize first letter of each word
  return result
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const TopStudents: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language, isRTL } = useLanguage();
  const { user } = useAuth();
  const isArabic = language === 'ar';

  const [students, setStudents] = useState<TopStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [displayMonth, setDisplayMonth] = useState('');

  // Get current month name
  useEffect(() => {
    const now = new Date();
    const monthNames = {
      ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
      en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    };
    const month = monthNames[isArabic ? 'ar' : 'en'][now.getMonth()];
    const year = now.getFullYear();
    setDisplayMonth(`${month} ${year}`);
  }, [isArabic]);

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('top_students')
      .select('*')
      .order('display_order', { ascending: true });

    if (!error && data) {
      setStudents(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleAddStudent = () => {
    if (!newStudentName.trim()) return;

    const nameAr = newStudentName.trim();
    const nameEn = transliterateArabicToEnglish(nameAr);

    const newStudent: TopStudent = {
      id: `temp-${Date.now()}`,
      student_name_ar: nameAr,
      student_name_en: nameEn,
      display_month: displayMonth,
      display_order: students.length,
      is_active: true,
    };

    setStudents([...students, newStudent]);
    setNewStudentName('');
  };

  const handleRemoveStudent = (id: string) => {
    setStudents(students.filter(s => s.id !== id));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Delete all existing entries
      await supabase.from('top_students').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // Insert new entries
      if (students.length > 0) {
        const toInsert = students.map((s, idx) => ({
          student_name_ar: s.student_name_ar,
          student_name_en: s.student_name_en,
          display_month: displayMonth,
          display_order: idx,
          is_active: true,
          created_by: user.id,
        }));

        const { error } = await supabase.from('top_students').insert(toInsert);

        if (error) throw error;
      }

      toast({
        title: isArabic ? 'تم الحفظ' : 'Saved',
        description: isArabic ? 'تم تحديث قائمة المتميزين' : 'Top students list updated',
      });

      fetchStudents();
    } catch (error) {
      console.error('Error saving:', error);
      toast({
        title: isArabic ? 'خطأ' : 'Error',
        description: isArabic ? 'فشل في حفظ البيانات' : 'Failed to save data',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-muted/30 pb-mobile-nav" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      
      <main className="pt-20 sm:pt-24 pb-8 content-appear">
        <div className="container mx-auto px-4 max-w-2xl">
          <AssistantPageHeader
            title={isArabic ? 'المتميزون' : 'Top Students'}
            subtitle={isArabic ? 'أضف أسماء الطلاب المتميزين لعرضهم على الصفحة الرئيسية' : 'Add top student names to display on homepage'}
          />

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="w-5 h-5 text-amber-500" />
                {isArabic ? `متميزون ${displayMonth}` : `Top Students of ${displayMonth}`}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add new student */}
              <div className="flex gap-2">
                <Input
                  placeholder={isArabic ? 'اسم الطالب (بالعربي)' : 'Student name (in Arabic)'}
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddStudent()}
                  className="flex-1"
                />
                <Button onClick={handleAddStudent} size="icon" variant="secondary">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Students list */}
              {students.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>{isArabic ? 'لا يوجد طلاب متميزون بعد' : 'No top students yet'}</p>
                  <p className="text-sm">{isArabic ? 'أضف أسماء الطلاب المتميزين أعلاه' : 'Add student names above'}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {students.map((student, idx) => (
                    <div
                      key={student.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border group"
                    >
                      <GripVertical className="w-4 h-4 text-muted-foreground/50" />
                      <Badge variant="secondary" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                        {idx + 1}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{student.student_name_ar}</p>
                        <p className="text-xs text-muted-foreground truncate">{student.student_name_en}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveStudent(student.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Save button */}
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full gap-2"
              >
                <Save className="w-4 h-4" />
                {saving
                  ? (isArabic ? 'جاري الحفظ...' : 'Saving...')
                  : (isArabic ? 'حفظ التغييرات' : 'Save Changes')}
              </Button>
            </CardContent>
          </Card>

          <Button variant="outline" onClick={() => navigate('/assistant')} className="gap-2">
            <BackIcon className="w-4 h-4" />
            {isArabic ? 'رجوع للوحة التحكم' : 'Back to Dashboard'}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default TopStudents;
