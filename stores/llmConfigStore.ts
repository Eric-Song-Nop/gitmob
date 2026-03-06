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
  moonshotRegion?: 'china' | 'global';
}

export interface LLMHealthCheckResult {
  ok: boolean;
  provider: LLMConfig['provider'];
  model: string;
  baseURL?: string;
  regionLabel?: string;
  latencyMs: number;
  checkedAt: string;
  error?: string;
  stale: boolean;
}

interface LLMConfigState {
  config: LLMConfig;
  setConfig: (config: Partial<LLMConfig>) => void;
  healthCheck: LLMHealthCheckResult | null;
  setHealthCheck: (result: Omit<LLMHealthCheckResult, 'stale'>) => void;
  clearHealthCheck: () => void;
}

const DEFAULTS: LLMConfig = {
  provider: 'openai',
  model: 'gpt-4.1-mini',
  apiKey: '',
  moonshotRegion: 'china',
};

export const useLLMConfigStore = create<LLMConfigState>()(
  persist(
    (set) => ({
      config: DEFAULTS,
      healthCheck: null,
      setConfig: (partial) =>
        set((state) => ({
          config: { ...state.config, ...partial },
          healthCheck: state.healthCheck
            ? { ...state.healthCheck, stale: true }
            : null,
        })),
      setHealthCheck: (result) =>
        set({
          healthCheck: {
            ...result,
            stale: false,
          },
        }),
      clearHealthCheck: () => set({ healthCheck: null }),
    }),
    {
      name: 'llm-config-storage',
      storage,
    }
  )
);
