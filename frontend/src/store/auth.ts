import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  username: string | null;
  /** Retains the last logged-in username even after logout, so login can detect a user switch. */
  lastUsername: string | null;
  isLoggedIn: boolean;
  setAuth: (token: string, username: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      username: null,
      lastUsername: null,
      isLoggedIn: false,
      setAuth: (token, username) =>
        set({ token, username, lastUsername: username, isLoggedIn: true }),
      clearAuth: () =>
        set((state) => ({
          token: null,
          username: null,
          lastUsername: state.username, // remember who just logged out
          isLoggedIn: false,
        })),
    }),
    { name: "issa_auth" }
  )
);
