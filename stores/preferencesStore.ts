import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Platform } from 'react-native';

const storage = createJSONStorage<PreferencesState>(() => {
  if (Platform.OS === 'web') {
    return localStorage;
  }

  const SecureStore = require('expo-secure-store');
  return {
    getItem: (key: string) => SecureStore.getItemAsync(key),
    setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
    removeItem: (key: string) => SecureStore.deleteItemAsync(key),
  };
});

interface PreferencesState {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'preferences-storage',
      storage,
    }
  )
);
