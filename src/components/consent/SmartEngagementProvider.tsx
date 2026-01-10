import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useSmartEngagement } from '@/hooks/useSmartEngagement';
import { CookieConsent } from './CookieConsent';
import { PushPermissionPrompt } from './PushPermissionPrompt';
import { PWAInstallPrompt } from './PWAInstallPrompt';

type EngagementContextType = ReturnType<typeof useSmartEngagement>;

const SmartEngagementContext = createContext<EngagementContextType | null>(null);

interface SmartEngagementProviderProps {
  children: ReactNode;
}

export const SmartEngagementProvider = ({ children }: SmartEngagementProviderProps) => {
  const engagement = useSmartEngagement();

  return (
    <SmartEngagementContext.Provider value={engagement}>
      {children}
      
      {/* Cookie Consent Banner - shows first */}
      <CookieConsent
        status={engagement.cookieConsent}
        onAccept={engagement.acceptCookies}
        onDecline={engagement.declineCookies}
      />

      {/* Push Permission Prompt - shows after engagement threshold */}
      <PushPermissionPrompt
        show={engagement.canShowPushPrompt}
        onAccept={engagement.requestPushPermission}
        onDismiss={engagement.dismissPushPrompt}
      />

      {/* PWA Install Prompt - shows after engagement threshold */}
      <PWAInstallPrompt
        show={engagement.canShowInstallPrompt}
        onInstall={engagement.triggerInstall}
        onDismiss={engagement.dismissInstallPrompt}
        onShown={engagement.markInstallPromptShown}
      />
    </SmartEngagementContext.Provider>
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
