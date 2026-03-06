import { createAnthropic } from '@ai-sdk/anthropic';
import { createMoonshotAI } from '@ai-sdk/moonshotai';
import { createOpenAI } from '@ai-sdk/openai';
import type { LLMConfig } from '@/stores/llmConfigStore';

export function getLanguageModel(config: LLMConfig) {
  if (config.provider === 'anthropic') {
    const provider = createAnthropic({ apiKey: config.apiKey });
    return provider(config.model);
  }

  if (config.provider === 'moonshot') {
    const provider = createMoonshotAI({ apiKey: config.apiKey });
    return provider(config.model);
  }

  const provider = createOpenAI({ apiKey: config.apiKey });
  return provider(config.model);
}
