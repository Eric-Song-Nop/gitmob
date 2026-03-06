import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Platform } from 'react-native';

const storage = createJSONStorage<LLMConfigState>(() => {
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

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'moonshot';
  model: string;
  apiKey: string;
}

interface LLMConfigState {
  config: LLMConfig;
  setConfig: (config: Partial<LLMConfig>) => void;
}

const DEFAULTS: LLMConfig = {
  provider: 'openai',
  model: 'gpt-4.1-mini',
  apiKey: '',
};

export const useLLMConfigStore = create<LLMConfigState>()(
  persist(
    (set) => ({
      config: DEFAULTS,
      setConfig: (partial) =>
        set((state) => ({
          config: { ...state.config, ...partial },
        })),
    }),
    {
      name: 'llm-config-storage',
      storage,
    }
  )
);
