import React, { useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SEOHead } from '@/components/seo/SEOHead';
import { useLanguage } from '@/contexts/LanguageContext';

const Privacy: React.FC = () => {
  const { language, isRTL } = useLanguage();
  const isArabic = language === 'ar';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background pb-mobile-nav" dir={isRTL ? 'rtl' : 'ltr'}>
      <SEOHead
        title="Privacy Policy – Hossam Fekry Platform"
        titleAr="سياسة الخصوصية – منصة حسام فكري"
        description="Learn how we protect your data and privacy on Hossam Fekry's educational platform."
        descriptionAr="تعرف على كيفية حماية بياناتك وخصوصيتك على منصة حسام فكري التعليمية."
        canonical="https://hossamfekry.com/privacy"
      />
      <Navbar />
      
      <main className="pt-20 sm:pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-8 text-center">
            {isArabic ? 'سياسة الخصوصية' : 'Privacy Policy'}
          </h1>

          <div className="prose prose-lg dark:prose-invert max-w-none space-y-6">
            {isArabic ? (
              <>
                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">مقدمة</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    نحن في منصة حسام فكري نلتزم بحماية خصوصية مستخدمينا. توضح هذه السياسة كيفية جمع واستخدام وحماية معلوماتك الشخصية عند استخدام منصتنا التعليمية.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">المعلومات التي نجمعها</h2>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>معلومات الحساب: الاسم، البريد الإلكتروني، رقم الهاتف</li>
                    <li>المعلومات الأكاديمية: الصف الدراسي، المجموعة التعليمية</li>
                    <li>بيانات التقدم: الحصص المشاهدة، نتائج الامتحانات، وقت المشاهدة</li>
                    <li>معلومات الجهاز: نوع المتصفح، الجهاز المستخدم</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">كيف نستخدم معلوماتك</h2>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>تقديم الخدمات التعليمية وتتبع تقدمك</li>
                    <li>التواصل معك بخصوص حسابك أو الإشعارات المهمة</li>
                    <li>تحسين تجربة المستخدم على المنصة</li>
                    <li>ضمان أمان حسابك ومنع الوصول غير المصرح به</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">حماية البيانات</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    نستخدم تقنيات تشفير متقدمة لحماية بياناتك. لا نشارك معلوماتك الشخصية مع أي طرف ثالث إلا بموافقتك أو عند الضرورة القانونية.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">حقوقك</h2>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>الوصول إلى بياناتك الشخصية</li>
                    <li>طلب تصحيح البيانات غير الدقيقة</li>
                    <li>طلب حذف حسابك</li>
                    <li>إلغاء الاشتراك في الإشعارات</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">ملفات تعريف الارتباط</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    نستخدم ملفات تعريف الارتباط لتحسين تجربتك وتذكر تفضيلاتك. يمكنك التحكم في إعدادات ملفات تعريف الارتباط من خلال متصفحك.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">التواصل معنا</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    لأي استفسارات تتعلق بالخصوصية، يمكنك التواصل معنا عبر البريد الإلكتروني: contact@hossamfekry.com
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">تحديث السياسة</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    قد نقوم بتحديث هذه السياسة من وقت لآخر. سنخطرك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار على المنصة.
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
                    At Hossam Fekry Platform, we are committed to protecting the privacy of our users. This policy explains how we collect, use, and protect your personal information when using our educational platform.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">Information We Collect</h2>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Account information: Name, email address, phone number</li>
                    <li>Academic information: Grade level, educational track</li>
                    <li>Progress data: Lessons watched, exam results, watch time</li>
                    <li>Device information: Browser type, device used</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">How We Use Your Information</h2>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Provide educational services and track your progress</li>
                    <li>Communicate with you about your account or important notifications</li>
                    <li>Improve the user experience on the platform</li>
                    <li>Ensure your account security and prevent unauthorized access</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">Data Protection</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We use advanced encryption technologies to protect your data. We do not share your personal information with any third party without your consent or legal necessity.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">Your Rights</h2>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Access your personal data</li>
                    <li>Request correction of inaccurate data</li>
                    <li>Request deletion of your account</li>
                    <li>Opt out of notifications</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">Cookies</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We use cookies to improve your experience and remember your preferences. You can control cookie settings through your browser.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">Contact Us</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    For any privacy-related inquiries, you can contact us via email: contact@hossamfekry.com
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-3">Policy Updates</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We may update this policy from time to time. We will notify you of any significant changes via email or a notification on the platform.
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

export default Privacy;
