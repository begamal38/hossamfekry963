import React, { useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SEOHead } from '@/components/seo/SEOHead';
import { useLanguage } from '@/contexts/LanguageContext';

const Terms: React.FC = () => {
  const { language, isRTL } = useLanguage();
  const isArabic = language === 'ar';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background pb-mobile-nav" dir={isRTL ? 'rtl' : 'ltr'}>
      <SEOHead
        title="Terms of Service – Hossam Fekry Platform"
        titleAr="شروط الخدمة – منصة حسام فكري"
        description="Terms and conditions for using Hossam Fekry's educational platform."
        descriptionAr="الشروط والأحكام الخاصة باستخدام منصة حسام فكري التعليمية."
        canonical="https://hossamfekry.com/terms"
      />
      <Navbar />
      
      <main className="pt-20 sm:pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-8 text-center">
            {isArabic ? 'شروط الخدمة' : 'Terms of Service'}
          </h1>

          <div className="prose prose-lg dark:prose-invert max-w-none space-y-6">
            {isArabic ? (
              <>
                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">مقدمة</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    مرحباً بك في منصة حسام فكري التعليمية. باستخدامك للمنصة، فإنك توافق على الالتزام بهذه الشروط والأحكام. يرجى قراءتها بعناية.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">التسجيل والحساب</h2>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>يجب أن تكون طالباً في المرحلة الثانوية أو ولي أمر لاستخدام المنصة</li>
                    <li>يجب تقديم معلومات صحيحة ودقيقة عند التسجيل</li>
                    <li>أنت مسؤول عن الحفاظ على سرية بيانات حسابك</li>
                    <li>يُحظر مشاركة حسابك مع أي شخص آخر</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">الاشتراكات والدفع</h2>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>الاشتراك في الكورسات يتم عبر الدفع الإلكتروني أو من خلال السنتر</li>
                    <li>لا يمكن استرداد المبالغ المدفوعة بعد تفعيل الاشتراك</li>
                    <li>الاشتراك شخصي ولا يجوز نقله لشخص آخر</li>
                    <li>نحتفظ بحق تعديل الأسعار مع إخطار مسبق</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">استخدام المحتوى</h2>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>جميع المحتويات محمية بحقوق الملكية الفكرية</li>
                    <li>يُحظر تسجيل أو نسخ أو توزيع أي محتوى من المنصة</li>
                    <li>يُحظر مشاركة روابط الفيديو أو كلمات المرور</li>
                    <li>المخالفة تؤدي إلى إلغاء الاشتراك فوراً دون استرداد</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">سلوك المستخدم</h2>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>الالتزام بالاحترام في التعامل مع المدرسين والطلاب</li>
                    <li>عدم إرسال رسائل مسيئة أو غير لائقة</li>
                    <li>عدم محاولة اختراق أو التلاعب بالمنصة</li>
                    <li>الإبلاغ عن أي مشاكل تقنية أو سلوكية</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">الامتحانات والتقييم</h2>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>الامتحانات مصممة للتقييم الذاتي وقياس الفهم</li>
                    <li>يُحظر الغش أو مشاركة أسئلة الامتحانات</li>
                    <li>النتائج تُحفظ تلقائياً ولا يمكن تعديلها</li>
                    <li>قد تتوفر إمكانية إعادة الامتحان حسب إعداداته</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">إخلاء المسؤولية</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    نسعى لتقديم أفضل محتوى تعليمي، لكننا لا نضمن نتائج معينة في الامتحانات الرسمية. النجاح يعتمد على جهد الطالب والتزامه بالمذاكرة.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">تعديل الشروط</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    نحتفظ بحق تعديل هذه الشروط في أي وقت. سنخطرك بالتغييرات الجوهرية عبر البريد الإلكتروني أو إشعار على المنصة.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">التواصل</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    لأي استفسارات، تواصل معنا عبر: contact@hossamfekry.com
                  </p>
                  <p className="text-sm text-muted-foreground mt-4">
                    آخر تحديث: يناير 2026
                  </p>
                </section>
              </>
            ) : (
              <>
                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">Introduction</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Welcome to Hossam Fekry Educational Platform. By using the platform, you agree to comply with these terms and conditions. Please read them carefully.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">Registration and Account</h2>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>You must be a secondary school student or a parent to use the platform</li>
                    <li>You must provide accurate and correct information when registering</li>
                    <li>You are responsible for maintaining the confidentiality of your account</li>
                    <li>Sharing your account with others is prohibited</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">Subscriptions and Payment</h2>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Course subscriptions are made through electronic payment or at the center</li>
                    <li>Amounts paid cannot be refunded after subscription activation</li>
                    <li>Subscription is personal and cannot be transferred to another person</li>
                    <li>We reserve the right to modify prices with prior notice</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">Content Usage</h2>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>All content is protected by intellectual property rights</li>
                    <li>Recording, copying, or distributing any platform content is prohibited</li>
                    <li>Sharing video links or passwords is prohibited</li>
                    <li>Violations result in immediate subscription cancellation without refund</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">User Conduct</h2>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Maintain respect when interacting with teachers and students</li>
                    <li>Do not send offensive or inappropriate messages</li>
                    <li>Do not attempt to hack or manipulate the platform</li>
                    <li>Report any technical or behavioral issues</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">Exams and Assessment</h2>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Exams are designed for self-assessment and measuring understanding</li>
                    <li>Cheating or sharing exam questions is prohibited</li>
                    <li>Results are saved automatically and cannot be modified</li>
                    <li>Retake options may be available depending on exam settings</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">Disclaimer</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We strive to provide the best educational content, but we do not guarantee specific results in official exams. Success depends on the student's effort and commitment to studying.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">Terms Modification</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We reserve the right to modify these terms at any time. We will notify you of significant changes via email or a notification on the platform.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">Contact</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    For any inquiries, contact us at: contact@hossamfekry.com
                  </p>
                  <p className="text-sm text-muted-foreground mt-4">
                    Last updated: January 2026
                  </p>
                </section>
              </>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Terms;
