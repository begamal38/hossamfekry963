import React from 'react';
import { Link } from 'react-router-dom';
import { Download, Smartphone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInstallStatistics } from '@/hooks/useInstallStatistics';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

interface AppPromotionBannerProps {
  variant?: 'inline' | 'floating';
  className?: string;
}

/**
 * Light, non-intrusive promotion banner for PWA installation
 * Rules:
 * - Never blocks content
 * - Frequency-controlled via localStorage
 * - Same message everywhere
 * - Respects user dismissal
 * - Fully translated (Arabic/English)
 */
export const AppPromotionBanner: React.FC<AppPromotionBannerProps> = ({ 
  variant = 'inline',
  className = '' 
}) => {
  const { isInstalled } = useInstallStatistics();
  const { t, isRTL } = useLanguage();
  const [isDismissed, setIsDismissed] = React.useState(false);
  const [shouldShow, setShouldShow] = React.useState(false);

  // Check if banner should be shown (frequency control)
  React.useEffect(() => {
    // Don't show if already installed
    if (isInstalled) {
      setShouldShow(false);
      return;
    }

    // Check dismissal timestamp
    const dismissedAt = localStorage.getItem('pwa_banner_dismissed_at');
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const hoursSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60);
      
      // Show again after 24 hours
      if (hoursSinceDismissed < 24) {
        setShouldShow(false);
        return;
      }
    }

    // Check view count for this session
    const viewCount = parseInt(sessionStorage.getItem('pwa_banner_views') || '0', 10);
    if (viewCount >= 2) {
      // Max 2 views per session
      setShouldShow(false);
      return;
    }

    // Increment view count
    sessionStorage.setItem('pwa_banner_views', String(viewCount + 1));
    setShouldShow(true);
  }, [isInstalled]);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa_banner_dismissed_at', String(Date.now()));
  };

  // Don't render if shouldn't show
  if (!shouldShow || isDismissed || isInstalled) {
    return null;
  }

  if (variant === 'floating') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={`fixed bottom-20 left-4 right-4 z-40 md:left-auto md:right-6 md:max-w-sm ${className}`}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <div className="bg-background/95 backdrop-blur-sm border border-border rounded-xl shadow-lg p-4">
            <button
              onClick={handleDismiss}
              className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} p-1 rounded-full hover:bg-muted transition-colors`}
              aria-label={t('system.close')}
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{t('promotion.downloadApp')}</p>
                <p className="text-xs text-muted-foreground">{t('promotion.fasterEasier')}</p>
              </div>
              <Link to="/download">
                <Button size="sm" className="shrink-0 gap-1">
                  <Download className="w-4 h-4" />
                  {t('promotion.download')}
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Inline variant
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={`bg-primary/5 border-y border-primary/10 ${className}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
            <p className="text-xs sm:text-sm truncate">
              <span className="font-medium">{t('promotion.installPlatform')}</span>
              <span className="text-muted-foreground hidden sm:inline"> - {t('promotion.fasterEasier')}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/download">
              <Button size="sm" variant="outline" className="gap-1 text-xs h-8 px-2 sm:px-3">
                <Download className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">{t('promotion.download')}</span>
              </Button>
            </Link>
            <button
              onClick={handleDismiss}
              className="p-1 rounded hover:bg-muted transition-colors"
              aria-label={t('system.close')}
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
