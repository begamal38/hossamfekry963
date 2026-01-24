import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUXModalControllerSafe, ModalPriority } from '@/hooks/useUXModalController';

const COOKIE_CONSENT_KEY = 'platform_cookie_consent';
const PUSH_DISMISSED_KEY = 'push_notification_dismissed';
const INSTALL_DISMISSED_KEY = 'pwa_install_dismissed';
const ENGAGEMENT_SCORE_KEY = 'user_engagement_score';

type ConsentStatus = 'pending' | 'accepted' | 'declined';
type EngagementTrigger = 'lesson_complete' | 'focus_active_60s' | 'enrollment' | 'page_navigation';

interface EngagementState {
  cookieConsent: ConsentStatus;
  pushPermission: NotificationPermission | 'unsupported';
  canShowPushPrompt: boolean;
  canShowInstallPrompt: boolean;
  isAppInstalled: boolean;
  engagementScore: number;
}

// Session ID for anonymous tracking
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('engagement_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('engagement_session_id', sessionId);
  }
  return sessionId;
};

// Detect device type
const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  const ua = navigator.userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
};

export const useSmartEngagement = () => {
  const { user } = useAuth();
  const modalController = useUXModalControllerSafe();
  
  const [state, setState] = useState<EngagementState>(() => ({
    cookieConsent: (localStorage.getItem(COOKIE_CONSENT_KEY) as ConsentStatus) || 'pending',
    pushPermission: 'Notification' in window ? Notification.permission : 'unsupported',
    canShowPushPrompt: false,
    canShowInstallPrompt: false,
    isAppInstalled: window.matchMedia('(display-mode: standalone)').matches,
    engagementScore: parseInt(sessionStorage.getItem(ENGAGEMENT_SCORE_KEY) || '0', 10),
  }));

  const deferredPromptRef = useRef<Event | null>(null);
  const focusTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pageNavigationCountRef = useRef(0);
  
  // Track which prompts have been requested this session
  const pushPromptRequestedRef = useRef(false);
  const installPromptRequestedRef = useRef(false);

  // Track analytics event
  const trackEvent = useCallback(async (eventType: string) => {
    try {
      await supabase.from('platform_consent_events').insert({
        user_id: user?.id || null,
        session_id: getSessionId(),
        event_type: eventType,
        user_agent: navigator.userAgent,
        device_type: getDeviceType(),
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }, [user?.id]);

  // Cookie consent handlers
  const acceptCookies = useCallback(() => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setState(prev => ({ ...prev, cookieConsent: 'accepted' }));
    trackEvent('cookie_accepted');
  }, [trackEvent]);

  const declineCookies = useCallback(() => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
    setState(prev => ({ ...prev, cookieConsent: 'declined' }));
    trackEvent('cookie_declined');
  }, [trackEvent]);

  // Check if prompts should be shown based on engagement AND modal controller
  const evaluateEngagement = useCallback((newScore: number) => {
    const hasAcceptedCookies = localStorage.getItem(COOKIE_CONSENT_KEY) === 'accepted';
    const pushDismissed = sessionStorage.getItem(PUSH_DISMISSED_KEY) === 'true';
    const installDismissed = sessionStorage.getItem(INSTALL_DISMISSED_KEY) === 'true';
    const pushPerm = 'Notification' in window ? Notification.permission : 'unsupported';
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches;

    // Update engagement score in session
    sessionStorage.setItem(ENGAGEMENT_SCORE_KEY, newScore.toString());

    // Check eligibility for push prompt
    const pushEligible = 
      hasAcceptedCookies && 
      newScore >= 2 && 
      pushPerm === 'default' && 
      !pushDismissed;

    // Check eligibility for install prompt
    const installEligible = 
      hasAcceptedCookies && 
      newScore >= 2 && 
      !isInstalled && 
      !installDismissed &&
      deferredPromptRef.current !== null;

    // Use modal controller to determine if we CAN show (priority-based, sequential)
    let canShowPush = false;
    let canShowInstall = false;

    if (modalController) {
      // Check if push prompt is dismissed for session via controller
      const pushSessionDismissed = modalController.isDismissedForSession('push_permission');
      const installSessionDismissed = modalController.isDismissedForSession('pwa_install');

      // Try to request push prompt first (higher priority)
      if (pushEligible && !pushSessionDismissed && !pushPromptRequestedRef.current) {
        canShowPush = modalController.requestModal('push_permission', ModalPriority.NOTIFICATION);
        if (canShowPush) {
          pushPromptRequestedRef.current = true;
        }
      }

      // Only request install if push is not showing and eligible
      if (installEligible && !installSessionDismissed && !installPromptRequestedRef.current && !canShowPush) {
        canShowInstall = modalController.requestModal('pwa_install', ModalPriority.PWA_INSTALL);
        if (canShowInstall) {
          installPromptRequestedRef.current = true;
        }
      }
    } else {
      // Fallback if no controller: use legacy sequential check
      canShowPush = pushEligible && !installPromptRequestedRef.current;
      canShowInstall = installEligible && !canShowPush;
    }

    setState(prev => ({
      ...prev,
      engagementScore: newScore,
      pushPermission: pushPerm,
      isAppInstalled: isInstalled,
      canShowPushPrompt: canShowPush,
      canShowInstallPrompt: canShowInstall,
    }));
  }, [modalController]);

  // Record engagement trigger
  const recordEngagement = useCallback((trigger: EngagementTrigger) => {
    let scoreIncrease = 0;
    switch (trigger) {
      case 'lesson_complete':
        scoreIncrease = 3;
        break;
      case 'focus_active_60s':
        scoreIncrease = 2;
        break;
      case 'enrollment':
        scoreIncrease = 3;
        break;
      case 'page_navigation':
        scoreIncrease = 1;
        break;
    }
    
    const currentScore = parseInt(sessionStorage.getItem(ENGAGEMENT_SCORE_KEY) || '0', 10);
    const newScore = currentScore + scoreIncrease;
    evaluateEngagement(newScore);
  }, [evaluateEngagement]);

  // Push notification handlers
  const requestPushPermission = useCallback(async () => {
    if (!('Notification' in window)) return;
    
    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ 
        ...prev, 
        pushPermission: permission,
        canShowPushPrompt: false 
      }));
      trackEvent(permission === 'granted' ? 'push_granted' : 'push_denied');
      
      // Release the modal slot
      if (modalController) {
        modalController.releaseModal('push_permission');
      }
    } catch (error) {
      console.error('Failed to request push permission:', error);
    }
  }, [trackEvent, modalController]);

  const dismissPushPrompt = useCallback(() => {
    sessionStorage.setItem(PUSH_DISMISSED_KEY, 'true');
    setState(prev => ({ ...prev, canShowPushPrompt: false }));
    
    // Dismiss for session via controller
    if (modalController) {
      modalController.dismissForSession('push_permission');
    }
  }, [modalController]);

  // PWA install handlers
  const triggerInstall = useCallback(async () => {
    if (!deferredPromptRef.current) return;
    
    const promptEvent = deferredPromptRef.current as any;
    promptEvent.prompt();
    
    try {
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        setState(prev => ({ ...prev, isAppInstalled: true, canShowInstallPrompt: false }));
        trackEvent('pwa_installed');
      }
      deferredPromptRef.current = null;
      
      // Release the modal slot
      if (modalController) {
        modalController.releaseModal('pwa_install');
      }
    } catch (error) {
      console.error('Install prompt failed:', error);
    }
  }, [trackEvent, modalController]);

  const dismissInstallPrompt = useCallback(() => {
    sessionStorage.setItem(INSTALL_DISMISSED_KEY, 'true');
    setState(prev => ({ ...prev, canShowInstallPrompt: false }));
    
    // Dismiss for session via controller
    if (modalController) {
      modalController.dismissForSession('pwa_install');
    }
  }, [modalController]);

  // Track install prompt shown
  const markInstallPromptShown = useCallback(() => {
    trackEvent('install_shown');
  }, [trackEvent]);

  // Start focus timer (call when focus mode becomes active)
  const startFocusTimer = useCallback(() => {
    if (focusTimerRef.current) return;
    
    focusTimerRef.current = setTimeout(() => {
      recordEngagement('focus_active_60s');
      focusTimerRef.current = null;
    }, 60000); // 60 seconds
  }, [recordEngagement]);

  // Stop focus timer
  const stopFocusTimer = useCallback(() => {
    if (focusTimerRef.current) {
      clearTimeout(focusTimerRef.current);
      focusTimerRef.current = null;
    }
  }, []);

  // Listen for beforeinstallprompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      // Re-evaluate to potentially show install prompt
      evaluateEngagement(state.engagementScore);
    };

    const handleAppInstalled = () => {
      setState(prev => ({ ...prev, isAppInstalled: true, canShowInstallPrompt: false }));
      deferredPromptRef.current = null;
      
      // Release modal if it was showing
      if (modalController) {
        modalController.releaseModal('pwa_install');
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [evaluateEngagement, state.engagementScore, modalController]);

  // Track page navigation
  useEffect(() => {
    pageNavigationCountRef.current += 1;
    if (pageNavigationCountRef.current >= 2) {
      recordEngagement('page_navigation');
    }
  }, [recordEngagement]);

  // Cleanup focus timer on unmount
  useEffect(() => {
    return () => {
      if (focusTimerRef.current) {
        clearTimeout(focusTimerRef.current);
      }
    };
  }, []);

  return {
    // State
    ...state,
    
    // Cookie consent
    acceptCookies,
    declineCookies,
    
    // Push notifications
    requestPushPermission,
    dismissPushPrompt,
    
    // PWA install
    triggerInstall,
    dismissInstallPrompt,
    markInstallPromptShown,
    
    // Engagement tracking
    recordEngagement,
    startFocusTimer,
    stopFocusTimer,
  };
};
