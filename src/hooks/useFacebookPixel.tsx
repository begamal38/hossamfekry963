import { useCallback } from 'react';

// Allowed production domains
const ALLOWED_DOMAINS = [
  'www.hossamfekry.com',
  'hossamfekry.com',
  'hossamfekry9.lovable.app',
];

// Check if we're on a production domain
const isProductionDomain = (): boolean => {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return ALLOWED_DOMAINS.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
};

// TypeScript declaration for fbq
declare global {
  interface Window {
    fbq?: (
      action: string,
      event: string,
      params?: Record<string, unknown>
    ) => void;
  }
}

interface UseFacebookPixelReturn {
  trackPageView: () => void;
  trackViewContent: (contentName: string, contentId?: string, value?: number) => void;
  trackSubscribe: (value?: number, currency?: string) => void;
  trackCompleteRegistration: (method?: string) => void;
  trackLead: (contentName?: string, value?: number) => void;
  trackCustomEvent: (eventName: string, params?: Record<string, unknown>) => void;
}

/**
 * Facebook Pixel tracking hook with domain filtering
 * Only fires events on production domains to avoid polluting analytics
 */
export const useFacebookPixel = (): UseFacebookPixelReturn => {
  
  // Safe fbq call with domain check
  const safeFbq = useCallback((
    action: string,
    event: string,
    params?: Record<string, unknown>
  ) => {
    // Only track on production domains
    if (!isProductionDomain()) {
      console.log(`[FB Pixel Dev] Skipped: ${event}`, params);
      return;
    }
    
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq(action, event, params);
      console.log(`[FB Pixel] Tracked: ${event}`, params);
    }
  }, []);

  // Standard PageView event
  const trackPageView = useCallback(() => {
    safeFbq('track', 'PageView');
  }, [safeFbq]);

  // ViewContent - when user views a course/lesson
  const trackViewContent = useCallback((
    contentName: string,
    contentId?: string,
    value?: number
  ) => {
    safeFbq('track', 'ViewContent', {
      content_name: contentName,
      content_ids: contentId ? [contentId] : undefined,
      content_type: 'product',
      value: value || 0,
      currency: 'EGP',
    });
  }, [safeFbq]);

  // Subscribe - when user enrolls in a course
  const trackSubscribe = useCallback((
    value: number = 0,
    currency: string = 'EGP'
  ) => {
    safeFbq('track', 'Subscribe', {
      value: value,
      currency: currency,
      predicted_ltv: value,
    });
  }, [safeFbq]);

  // CompleteRegistration - when user signs up
  const trackCompleteRegistration = useCallback((method?: string) => {
    safeFbq('track', 'CompleteRegistration', {
      content_name: 'منصة حسام فكري',
      status: 'registered',
      value: 0,
      currency: 'EGP',
      ...(method && { method }),
    });
  }, [safeFbq]);

  // Lead - when user shows interest (e.g., watches free lesson)
  const trackLead = useCallback((contentName?: string, value?: number) => {
    safeFbq('track', 'Lead', {
      content_name: contentName || 'Free Lesson',
      value: value || 0,
      currency: 'EGP',
    });
  }, [safeFbq]);

  // Custom event for specific tracking needs
  const trackCustomEvent = useCallback((
    eventName: string,
    params?: Record<string, unknown>
  ) => {
    safeFbq('trackCustom', eventName, {
      ...params,
      currency: 'EGP',
    });
  }, [safeFbq]);

  return {
    trackPageView,
    trackViewContent,
    trackSubscribe,
    trackCompleteRegistration,
    trackLead,
    trackCustomEvent,
  };
};

export default useFacebookPixel;
