import { createContext, useContext, ReactNode } from 'react';
import { useSmartEngagement } from '@/hooks/useSmartEngagement';
import { UXModalControllerProvider } from '@/hooks/useUXModalController';
import { CookieConsent } from './CookieConsent';
import { PushPermissionPrompt } from './PushPermissionPrompt';
import { PWAInstallPrompt } from './PWAInstallPrompt';

type EngagementContextType = ReturnType<typeof useSmartEngagement>;

const SmartEngagementContext = createContext<EngagementContextType | null>(null);

interface SmartEngagementProviderProps {
  children: ReactNode;
}

/**
 * Inner provider that uses the modal controller
 * Must be inside UXModalControllerProvider
 */
const SmartEngagementInner = ({ children }: SmartEngagementProviderProps) => {
  const engagement = useSmartEngagement();

  return (
    <SmartEngagementContext.Provider value={engagement}>
      {children}
      
      {/* Cookie Consent Banner - auto-accepts silently */}
      <CookieConsent
        status={engagement.cookieConsent}
        onAccept={engagement.acceptCookies}
        onDecline={engagement.declineCookies}
      />

      {/* Push Permission Prompt - controlled by modal controller */}
      <PushPermissionPrompt
        show={engagement.canShowPushPrompt}
        onAccept={engagement.requestPushPermission}
        onDismiss={engagement.dismissPushPrompt}
      />

      {/* PWA Install Prompt - controlled by modal controller, lower priority */}
      <PWAInstallPrompt
        show={engagement.canShowInstallPrompt}
        onInstall={engagement.triggerInstall}
        onDismiss={engagement.dismissInstallPrompt}
        onShown={engagement.markInstallPromptShown}
      />
    </SmartEngagementContext.Provider>
  );
};

/**
 * Main provider that wraps children with UX modal controller
 * Ensures only ONE system popup is visible at any time
 */
export const SmartEngagementProvider = ({ children }: SmartEngagementProviderProps) => {
  return (
    <UXModalControllerProvider>
      <SmartEngagementInner>
        {children}
      </SmartEngagementInner>
    </UXModalControllerProvider>
  );
};

export const useEngagement = () => {
  const context = useContext(SmartEngagementContext);
  if (!context) {
    throw new Error('useEngagement must be used within SmartEngagementProvider');
  }
  return context;
};

// Safe hook that returns null if not within provider (for use in components that may be outside the provider)
export const useEngagementSafe = () => {
  const context = useContext(SmartEngagementContext);
  return context;
};
