import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  Brain, 
  Target, 
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface ActivityGuidePanelProps {
  className?: string;
}

export const ActivityGuidePanel: React.FC<ActivityGuidePanelProps> = ({ className }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  return (
    <Card className={cn("overflow-hidden border-primary/20 bg-primary/5", className)}>
      <CardHeader 
        className="py-3 px-4 cursor-pointer hover:bg-primary/10 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            {isArabic ? 'إرشادات قراءة نشاط الطالب' : 'How to Read Student Activity Data'}
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 pb-4 px-4 space-y-4 text-sm" dir="rtl">
          {/* Intro */}
          <div className="p-3 bg-card rounded-lg border">
            <p className="flex items-start gap-2">
              <BookOpen className="w-4 h-4 mt-0.5 text-primary shrink-0" />
              <span>
                📘 <strong>إرشادات قراءة نشاط الطالب</strong>
              </span>
            </p>
            <p className="mt-2 text-muted-foreground leading-relaxed">
              الأرقام اللي قدامك بتوضح طريقة تعامل الطالب مع الكورس،
              مش مستواه العلمي.
            </p>
            <p className="mt-2 text-muted-foreground leading-relaxed">
              البيانات دي مبنية على نشاط حقيقي أثناء مشاهدة المحتوى،
              مش عدّ وقت صناعي ولا زرار Completion.
            </p>
          </div>

          <Separator />

          {/* Analysis Indicators */}
          <div className="space-y-4">
            <p className="flex items-center gap-2 font-semibold">
              <Brain className="w-4 h-4 text-primary" />
              🧠 مؤشرات التحليل:
            </p>

            {/* Engagement */}
            <div className="p-3 bg-card rounded-lg border space-y-2">
              <p className="font-medium">1️⃣ مستوى التفاعل (Engagement)</p>
              <p className="text-muted-foreground leading-relaxed">
                بيقيس هل الطالب كان متفاعل فعليًا أثناء المشاهدة
                ولا سايب الفيديو شغال بدون تركيز.
              </p>
              <ul className="space-y-1 text-sm mr-4">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <strong>High:</strong> تركيز واضح وتفاعل مستمر
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <strong>Medium:</strong> تفاعل متقطع
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <strong>Low:</strong> نشاط ضعيف أو محدود
                </li>
              </ul>
              <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                ⚠️ ملحوظة: Low لا يعني طالب ضعيف علميًا.
              </p>
            </div>

            {/* Coverage */}
            <div className="p-3 bg-card rounded-lg border space-y-2">
              <p className="font-medium">2️⃣ مدى التغطية (Coverage)</p>
              <p className="text-muted-foreground leading-relaxed">
                يوضح نسبة المحتوى اللي الطالب دخله وشافه.
              </p>
              <ul className="space-y-1 text-sm mr-4">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <strong>Strong:</strong> شاف جزء كبير من الكورس
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <strong>Fair:</strong> شاف أجزاء مهمة
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <strong>Weak:</strong> تصفح محدود
                </li>
              </ul>
            </div>

            {/* Consistency */}
            <div className="p-3 bg-card rounded-lg border space-y-2">
              <p className="font-medium">3️⃣ الالتزام (Consistency)</p>
              <p className="text-muted-foreground leading-relaxed">
                بيقيس انتظام الطالب في الرجوع للكورس.
              </p>
              <ul className="space-y-1 text-sm mr-4">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <strong>High:</strong> دخول منتظم
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <strong>Medium:</strong> دخول متقطع
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <strong>Low:</strong> تجربة قصيرة
                </li>
              </ul>
            </div>
          </div>

          <Separator />

          {/* Decision Making */}
          <div className="space-y-3">
            <p className="flex items-center gap-2 font-semibold">
              <Target className="w-4 h-4 text-primary" />
              🎯 كيفية اتخاذ القرار:
            </p>

            <div className="grid gap-2">
              {/* Recommended */}
              <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-700">✔️ يُنصح باستمرار الوصول:</p>
                  <p className="text-sm text-muted-foreground">
                    Engagement (Medium / High)<br/>
                    Coverage (Fair / Strong)
                  </p>
                </div>
              </div>

              {/* Needs Follow-up */}
              <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-700">⚠️ يحتاج متابعة:</p>
                  <p className="text-sm text-muted-foreground">
                    Engagement (Low)<br/>
                    Coverage (Fair)
                  </p>
                </div>
              </div>

              {/* Not Justified */}
              <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-700">❌ لا يوجد مبرر للاستمرار:</p>
                  <p className="text-sm text-muted-foreground">
                    Engagement (Low)<br/>
                    Coverage (Weak)<br/>
                    Consistency (Low)
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Ground Rules */}
          <div className="p-3 bg-muted/50 rounded-lg border border-muted space-y-2">
            <p className="font-medium">⚠️ قواعد أساسية:</p>
            <ul className="space-y-1 text-sm text-muted-foreground mr-4">
              <li>• لا يتم تعديل البيانات بعد إغلاق الكورس</li>
              <li>• التحليل مبني على السلوك فقط</li>
              <li>• القرار يجب أن يكون عادل وغير عاطفي</li>
            </ul>
          </div>

          {/* Goal */}
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 text-center">
            <p className="font-medium text-primary">✨ الهدف:</p>
            <p className="text-sm text-muted-foreground mt-1">
              مساعدتك على اتخاذ قرار واضح<br/>
              مبني على بيانات حقيقية.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
