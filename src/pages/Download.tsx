import React, { useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useInstallStatistics } from '@/hooks/useInstallStatistics';
import { 
  Smartphone, 
  Monitor, 
  Zap, 
  WifiOff, 
  Bell, 
  Gauge,
  Download as DownloadIcon,
  Share,
  Plus,
  MoreVertical,
  Check,
  ChevronDown
} from 'lucide-react';
import { motion } from 'framer-motion';

const DownloadPage: React.FC = () => {
  const {
    statistics, 
    isLoading, 
    deviceType, 
    isInstalled, 
    canInstall, 
    triggerInstall 
  } = useInstallStatistics();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleInstall = async () => {
    await triggerInstall();
  };

  // Benefits for students - simple Arabic
  const benefits = [
    {
      icon: Zap,
      title: 'أسرع في الفتح',
      description: 'التطبيق بيفتح فوري من الشاشة الرئيسية',
    },
    {
      icon: Gauge,
      title: 'مفيش تهنيج',
      description: 'أداء أحسن من المتصفح العادي',
    },
    {
      icon: Bell,
      title: 'إشعارات فورية',
      description: 'هتعرف بالحصص الجديدة والامتحانات',
    },
    {
      icon: WifiOff,
      title: 'يشتغل أوفلاين',
      description: 'بعض الصفحات تشتغل بدون نت',
    },
  ];

  // Device-specific instructions
  const getInstructions = () => {
    switch (deviceType) {
      case 'android':
        return {
          title: 'أندرويد',
          icon: Smartphone,
          steps: [
            'افتح المنصة من Chrome',
            'اضغط على ⋮ (النقط التلاتة) فوق',
            'اختار "تثبيت التطبيق" أو "Add to Home Screen"',
            'اضغط "تثبيت"',
          ],
          hasNativePrompt: canInstall,
        };
      case 'ios':
        return {
          title: 'آيفون / آيباد',
          icon: Smartphone,
          steps: [
            'افتح المنصة من Safari',
            'اضغط على زر المشاركة ⬆️',
            'اختار "إضافة إلى الشاشة الرئيسية"',
            'اضغط "إضافة"',
          ],
          hasNativePrompt: false,
        };
      case 'windows':
      case 'macos':
      case 'linux':
        return {
          title: 'كمبيوتر',
          icon: Monitor,
          steps: [
            'افتح المنصة من Chrome أو Edge',
            'هتلاقي أيقونة التثبيت ⊕ في شريط العنوان',
            'اضغط عليها واختار "تثبيت"',
            'التطبيق هيظهر في قائمة البرامج',
          ],
          hasNativePrompt: canInstall,
        };
      default:
        return {
          title: 'جهازك',
          icon: Smartphone,
          steps: [
            'افتح المنصة من المتصفح',
            'دور على خيار "تثبيت" أو "Add to Home Screen"',
            'اتبع الخطوات',
          ],
          hasNativePrompt: canInstall,
        };
    }
  };

  const instructions = getInstructions();
  const IconComponent = instructions.icon;

  return (
    <div className="min-h-screen bg-background pb-mobile-nav" dir="rtl">
      <SEOHead 
        title="تحميل التطبيق - منصة حسام فكري"
        titleAr="تحميل التطبيق - منصة حسام فكري"
        description="ثبّت منصة حسام فكري كتطبيق على جهازك - أسرع وأسهل للمذاكرة"
        descriptionAr="ثبّت منصة حسام فكري كتطبيق على جهازك - أسرع وأسهل للمذاكرة"
        canonical="https://hossamfekry.com/download"
      />
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <DownloadIcon className="w-10 h-10 text-primary" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            ثبّت المنصة على جهازك 📱
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            خلّي المنصة زي أي تطبيق تاني على موبايلك أو الكمبيوتر - 
            أسرع في الفتح وأسهل في الاستخدام
          </p>
        </motion.div>

        {/* Already Installed State */}
        {isInstalled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8"
          >
            <Card className="p-6 bg-green-500/10 border-green-500/30 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-green-700 dark:text-green-400 mb-2">
                التطبيق مثبّت بالفعل! ✅
              </h2>
              <p className="text-muted-foreground">
                أنت بتستخدم المنصة كتطبيق دلوقتي
              </p>
            </Card>
          </motion.div>
        )}

        {/* Benefits Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-xl font-bold mb-6 text-center">ليه تثبّت التطبيق؟</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {benefits.map((benefit, idx) => (
              <Card 
                key={idx}
                className="p-4 text-center hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center">
                  <benefit.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1 text-sm">{benefit.title}</h3>
                <p className="text-xs text-muted-foreground">{benefit.description}</p>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Install Instructions */}
        {!isInstalled && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-12"
          >
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <IconComponent className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">طريقة التثبيت - {instructions.title}</h2>
                  <p className="text-sm text-muted-foreground">اتبع الخطوات دي</p>
                </div>
              </div>

              {/* Native Install Button (Android/Desktop) */}
              {instructions.hasNativePrompt && (
                <div className="mb-6">
                  <Button 
                    onClick={handleInstall}
                    size="lg"
                    className="w-full gap-2"
                  >
                    <DownloadIcon className="w-5 h-5" />
                    ثبّت التطبيق دلوقتي
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    أو اتبع الخطوات اليدوية
                  </p>
                </div>
              )}

              {/* Manual Steps */}
              <div className="space-y-4">
                {instructions.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
                      {idx + 1}
                    </div>
                    <p className="pt-1">{step}</p>
                  </div>
                ))}
              </div>

              {/* iOS Special Note */}
              {deviceType === 'ios' && (
                <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    <strong>ملاحظة للآيفون:</strong> لازم تفتح المنصة من Safari مش Chrome 
                    عشان خيار "إضافة للشاشة الرئيسية" يظهر
                  </p>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Statistics Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="p-6 bg-muted/30">
            <h2 className="text-lg font-bold mb-4 text-center">إحصائيات التثبيت</h2>
            
            {isLoading ? (
              <div className="flex justify-center py-4">
                <div className="flex items-center gap-2">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full bg-primary animate-pulse"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {statistics?.total_installs || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">إجمالي التثبيتات</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {statistics?.android_installs || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">أندرويد</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {statistics?.ios_installs || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">آيفون</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {(statistics?.windows_installs || 0) + (statistics?.macos_installs || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">كمبيوتر</p>
                </div>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Scroll indicator */}
        <div className="mt-8 text-center">
          <ChevronDown className="w-6 h-6 mx-auto text-muted-foreground/50 animate-bounce" />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default DownloadPage;
