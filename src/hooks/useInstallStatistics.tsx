import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type DeviceType = 'android' | 'ios' | 'windows' | 'macos' | 'linux' | 'unknown';

// Storage key for iOS standalone detection (prevents double counting)
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
 * Detect device type from user agent
 */
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

/**
 * Check if app is installed as PWA
 */
const checkIfInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check standalone mode
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  
  // Check iOS standalone
  if ((navigator as any).standalone === true) return true;
  
  // Check if running as installed app
  if (document.referrer.includes('android-app://')) return true;
  
  return false;
};

/**
 * Check if running in iOS standalone mode specifically
 * iOS does NOT fire 'appinstalled' event - we must detect standalone mode
 */
const isIOSStandalone = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = (navigator as any).standalone === true || 
                       window.matchMedia('(display-mode: standalone)').matches;
  
  return isIOS && isStandalone;
};

/**
 * Check if iOS install has already been recorded for this device
 */
const hasIOSInstallBeenRecorded = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(IOS_INSTALL_RECORDED_KEY) === 'true';
};

/**
 * Mark iOS install as recorded
 */
const markIOSInstallRecorded = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(IOS_INSTALL_RECORDED_KEY, 'true');
  }
};

/**
 * Hook for PWA install statistics and install functionality
 * SSOT: install_events table
 */
export const useInstallStatistics = (): UseInstallStatisticsReturn => {
  const { user } = useAuth();
  const [statistics, setStatistics] = useState<InstallStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  
  const deviceType = detectDeviceType();

  // Fetch statistics from SSOT
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

  // Record install event to SSOT
  const recordInstall = useCallback(async () => {
    const sessionId = localStorage.getItem('pwa_session_id') || crypto.randomUUID();
    localStorage.setItem('pwa_session_id', sessionId);
    
    // Check if already recorded this session
    const recordedKey = `pwa_install_recorded_${sessionId}`;
    if (localStorage.getItem(recordedKey)) {
      console.log('Install already recorded for this session');
      return;
    }
    
    try {
      const { error } = await supabase.from('install_events').insert({
        user_id: user?.id || null,
        device_type: deviceType,
        browser_info: navigator.userAgent.slice(0, 100),
        user_agent: navigator.userAgent,
        session_id: sessionId,
      });
      
      if (error) {
        console.error('Error recording install:', error);
        return;
      }
      
      // Mark as recorded
      localStorage.setItem(recordedKey, 'true');
      
      // Refresh statistics
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

  // Listen for beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
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

  // iOS-specific install tracking
  // iOS does NOT fire 'appinstalled' event, so we detect standalone mode
  useEffect(() => {
    // Only run on iOS devices
    if (deviceType !== 'ios') return;
    
    // Check if running in standalone mode AND not already recorded
    if (isIOSStandalone() && !hasIOSInstallBeenRecorded()) {
      console.log('[PWA] iOS standalone mode detected - recording install');
      
      // Record the install
      recordInstall().then(() => {
        markIOSInstallRecorded();
        console.log('[PWA] iOS install recorded successfully');
      }).catch(err => {
        console.error('[PWA] Failed to record iOS install:', err);
      });
    }
  }, [deviceType, recordInstall]);

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
