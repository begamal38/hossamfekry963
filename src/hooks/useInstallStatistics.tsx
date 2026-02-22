import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type DeviceType = 'android' | 'ios' | 'windows' | 'macos' | 'linux' | 'unknown';

// Persistent keys
const DEVICE_ID_KEY = 'pwa_device_id';
const INSTALL_RECORDED_KEY = 'pwa_install_recorded';
const IOS_INSTALL_RECORDED_KEY = 'pwa_ios_standalone_recorded';

interface InstallStatistics {
  total_installs: number;
  android_installs: number;
  ios_installs: number;
  windows_installs: number;
  macos_installs: number;
  other_installs: number;
}

interface UseInstallStatisticsReturn {
  statistics: InstallStatistics | null;
  isLoading: boolean;
  deviceType: DeviceType;
  isInstalled: boolean;
  canInstall: boolean;
  deferredPrompt: any;
  triggerInstall: () => Promise<boolean>;
  recordInstall: () => Promise<void>;
  refreshStatistics: () => Promise<void>;
}

/**
 * Get or create a persistent device ID that survives sessions and logouts.
 */
const getDeviceId = (): string => {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
};

/**
 * Check if an install has already been recorded for this device.
 */
const hasInstallBeenRecorded = (): boolean => {
  return localStorage.getItem(INSTALL_RECORDED_KEY) === 'true';
};

/**
 * Mark install as recorded for this device permanently.
 */
const markInstallRecorded = (): void => {
  localStorage.setItem(INSTALL_RECORDED_KEY, 'true');
};

const detectDeviceType = (): DeviceType => {
  if (typeof window === 'undefined') return 'unknown';
  const ua = navigator.userAgent.toLowerCase();
  if (/android/.test(ua)) return 'android';
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/windows/.test(ua)) return 'windows';
  if (/macintosh|mac os x/.test(ua)) return 'macos';
  if (/linux/.test(ua)) return 'linux';
  return 'unknown';
};

const checkIfInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  if ((navigator as any).standalone === true) return true;
  if (document.referrer.includes('android-app://')) return true;
  return false;
};

const isIOSStandalone = (): boolean => {
  if (typeof window === 'undefined') return false;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = (navigator as any).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;
  return isIOS && isStandalone;
};

/**
 * Hook for PWA install statistics and install functionality.
 * 
 * COUNTING RULES:
 * - Each device gets a persistent device_id (localStorage).
 * - Install is recorded ONLY on actual PWA install event or iOS standalone detection.
 * - Once recorded for a device, never counted again (survives logout/refresh).
 * - Browser visits are NOT counted as installs.
 */
export const useInstallStatistics = (): UseInstallStatisticsReturn => {
  const { user } = useAuth();
  const [statistics, setStatistics] = useState<InstallStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  const deviceType = detectDeviceType();

  const refreshStatistics = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_install_statistics');
      if (error) {
        console.error('Error fetching install statistics:', error);
        return;
      }
      if (data && data.length > 0) {
        setStatistics(data[0]);
      } else {
        setStatistics({
          total_installs: 0,
          android_installs: 0,
          ios_installs: 0,
          windows_installs: 0,
          macos_installs: 0,
          other_installs: 0,
        });
      }
    } catch (err) {
      console.error('Error in refreshStatistics:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Record install event — guarded by persistent device_id dedup
  const recordInstall = useCallback(async () => {
    // CRITICAL: If this device already recorded an install, skip entirely
    if (hasInstallBeenRecorded()) {
      console.log('[PWA] Install already recorded for this device, skipping');
      return;
    }

    const deviceId = getDeviceId();

    try {
      const { error } = await supabase.from('install_events').insert({
        user_id: user?.id || null,
        device_type: deviceType,
        browser_info: navigator.userAgent.slice(0, 100),
        user_agent: navigator.userAgent,
        session_id: deviceId, // Use persistent device_id as session_id for dedup
      });

      if (error) {
        console.error('Error recording install:', error);
        return;
      }

      // Mark as permanently recorded for this device
      markInstallRecorded();
      console.log('[PWA] Install recorded for device:', deviceId);

      await refreshStatistics();
    } catch (err) {
      console.error('Error in recordInstall:', err);
    }
  }, [user?.id, deviceType, refreshStatistics]);

  // Trigger install prompt
  const triggerInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      console.log('No deferred prompt available');
      return false;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        await recordInstall();
        setDeferredPrompt(null);
        setIsInstalled(true);
        return true;
      }

      return false;
    } catch (err) {
      console.error('Error triggering install:', err);
      return false;
    }
  }, [deferredPrompt, recordInstall]);

  // Listen for install events (Android/Desktop)
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      // Record only if not already recorded for this device
      recordInstall();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [recordInstall]);

  // Check installed state on mount
  useEffect(() => {
    setIsInstalled(checkIfInstalled());
  }, []);

  // iOS standalone detection — record once per device
  useEffect(() => {
    if (deviceType !== 'ios') return;

    // Use both the legacy key and the new persistent key
    const legacyRecorded = localStorage.getItem(IOS_INSTALL_RECORDED_KEY) === 'true';

    if (isIOSStandalone() && !hasInstallBeenRecorded() && !legacyRecorded) {
      console.log('[PWA] iOS standalone mode detected - recording install');
      recordInstall().then(() => {
        localStorage.setItem(IOS_INSTALL_RECORDED_KEY, 'true');
        console.log('[PWA] iOS install recorded successfully');
      }).catch(err => {
        console.error('[PWA] Failed to record iOS install:', err);
      });
    }
  }, [deviceType, recordInstall]);

  // Ensure device_id exists on mount (for future tracking)
  useEffect(() => {
    getDeviceId();
  }, []);

  // Fetch statistics on mount
  useEffect(() => {
    refreshStatistics();
  }, [refreshStatistics]);

  return {
    statistics,
    isLoading,
    deviceType,
    isInstalled,
    canInstall: !!deferredPrompt && !isInstalled,
    deferredPrompt,
    triggerInstall,
    recordInstall,
    refreshStatistics,
  };
};
