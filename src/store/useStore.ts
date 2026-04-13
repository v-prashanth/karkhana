import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Organization, User } from '@/types/database';

interface AppState {
  // Auth
  user: User | null;
  organization: Organization | null;
  authHydrated: boolean;
  // UI State
  isOnline: boolean;
  theme: "light" | "dark";
  // Actions
  setUser: (user: User | null) => void;
  setOrganization: (org: Organization | null) => void;
  setAuthHydrated: (hydrated: boolean) => void;
  setOnlineStatus: (status: boolean) => void;
  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;
  logout: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      organization: null,
      authHydrated: false,
      isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
      theme: "light",
      setUser: (user) => set({ user }),
      setOrganization: (organization) => set({ organization }),
      setAuthHydrated: (authHydrated) => set({ authHydrated }),
      setOnlineStatus: (status) => set({ isOnline: status }),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
      logout: () => set({ user: null, organization: null, authHydrated: true }),
    }),
    {
      name: 'karkhana-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
