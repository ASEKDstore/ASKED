import { create } from 'zustand';

interface LabLockStore {
  labMaintenance: boolean;
  labLockMode: boolean;
  setLabMaintenance: (enabled: boolean) => void;
  enableLabLockMode: () => void;
  disableLabLockMode: () => void;
}

// Load labLockMode from sessionStorage on initialization
const getInitialLockMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const stored = sessionStorage.getItem('labLockMode');
    return stored === 'true';
  } catch {
    return false;
  }
};

export const useLabLockStore = create<LabLockStore>((set) => ({
  labMaintenance: false,
  labLockMode: getInitialLockMode(),
  setLabMaintenance: (enabled: boolean) => {
    set({ labMaintenance: enabled });
    // If maintenance is turned off, disable lock mode
    if (!enabled) {
      set({ labLockMode: false });
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem('labLockMode');
        } catch {
          // Ignore errors
        }
      }
    }
  },
  enableLabLockMode: () => {
    set({ labLockMode: true });
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('labLockMode', 'true');
      } catch {
        // Ignore errors
      }
    }
  },
  disableLabLockMode: () => {
    set({ labLockMode: false });
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('labLockMode');
      } catch {
        // Ignore errors
      }
    }
  },
}));

