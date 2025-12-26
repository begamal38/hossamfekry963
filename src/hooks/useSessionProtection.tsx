import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface DeviceInfo {
  fingerprint: string;
  name: string;
  browserInfo: string;
}

interface SessionState {
  isNewDevice: boolean;
  sessionEnded: boolean;
  endReason: string | null;
  deviceCount: number;
}

// Generate a simple device fingerprint (non-invasive)
const generateDeviceFingerprint = (): DeviceInfo => {
  const screen = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const language = navigator.language;
  const platform = navigator.platform;
  const userAgent = navigator.userAgent;
  
  // Create a simple hash from these values
  const data = `${screen}-${timezone}-${language}-${platform}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const fingerprint = Math.abs(hash).toString(36);
  
  // Parse browser name
  let browserName = 'Unknown Browser';
  if (userAgent.includes('Chrome')) browserName = 'Chrome';
  else if (userAgent.includes('Firefox')) browserName = 'Firefox';
  else if (userAgent.includes('Safari')) browserName = 'Safari';
  else if (userAgent.includes('Edge')) browserName = 'Edge';
  
  // Parse device type
  let deviceType = 'Desktop';
  if (/mobile/i.test(userAgent)) deviceType = 'Mobile';
  else if (/tablet/i.test(userAgent)) deviceType = 'Tablet';
  
  return {
    fingerprint,
    name: `${deviceType} - ${browserName}`,
    browserInfo: `${browserName} on ${platform}`
  };
};

// Generate a unique session token
const generateSessionToken = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

export const useSessionProtection = () => {
  const { user } = useAuth();
  const { isStudent, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const { isRTL } = useLanguage();
  const [sessionState, setSessionState] = useState<SessionState>({
    isNewDevice: false,
    sessionEnded: false,
    endReason: null,
    deviceCount: 0
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const sessionTokenRef = useRef<string | null>(null);
  const deviceIdRef = useRef<string | null>(null);

  // Show new device notification
  const showNewDeviceNotification = useCallback(() => {
    toast({
      title: isRTL ? 'جهاز جديد' : 'New Device',
      description: isRTL 
        ? 'تم تسجيل الدخول من جهاز جديد. إذا لم تكن أنت، يرجى تغيير كلمة المرور.'
        : 'You logged in from a new device. If this wasn\'t you, please change your password.',
      duration: 8000,
    });
  }, [toast, isRTL]);

  // Show session ended notification
  const showSessionEndedNotification = useCallback((reason: string) => {
    const messages: Record<string, { ar: string; en: string }> = {
      'new_login': {
        ar: 'تم إنهاء جلستك لأن حسابك مفتوح على جهاز آخر',
        en: 'Your session ended because your account was opened on another device'
      },
      'manual': {
        ar: 'تم إنهاء جلستك',
        en: 'Your session has ended'
      }
    };

    const message = messages[reason] || messages['manual'];
    
    toast({
      title: isRTL ? 'انتهت الجلسة' : 'Session Ended',
      description: isRTL ? message.ar : message.en,
      variant: 'destructive',
      duration: 10000,
    });
  }, [toast, isRTL]);

  // Register or update device
  const registerDevice = useCallback(async (userId: string, deviceInfo: DeviceInfo): Promise<string | null> => {
    try {
      // Check if device exists
      const { data: existingDevice } = await supabase
        .from('user_devices')
        .select('id, is_primary')
        .eq('user_id', userId)
        .eq('device_fingerprint', deviceInfo.fingerprint)
        .maybeSingle();

      if (existingDevice) {
        // Update last seen
        await supabase
          .from('user_devices')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('id', existingDevice.id);
        
        return existingDevice.id;
      }

      // Check how many devices user has
      const { count } = await supabase
        .from('user_devices')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const isFirstDevice = (count || 0) === 0;

      // Insert new device
      const { data: newDevice, error } = await supabase
        .from('user_devices')
        .insert({
          user_id: userId,
          device_fingerprint: deviceInfo.fingerprint,
          device_name: deviceInfo.name,
          browser_info: deviceInfo.browserInfo,
          is_primary: isFirstDevice
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error registering device:', error);
        return null;
      }

      // Show notification for new device (not for first device)
      if (!isFirstDevice) {
        setSessionState(prev => ({ ...prev, isNewDevice: true }));
        showNewDeviceNotification();
      }

      return newDevice.id;
    } catch (error) {
      console.error('Error in registerDevice:', error);
      return null;
    }
  }, [showNewDeviceNotification]);

  // End other active sessions
  const endOtherSessions = useCallback(async (userId: string, currentSessionToken: string) => {
    try {
      await supabase
        .from('user_sessions')
        .update({
          is_active: false,
          ended_at: new Date().toISOString(),
          ended_reason: 'new_login'
        })
        .eq('user_id', userId)
        .eq('is_active', true)
        .neq('session_token', currentSessionToken);
    } catch (error) {
      console.error('Error ending other sessions:', error);
    }
  }, []);

  // Create new session
  const createSession = useCallback(async (userId: string, deviceId: string | null): Promise<string | null> => {
    try {
      const sessionToken = generateSessionToken();

      const { error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: userId,
          device_id: deviceId,
          session_token: sessionToken,
          is_active: true
        });

      if (error) {
        console.error('Error creating session:', error);
        return null;
      }

      // End other sessions
      await endOtherSessions(userId, sessionToken);

      return sessionToken;
    } catch (error) {
      console.error('Error in createSession:', error);
      return null;
    }
  }, [endOtherSessions]);

  // Check if current session is still active
  const checkSessionStatus = useCallback(async () => {
    if (!sessionTokenRef.current || !user) return;

    try {
      const { data: session } = await supabase
        .from('user_sessions')
        .select('is_active, ended_reason')
        .eq('session_token', sessionTokenRef.current)
        .maybeSingle();

      if (session && !session.is_active) {
        setSessionState(prev => ({
          ...prev,
          sessionEnded: true,
          endReason: session.ended_reason
        }));
        showSessionEndedNotification(session.ended_reason || 'manual');
        
        // Sign out the user
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error('Error checking session status:', error);
    }
  }, [user, showSessionEndedNotification]);

  // End current session on logout
  const endCurrentSession = useCallback(async () => {
    if (!sessionTokenRef.current) return;

    try {
      await supabase
        .from('user_sessions')
        .update({
          is_active: false,
          ended_at: new Date().toISOString(),
          ended_reason: 'logout'
        })
        .eq('session_token', sessionTokenRef.current);
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }, []);

  // Initialize session protection
  useEffect(() => {
    const initializeProtection = async () => {
      // Only apply to students
      if (!user || roleLoading || !isStudent()) {
        setIsInitialized(true);
        return;
      }

      const deviceInfo = generateDeviceFingerprint();
      
      // Register device
      const deviceId = await registerDevice(user.id, deviceInfo);
      deviceIdRef.current = deviceId;

      // Create session
      const sessionToken = await createSession(user.id, deviceId);
      sessionTokenRef.current = sessionToken;

      // Get device count
      const { count } = await supabase
        .from('user_devices')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setSessionState(prev => ({ ...prev, deviceCount: count || 0 }));
      setIsInitialized(true);
    };

    if (user && !roleLoading) {
      initializeProtection();
    }
  }, [user, roleLoading, isStudent, registerDevice, createSession]);

  // Periodic session check (every 30 seconds)
  useEffect(() => {
    if (!user || !isStudent() || !sessionTokenRef.current) return;

    const interval = setInterval(checkSessionStatus, 30000);
    return () => clearInterval(interval);
  }, [user, isStudent, checkSessionStatus]);

  // Handle page visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user && isStudent()) {
        checkSessionStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, isStudent, checkSessionStatus]);

  // Handle beforeunload to end session
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Note: This is best-effort, not guaranteed to complete
      if (sessionTokenRef.current) {
        navigator.sendBeacon && navigator.sendBeacon(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_sessions?session_token=eq.${sessionTokenRef.current}`,
          JSON.stringify({ is_active: false, ended_at: new Date().toISOString(), ended_reason: 'closed' })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return {
    sessionState,
    isInitialized,
    endCurrentSession,
    checkSessionStatus
  };
};