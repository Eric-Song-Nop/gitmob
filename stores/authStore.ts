import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Platform } from 'react-native';
import { Octokit } from '@octokit/rest';

import type { GitHubUser } from '@/api/types';

// expo-secure-store is native-only; fall back to localStorage on web
const secureStorage = createJSONStorage<AuthState>(() => {
  if (Platform.OS === 'web') {
    return localStorage;
  }
  // Lazy import to avoid bundling native module on web
  const SecureStore = require('expo-secure-store');
  return {
    getItem: (key: string) => SecureStore.getItemAsync(key),
    setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
    removeItem: (key: string) => SecureStore.deleteItemAsync(key),
  };
});

interface AuthState {
  token: string | null;
  user: GitHubUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setToken: (token: string) => Promise<void>;
  fetchUser: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: true,

      setToken: async (token: string) => {
        set({ token, isAuthenticated: true });
      },

      fetchUser: async () => {
        const { token } = get();
        if (!token) return;

        try {
          const octokit = new Octokit({ auth: token });
          const { data } = await octokit.users.getAuthenticated();
          set({
            user: {
              login: data.login,
              avatarUrl: data.avatar_url,
            },
          });
        } catch {
          // Token invalid, clear state
          set({ token: null, user: null, isAuthenticated: false });
        }
      },

      logout: () => {
        set({ token: null, user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      storage: secureStorage,
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }) as AuthState,
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isAuthenticated = !!state.token;
          state.isLoading = false;
        }
      },
    }
  )
);
