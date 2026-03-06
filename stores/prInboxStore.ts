import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const storage = createJSONStorage<PRInboxPreferences>(() => {
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

interface PRInboxPreferences {
  snoozedPRKeys: string[];
  snoozePR: (prKey: string) => void;
  unsnoozePR: (prKey: string) => void;
  clearSnoozed: () => void;
}

export const usePRInboxStore = create<PRInboxPreferences>()(
  persist(
    (set) => ({
      snoozedPRKeys: [],
      snoozePR: (prKey) =>
        set((state) => ({
          snoozedPRKeys: state.snoozedPRKeys.includes(prKey)
            ? state.snoozedPRKeys
            : [...state.snoozedPRKeys, prKey],
        })),
      unsnoozePR: (prKey) =>
        set((state) => ({
          snoozedPRKeys: state.snoozedPRKeys.filter((key) => key !== prKey),
        })),
      clearSnoozed: () => set({ snoozedPRKeys: [] }),
    }),
    {
      name: 'pr-inbox-preferences',
      storage,
    }
  )
);
