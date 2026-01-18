import { createContext, useContext, ReactNode } from 'react';
import { useSessionProtection } from '@/hooks/useSessionProtection';

interface SessionProtectionContextType {
  sessionState: {
    sessionActive: boolean;
  };
  isInitialized: boolean;
  endCurrentSession: () => Promise<void>;
}

const SessionProtectionContext = createContext<SessionProtectionContextType | null>(null);

export const SessionProtectionProvider = ({ children }: { children: ReactNode }) => {
  const sessionProtection = useSessionProtection();

  return (
    <SessionProtectionContext.Provider value={sessionProtection}>
      {children}
    </SessionProtectionContext.Provider>
  );
};

export const useSessionProtectionContext = () => {
  const context = useContext(SessionProtectionContext);
  if (!context) {
    throw new Error('useSessionProtectionContext must be used within SessionProtectionProvider');
  }
  return context;
};
