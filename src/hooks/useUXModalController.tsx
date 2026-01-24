import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';

/**
 * Global UX Modal Controller
 * Ensures only ONE system-level popup is visible at any time.
 * Implements priority-based queuing and session memory.
 */

// Priority levels (lower number = higher priority)
export enum ModalPriority {
  CRITICAL = 0,      // Errors, blocking states
  NOTIFICATION = 1,  // Push notification permission
  PWA_INSTALL = 2,   // PWA install prompt
  GUIDANCE = 3,      // Tips, marketing, guidance
}

export type ModalType = 
  | 'critical_error'
  | 'push_permission'
  | 'pwa_install'
  | 'guidance'
  | 'cookie_consent';

interface ModalRequest {
  type: ModalType;
  priority: ModalPriority;
  id: string;
}

interface UXModalControllerState {
  activeModal: ModalType | null;
  isLocked: boolean;
}

interface UXModalControllerContextValue {
  activeModal: ModalType | null;
  isLocked: boolean;
  canShow: (type: ModalType) => boolean;
  requestModal: (type: ModalType, priority: ModalPriority) => boolean;
  releaseModal: (type: ModalType) => void;
  dismissForSession: (type: ModalType) => void;
  isDismissedForSession: (type: ModalType) => boolean;
}

const UXModalControllerContext = createContext<UXModalControllerContextValue | null>(null);

// Session storage keys for dismissed modals
const DISMISSED_MODALS_KEY = 'ux_dismissed_modals';

// Get dismissed modals from session
const getDismissedModals = (): Set<ModalType> => {
  try {
    const stored = sessionStorage.getItem(DISMISSED_MODALS_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

// Save dismissed modals to session
const saveDismissedModals = (modals: Set<ModalType>) => {
  try {
    sessionStorage.setItem(DISMISSED_MODALS_KEY, JSON.stringify([...modals]));
  } catch {
    // Ignore storage errors
  }
};

interface UXModalControllerProviderProps {
  children: ReactNode;
}

export const UXModalControllerProvider = ({ children }: UXModalControllerProviderProps) => {
  const [state, setState] = useState<UXModalControllerState>({
    activeModal: null,
    isLocked: false,
  });
  
  const dismissedModalsRef = useRef<Set<ModalType>>(getDismissedModals());
  const pendingQueueRef = useRef<ModalRequest[]>([]);
  const releaseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if a modal type can be shown right now
  const canShow = useCallback((type: ModalType): boolean => {
    // If dismissed for session, cannot show
    if (dismissedModalsRef.current.has(type)) {
      return false;
    }
    
    // If locked by another modal, cannot show
    if (state.isLocked && state.activeModal !== type) {
      return false;
    }
    
    // If no active modal, can show
    if (!state.activeModal) {
      return true;
    }
    
    // Only the active modal can show
    return state.activeModal === type;
  }, [state.activeModal, state.isLocked]);

  // Process the pending queue
  const processQueue = useCallback(() => {
    if (state.isLocked || state.activeModal) {
      return;
    }
    
    if (pendingQueueRef.current.length === 0) {
      return;
    }
    
    // Sort by priority and get highest priority request
    pendingQueueRef.current.sort((a, b) => a.priority - b.priority);
    const next = pendingQueueRef.current.shift();
    
    if (next && !dismissedModalsRef.current.has(next.type)) {
      setState({
        activeModal: next.type,
        isLocked: true,
      });
    }
  }, [state.isLocked, state.activeModal]);

  // Request to show a modal
  const requestModal = useCallback((type: ModalType, priority: ModalPriority): boolean => {
    // If dismissed for session, reject
    if (dismissedModalsRef.current.has(type)) {
      console.log(`[UXModalController] Modal "${type}" dismissed for session, rejecting`);
      return false;
    }
    
    // If already active, allow
    if (state.activeModal === type) {
      return true;
    }
    
    // If locked by another modal, queue it
    if (state.isLocked && state.activeModal !== type) {
      console.log(`[UXModalController] Modal "${type}" queued (locked by "${state.activeModal}")`);
      const alreadyQueued = pendingQueueRef.current.some(r => r.type === type);
      if (!alreadyQueued) {
        pendingQueueRef.current.push({
          type,
          priority,
          id: `${type}-${Date.now()}`,
        });
      }
      return false;
    }
    
    // Lock and show
    console.log(`[UXModalController] Showing modal "${type}"`);
    setState({
      activeModal: type,
      isLocked: true,
    });
    return true;
  }, [state.activeModal, state.isLocked]);

  // Release a modal (user responded/closed)
  const releaseModal = useCallback((type: ModalType) => {
    if (state.activeModal !== type) {
      return;
    }
    
    console.log(`[UXModalController] Releasing modal "${type}"`);
    
    // Clear any existing timeout
    if (releaseTimeoutRef.current) {
      clearTimeout(releaseTimeoutRef.current);
    }
    
    // Add a small delay before processing next to prevent jarring transitions
    releaseTimeoutRef.current = setTimeout(() => {
      setState({
        activeModal: null,
        isLocked: false,
      });
      
      // Process queue after state update
      setTimeout(() => {
        processQueue();
      }, 100);
    }, 300);
  }, [state.activeModal, processQueue]);

  // Dismiss a modal for the entire session
  const dismissForSession = useCallback((type: ModalType) => {
    console.log(`[UXModalController] Dismissing modal "${type}" for session`);
    dismissedModalsRef.current.add(type);
    saveDismissedModals(dismissedModalsRef.current);
    
    // Remove from queue if present
    pendingQueueRef.current = pendingQueueRef.current.filter(r => r.type !== type);
    
    // Release if active
    if (state.activeModal === type) {
      releaseModal(type);
    }
  }, [state.activeModal, releaseModal]);

  // Check if a modal is dismissed for session
  const isDismissedForSession = useCallback((type: ModalType): boolean => {
    return dismissedModalsRef.current.has(type);
  }, []);

  const value: UXModalControllerContextValue = {
    activeModal: state.activeModal,
    isLocked: state.isLocked,
    canShow,
    requestModal,
    releaseModal,
    dismissForSession,
    isDismissedForSession,
  };

  return (
    <UXModalControllerContext.Provider value={value}>
      {children}
    </UXModalControllerContext.Provider>
  );
};

export const useUXModalController = (): UXModalControllerContextValue => {
  const context = useContext(UXModalControllerContext);
  if (!context) {
    throw new Error('useUXModalController must be used within UXModalControllerProvider');
  }
  return context;
};

// Safe version that returns null if not within provider
export const useUXModalControllerSafe = (): UXModalControllerContextValue | null => {
  return useContext(UXModalControllerContext);
};
