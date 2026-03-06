import { createAnthropic } from '@ai-sdk/anthropic';
import { createMoonshotAI, type MoonshotAIChatModelId } from '@ai-sdk/moonshotai';
import { createOpenAI } from '@ai-sdk/openai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { LLMConfig } from '@/stores/llmConfigStore';

const MOONSHOT_BASE_URLS = {
  china: 'https://api.moonshot.cn/v1',
  global: 'https://api.moonshot.ai/v1',
} as const;
const MOONSHOT_K2_5 = 'kimi-k2.5';

export interface ProviderMeta {
  provider: LLMConfig['provider'];
  model: string;
  baseURL?: string;
  regionLabel?: string;
}

interface GenerationOptions {
  temperature?: number;
  providerOptions?: {
    moonshot?: {
      thinking?: {
        type?: 'enabled' | 'disabled';
        budgetTokens?: number;
      };
      reasoningHistory?: 'disabled' | 'interleaved' | 'preserved';
    };
  };
}

function isMoonshotK2_5(config: LLMConfig) {
  return config.provider === 'moonshot' && config.model === MOONSHOT_K2_5;
}

function stripMoonshotUnsupportedSchemaKeywords(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripMoonshotUnsupportedSchemaKeywords);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== '$schema')
        .map(([key, entry]) => [key, stripMoonshotUnsupportedSchemaKeywords(entry)])
    );
  }

  return value;
}

function transformMoonshotRequestBody(args: Record<string, any>) {
  const thinking = args.thinking as
    | { type?: string; budgetTokens?: number }
    | undefined;
  const reasoningHistory = args.reasoningHistory as string | undefined;
  const { thinking: _, reasoningHistory: __, ...rest } = args;

  return {
    ...rest,
    ...(rest.response_format?.type === 'json_schema' &&
      rest.response_format.json_schema?.schema && {
        response_format: {
          ...rest.response_format,
          json_schema: {
            ...rest.response_format.json_schema,
            schema: stripMoonshotUnsupportedSchemaKeywords(
              rest.response_format.json_schema.schema
            ),
          },
        },
      }),
    ...(thinking && {
      thinking: {
        type: thinking.type,
        ...(thinking.budgetTokens !== undefined && {
          budget_tokens: thinking.budgetTokens,
        }),
      },
    }),
    ...(reasoningHistory && {
      reasoning_history: reasoningHistory,
    }),
  };
}

export function getProviderMeta(config: LLMConfig): ProviderMeta {
  if (config.provider === 'moonshot') {
    const region = config.moonshotRegion ?? 'china';
    return {
      provider: config.provider,
      model: config.model,
      baseURL: MOONSHOT_BASE_URLS[region],
      regionLabel: region === 'china' ? 'China' : 'Global',
    };
  }

  return {
    provider: config.provider,
    model: config.model,
  };
}

export function getGenerationOptions(config: LLMConfig): GenerationOptions {
  if (isMoonshotK2_5(config)) {
    return {
      temperature: 0.6,
      providerOptions: {
        moonshot: {
          thinking: {
            type: 'disabled',
          },
        },
      },
    };
  }

  return {};
}

export function getLanguageModel(config: LLMConfig) {
  if (config.provider === 'anthropic') {
    const provider = createAnthropic({ apiKey: config.apiKey });
    return provider(config.model);
  }

  if (config.provider === 'moonshot') {
    const meta = getProviderMeta(config);
    if (isMoonshotK2_5(config)) {
      const provider = createOpenAICompatible<
        MoonshotAIChatModelId,
        string,
        string,
        string
      >({
        name: 'moonshot',
        apiKey: config.apiKey,
        baseURL: meta.baseURL!,
        includeUsage: true,
        supportsStructuredOutputs: true,
        transformRequestBody: transformMoonshotRequestBody,
      });
      return provider(config.model as MoonshotAIChatModelId);
    }

    const provider = createMoonshotAI({
      apiKey: config.apiKey,
      baseURL: meta.baseURL,
    });
    return provider(config.model);
  }

  const provider = createOpenAI({ apiKey: config.apiKey });
  return provider(config.model);
}
