import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StudentActivityData {
  engagementScore: 'low' | 'medium' | 'high';
  coveragePercentage: number;
  coverageLabel: 'weak' | 'fair' | 'strong';
  consistencyScore: 'low' | 'medium' | 'high';
  totalFocusSessions: number;
  totalActiveMinutes: number;
  lessonsCompleted: number;
  totalLessons: number;
  learningDays: number;
  examAttempts?: number;
  avgExamScore?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { activityData }: { activityData: StudentActivityData } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context for the AI
    const activityContext = `
بيانات نشاط الطالب:
- مستوى التفاعل: ${activityData.engagementScore === 'high' ? 'مرتفع' : activityData.engagementScore === 'medium' ? 'متوسط' : 'منخفض'}
- تغطية المحتوى: ${activityData.coveragePercentage}% (${activityData.coverageLabel === 'strong' ? 'قوي' : activityData.coverageLabel === 'fair' ? 'مقبول' : 'ضعيف'})
- الانتظام: ${activityData.consistencyScore === 'high' ? 'مرتفع' : activityData.consistencyScore === 'medium' ? 'متوسط' : 'منخفض'}
- عدد جلسات التركيز: ${activityData.totalFocusSessions}
- الدقائق النشطة: ${activityData.totalActiveMinutes}
- الحصص المكتملة: ${activityData.lessonsCompleted} من ${activityData.totalLessons}
- أيام التعلم: ${activityData.learningDays}
${activityData.examAttempts !== undefined ? `- محاولات الامتحان: ${activityData.examAttempts}` : ''}
${activityData.avgExamScore !== undefined ? `- متوسط درجات الامتحانات: ${activityData.avgExamScore}%` : ''}
`;

    const systemPrompt = `أنت مساعد ذكي يقدم اقتراحات للمعلم المساعد بناءً على بيانات نشاط الطالب في المنصة التعليمية.

قواعد صارمة يجب اتباعها:
1. استخدم اللهجة المصرية العامية الهادئة وغير الرسمية
2. لا تستخدم أبدًا: "يجب" أو "لازم" أو "يتم إيقاف" أو "قرار نهائي"
3. استخدم دائمًا: "مقترح" أو "يُفضل" أو "قد يكون مناسب" أو "ممكن"
4. الاقتراح إرشادي فقط - القرار النهائي للمعلم
5. لا تقترح أي إجراءات تلقائية أو إجبارية
6. كن محايدًا وغير اتهامي تجاه الطالب

تنسيق الرد:
- جملة تحليلية قصيرة (سطر واحد)
- جملة اقتراح واحدة تبدأ بـ "مقترح:" أو "يُفضل:" أو "قد يكون مناسب:"

أمثلة على الردود المقبولة:
- "الطالب دخل المحتوى لكن التفاعل ضعيف. مقترح: متابعته فترة إضافية قبل أي قرار."
- "نسبة المشاهدة جيدة مع انتظام واضح. مقترح: لا يوجد ما يستدعي أي تدخل حاليًا."
- "النشاط محدود جدًا مع غياب انتظام. قد يكون مناسب: مراجعة استمرار الوصول."`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `حلل بيانات الطالب التالية وقدم اقتراحًا واحدًا:\n${activityContext}` },
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "rate_limited", message: "تم تجاوز الحد المسموح، حاول مرة أخرى لاحقًا" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "payment_required", message: "يرجى إضافة رصيد للمنصة" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const suggestion = data.choices?.[0]?.message?.content || null;

    return new Response(
      JSON.stringify({ suggestion }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("student-advisor error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
