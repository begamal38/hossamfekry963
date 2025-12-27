import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Smartphone, CheckCircle2, Share, Plus, MoreVertical, Monitor } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const features = [
    {
      icon: Smartphone,
      title: isArabic ? 'وصول سريع' : 'Quick Access',
      description: isArabic ? 'افتح التطبيق مباشرة من شاشتك الرئيسية' : 'Open the app directly from your home screen',
    },
    {
      icon: Download,
      title: isArabic ? 'يعمل بدون إنترنت' : 'Works Offline',
      description: isArabic ? 'تصفح المحتوى حتى بدون اتصال بالإنترنت' : 'Browse content even without internet connection',
    },
    {
      icon: Monitor,
      title: isArabic ? 'تجربة كاملة' : 'Full Experience',
      description: isArabic ? 'استمتع بتجربة تطبيق كامل بدون المتصفح' : 'Enjoy a full app experience without the browser',
    },
  ];

  return (
    <div className="min-h-screen bg-muted/30" dir={isArabic ? 'rtl' : 'ltr'}>
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Smartphone className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-3">
              {isArabic ? 'تثبيت التطبيق' : 'Install App'}
            </h1>
            <p className="text-muted-foreground text-lg">
              {isArabic 
                ? 'أضف تطبيق حسام فكري إلى شاشتك الرئيسية للوصول السريع'
                : 'Add Hossam Fekry app to your home screen for quick access'}
            </p>
          </div>

          {/* Already Installed */}
          {isInstalled && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 mb-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h2 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-2">
                {isArabic ? 'التطبيق مثبت بالفعل!' : 'App Already Installed!'}
              </h2>
              <p className="text-green-700 dark:text-green-300">
                {isArabic 
                  ? 'يمكنك فتح التطبيق من شاشتك الرئيسية'
                  : 'You can open the app from your home screen'}
              </p>
              <Button className="mt-4" onClick={() => navigate('/')}>
                {isArabic ? 'العودة للرئيسية' : 'Go to Home'}
              </Button>
            </div>
          )}

          {/* Install Button for Android/Desktop */}
          {!isInstalled && deferredPrompt && (
            <div className="bg-card border rounded-xl p-6 mb-8 text-center">
              <Button size="lg" onClick={handleInstall} className="gap-2 text-lg px-8">
                <Download className="w-5 h-5" />
                {isArabic ? 'تثبيت التطبيق الآن' : 'Install App Now'}
              </Button>
            </div>
          )}

          {/* iOS Instructions */}
          {!isInstalled && isIOS && (
            <div className="bg-card border rounded-xl p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4 text-center">
                {isArabic ? 'كيفية التثبيت على iPhone/iPad' : 'How to Install on iPhone/iPad'}
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Share className="w-5 h-5 text-primary" />
                      <span className="font-medium">
                        {isArabic ? 'اضغط على زر المشاركة' : 'Tap the Share button'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isArabic ? 'في شريط Safari السفلي' : 'In the Safari bottom bar'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold">2</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Plus className="w-5 h-5 text-primary" />
                      <span className="font-medium">
                        {isArabic ? 'اختر "إضافة إلى الشاشة الرئيسية"' : 'Select "Add to Home Screen"'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isArabic ? 'من قائمة الخيارات' : 'From the options menu'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold">3</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      <span className="font-medium">
                        {isArabic ? 'اضغط "إضافة"' : 'Tap "Add"'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isArabic ? 'لتأكيد التثبيت' : 'To confirm installation'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Android Instructions (fallback) */}
          {!isInstalled && isAndroid && !deferredPrompt && (
            <div className="bg-card border rounded-xl p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4 text-center">
                {isArabic ? 'كيفية التثبيت على Android' : 'How to Install on Android'}
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <MoreVertical className="w-5 h-5 text-primary" />
                      <span className="font-medium">
                        {isArabic ? 'افتح قائمة المتصفح' : 'Open browser menu'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isArabic ? 'النقاط الثلاث في الأعلى' : 'Three dots at the top'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold">2</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Download className="w-5 h-5 text-primary" />
                      <span className="font-medium">
                        {isArabic ? 'اختر "تثبيت التطبيق"' : 'Select "Install app"'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isArabic ? 'أو "إضافة إلى الشاشة الرئيسية"' : 'Or "Add to Home screen"'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Features */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center mb-6">
              {isArabic ? 'مميزات التطبيق' : 'App Features'}
            </h2>
            {features.map((feature, index) => (
              <div key={index} className="bg-card border rounded-xl p-5 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
