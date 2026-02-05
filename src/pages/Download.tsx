import React, { useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useInstallStatistics } from '@/hooks/useInstallStatistics';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Smartphone, 
  Monitor, 
  Zap, 
  WifiOff, 
  Bell, 
  Gauge,
  Download as DownloadIcon,
  Check,
  ChevronDown,
  Share,
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { GooglePlayIcon, AppleIcon, WindowsIcon, PlatformIconsRow } from '@/components/ui/PlatformStoreIcons';
import { cn } from '@/lib/utils';

const DownloadPage: React.FC = () => {
  const { t, isRTL } = useLanguage();
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

  // Benefits for students - translated
  const benefits = [
    {
      icon: Zap,
      titleKey: 'download.benefit.fast',
      descKey: 'download.benefit.fastDesc',
    },
    {
      icon: Gauge,
      titleKey: 'download.benefit.performance',
      descKey: 'download.benefit.performanceDesc',
    },
    {
      icon: Bell,
      titleKey: 'download.benefit.notifications',
      descKey: 'download.benefit.notificationsDesc',
    },
    {
      icon: WifiOff,
      titleKey: 'download.benefit.offline',
      descKey: 'download.benefit.offlineDesc',
    },
  ];

  // Device-specific instructions - translated
  const getInstructions = () => {
    switch (deviceType) {
      case 'android':
        return {
          titleKey: 'download.device.android',
          icon: GooglePlayIcon,
          iconColor: 'text-[#00C853]',
          steps: [
            t('download.step.android.1'),
            t('download.step.android.2'),
            t('download.step.android.3'),
            t('download.step.android.4'),
          ],
          hasNativePrompt: canInstall,
        };
      case 'ios':
        return {
          titleKey: 'download.device.ios',
          icon: AppleIcon,
          iconColor: 'text-gray-800 dark:text-gray-200',
          steps: [
            t('download.step.ios.1'),
            t('download.step.ios.2'),
            t('download.step.ios.3'),
            t('download.step.ios.4'),
          ],
          hasNativePrompt: false,
        };
      case 'windows':
      case 'macos':
      case 'linux':
        return {
          titleKey: 'download.device.desktop',
          icon: WindowsIcon,
          iconColor: 'text-[#0078D4]',
          steps: [
            t('download.step.desktop.1'),
            t('download.step.desktop.2'),
            t('download.step.desktop.3'),
            t('download.step.desktop.4'),
          ],
          hasNativePrompt: canInstall,
        };
      default:
        return {
          titleKey: 'download.device.default',
          icon: DownloadIcon,
          iconColor: 'text-primary',
          steps: [
            t('download.step.default.1'),
            t('download.step.default.2'),
            t('download.step.default.3'),
          ],
          hasNativePrompt: canInstall,
        };
    }
  };

  const instructions = getInstructions();
  const IconComponent = instructions.icon;

  return (
    <div className="min-h-screen bg-background pb-mobile-nav" dir={isRTL ? 'rtl' : 'ltr'}>
      <SEOHead 
        title="Download App - Hossam Fekry Platform"
        titleAr="تحميل التطبيق - منصة حسام فكري"
        description="Install Hossam Fekry platform as an app on your device - faster and easier for studying"
        descriptionAr="ثبّت منصة حسام فكري كتطبيق على جهازك - أسرع وأسهل للمذاكرة"
        canonical="https://hossamfekry.com/download"
      />
      <Navbar />
      
      <main className="container mx-auto px-4 pt-20 pb-6 sm:pt-24 sm:pb-8 max-w-4xl">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="text-center mb-8 sm:mb-12"
        >
          {/* Platform Icons Row */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 mb-4 sm:mb-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#00C853]/10 border border-[#00C853]/20 flex items-center justify-center">
              <GooglePlayIcon className="w-7 h-7 sm:w-8 sm:h-8 text-[#00C853]" />
            </div>
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gray-500/10 border border-gray-500/20 flex items-center justify-center">
              <AppleIcon className="w-7 h-7 sm:w-8 sm:h-8 text-gray-800 dark:text-gray-200" />
            </div>
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#0078D4]/10 border border-[#0078D4]/20 flex items-center justify-center">
              <WindowsIcon className="w-6 h-6 sm:w-7 sm:h-7 text-[#0078D4]" />
            </div>
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-2">
            {t('download.title')}
          </h1>
          
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto px-2">
            {t('download.subtitle')}
          </p>
        </motion.div>

        {/* Already Installed State */}
        {isInstalled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 sm:mb-8"
          >
            <Card className="p-4 sm:p-6 bg-green-500/10 border-green-500/30 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-green-700 dark:text-green-400 mb-2">
                {t('download.alreadyInstalled')}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                {t('download.usingAsApp')}
              </p>
            </Card>
          </motion.div>
        )}

        {/* Benefits Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 sm:mb-12"
        >
          <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-center">
            {t('download.whyInstall')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {benefits.map((benefit, idx) => (
              <Card 
                key={idx}
                className="p-3 sm:p-4 text-center hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-xl bg-primary/10 flex items-center justify-center">
                  <benefit.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1 text-xs sm:text-sm">
                  {t(benefit.titleKey)}
                </h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                  {t(benefit.descKey)}
                </p>
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
            className="mb-8 sm:mb-12"
          >
            <Card className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className={cn(
                  "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0",
                  deviceType === 'android' && "bg-[#00C853]/10",
                  deviceType === 'ios' && "bg-gray-500/10",
                  (deviceType === 'windows' || deviceType === 'macos' || deviceType === 'linux') && "bg-[#0078D4]/10",
                  deviceType === 'unknown' && "bg-primary/10"
                )}>
                  <IconComponent className={cn("w-5 h-5 sm:w-6 sm:h-6", instructions.iconColor)} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold">
                    {t('download.howToInstall')} - {t(instructions.titleKey)}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t('download.followSteps')}
                  </p>
                </div>
              </div>

              {/* Native Install Button (Android/Desktop) */}
              {instructions.hasNativePrompt && (
                <div className="mb-4 sm:mb-6">
                  <Button 
                    onClick={handleInstall}
                    size="lg"
                    className="w-full gap-2 bg-primary hover:bg-primary/90"
                  >
                    <DownloadIcon className="w-5 h-5" />
                    {t('download.installNow')}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    {t('download.orManual')}
                  </p>
                </div>
              )}

              {/* Manual Steps */}
              <div className="space-y-3 sm:space-y-4">
                {instructions.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className={cn(
                      "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 text-xs sm:text-sm font-bold",
                      deviceType === 'android' && "bg-[#00C853]/10 text-[#00C853]",
                      deviceType === 'ios' && "bg-gray-500/10 text-gray-700 dark:text-gray-300",
                      (deviceType === 'windows' || deviceType === 'macos' || deviceType === 'linux') && "bg-[#0078D4]/10 text-[#0078D4]",
                      deviceType === 'unknown' && "bg-primary/10 text-primary"
                    )}>
                      {idx + 1}
                    </div>
                    <p className="pt-0.5 sm:pt-1 text-sm sm:text-base">{step}</p>
                  </div>
                ))}
              </div>

              {/* iOS Special Note */}
              {deviceType === 'ios' && (
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                      <Share className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-400 font-medium mb-1">
                        {t('download.iosNote')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('download.iosNoteDesc')}
                      </p>
                    </div>
                  </div>
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
          <Card className="p-4 sm:p-6 bg-muted/30">
            <h2 className="text-base sm:text-lg font-bold mb-4 text-center">
              {t('download.statistics')}
            </h2>
            
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-center">
                <div className="p-2 sm:p-3 rounded-lg bg-primary/5">
                  <p className="text-xl sm:text-2xl font-bold text-primary tabular-nums">
                    {statistics?.total_installs || 0}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {t('download.totalInstalls')}
                  </p>
                </div>
                <div className="p-2 sm:p-3 rounded-lg bg-[#00C853]/5">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <GooglePlayIcon className="w-4 h-4 text-[#00C853]" />
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-[#00C853] tabular-nums">
                    {statistics?.android_installs || 0}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {t('download.android')}
                  </p>
                </div>
                <div className="p-2 sm:p-3 rounded-lg bg-gray-500/5">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <AppleIcon className="w-4 h-4 text-gray-800 dark:text-gray-200" />
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 tabular-nums">
                    {statistics?.ios_installs || 0}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {t('download.ios')}
                  </p>
                </div>
                <div className="p-2 sm:p-3 rounded-lg bg-[#0078D4]/5">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <WindowsIcon className="w-3.5 h-3.5 text-[#0078D4]" />
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-[#0078D4] tabular-nums">
                    {(statistics?.windows_installs || 0) + (statistics?.macos_installs || 0)}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {t('download.desktop')}
                  </p>
                </div>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Scroll indicator */}
        <div className="mt-6 sm:mt-8 text-center">
          <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-muted-foreground/50 animate-bounce" />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default DownloadPage;
