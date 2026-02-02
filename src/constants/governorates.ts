export interface Governorate {
  value: string;
  label_en: string;
  label_ar: string;
}

export const EGYPTIAN_GOVERNORATES: Governorate[] = [
  { value: 'cairo', label_en: 'Cairo', label_ar: 'القاهرة' },
  { value: 'giza', label_en: 'Giza', label_ar: 'الجيزة' },
  { value: 'alexandria', label_en: 'Alexandria', label_ar: 'الإسكندرية' },
  { value: 'dakahlia', label_en: 'Dakahlia', label_ar: 'الدقهلية' },
  { value: 'sharqia', label_en: 'Sharqia', label_ar: 'الشرقية' },
  { value: 'gharbia', label_en: 'Gharbia', label_ar: 'الغربية' },
  { value: 'monufia', label_en: 'Monufia', label_ar: 'المنوفية' },
  { value: 'qalyubia', label_en: 'Qalyubia', label_ar: 'القليوبية' },
  { value: 'beheira', label_en: 'Beheira', label_ar: 'البحيرة' },
  { value: 'kafr_el_sheikh', label_en: 'Kafr El Sheikh', label_ar: 'كفر الشيخ' },
  { value: 'damietta', label_en: 'Damietta', label_ar: 'دمياط' },
  { value: 'port_said', label_en: 'Port Said', label_ar: 'بورسعيد' },
  { value: 'ismailia', label_en: 'Ismailia', label_ar: 'الإسماعيلية' },
  { value: 'suez', label_en: 'Suez', label_ar: 'السويس' },
  { value: 'north_sinai', label_en: 'North Sinai', label_ar: 'شمال سيناء' },
  { value: 'south_sinai', label_en: 'South Sinai', label_ar: 'جنوب سيناء' },
  { value: 'red_sea', label_en: 'Red Sea', label_ar: 'البحر الأحمر' },
  { value: 'fayoum', label_en: 'Fayoum', label_ar: 'الفيوم' },
  { value: 'beni_suef', label_en: 'Beni Suef', label_ar: 'بني سويف' },
  { value: 'minya', label_en: 'Minya', label_ar: 'المنيا' },
  { value: 'asyut', label_en: 'Asyut', label_ar: 'أسيوط' },
  { value: 'sohag', label_en: 'Sohag', label_ar: 'سوهاج' },
  { value: 'qena', label_en: 'Qena', label_ar: 'قنا' },
  { value: 'luxor', label_en: 'Luxor', label_ar: 'الأقصر' },
  { value: 'aswan', label_en: 'Aswan', label_ar: 'أسوان' },
  { value: 'new_valley', label_en: 'New Valley', label_ar: 'الوادي الجديد' },
  { value: 'matrouh', label_en: 'Matrouh', label_ar: 'مطروح' },
  // CRITICAL: Support international students (outside Egypt)
  { value: 'outside_egypt', label_en: 'Outside Egypt', label_ar: 'خارج مصر' },
];

export const getGovernorateLabel = (value: string | null | undefined, isRTL: boolean): string => {
  if (!value) return isRTL ? 'غير محدد' : 'Not specified';
  const gov = EGYPTIAN_GOVERNORATES.find(g => g.value === value);
  return gov ? (isRTL ? gov.label_ar : gov.label_en) : value;
};
