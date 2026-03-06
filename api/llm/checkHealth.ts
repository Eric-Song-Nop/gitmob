import { generateObject } from 'ai';
import { z } from 'zod';

import { getGenerationOptions, getLanguageModel, getProviderMeta } from './providers';
import type { LLMConfig, LLMHealthCheckResult } from '@/stores/llmConfigStore';

const healthSchema = z.object({
  segments: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      summary: z.string(),
      rationale: z.string(),
      risk: z.enum(['low', 'medium', 'high']),
      refs: z.array(
        z.object({
          filePath: z.string(),
          hunkKey: z.string(),
        })
      ),
    })
  ),
});

const HEALTH_PROMPT = `You are validating structured output for a mobile code review segmentation workflow.
Return exactly one semantic review step that references the provided hunk.
The step should read like a focused review segment, not a file slice.
Use an action-oriented title, a behavior summary, and a rationale that explains grouping and order.
Do not invent fields.

Input:
- prTitle: Health Check
- prBody: Validate native structured outputs for segmentation
- filePath: src/example.ts
- hunkKey: src/example.ts::0
- header: @@ -1,1 +1,2 @@
- additions: 1
- deletions: 0
- summary: add a console log
`;

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const withCause = error as Error & { cause?: unknown };
    if (typeof withCause.cause === 'string' && withCause.cause.trim()) {
      return `${error.message}\n${withCause.cause}`;
    }

    if (withCause.cause && typeof withCause.cause === 'object') {
      const cause = withCause.cause as {
        message?: unknown;
        error?: { message?: unknown };
        responseBody?: unknown;
        statusCode?: unknown;
      };
      const causeMessage =
        typeof cause.message === 'string'
          ? cause.message
          : typeof cause.error?.message === 'string'
            ? cause.error.message
            : null;
      const statusPrefix =
        typeof cause.statusCode === 'number' ? `HTTP ${cause.statusCode}: ` : '';

      if (causeMessage) {
        return `${statusPrefix}${causeMessage}`;
      }

      if (typeof cause.responseBody === 'string' && cause.responseBody.trim()) {
        return `${statusPrefix}${cause.responseBody}`;
      }
    }

    return error.message;
  }

  return 'Unknown error';
}

export async function checkLLMHealth(
  config: LLMConfig
): Promise<Omit<LLMHealthCheckResult, 'stale'>> {
  const startedAt = Date.now();
  const meta = getProviderMeta(config);
  const generationOptions = getGenerationOptions(config);

  try {
    const model = getLanguageModel(config);
    const result = await generateObject({
      model,
      schema: healthSchema,
      prompt: HEALTH_PROMPT,
      ...generationOptions,
    });

    if (result.object.segments.length === 0) {
      throw new Error('Model returned no segments.');
    }

    return {
      ok: true,
      provider: meta.provider,
      model: meta.model,
      baseURL: meta.baseURL,
      regionLabel: meta.regionLabel,
      latencyMs: Date.now() - startedAt,
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      ok: false,
      provider: meta.provider,
      model: meta.model,
      baseURL: meta.baseURL,
      regionLabel: meta.regionLabel,
      latencyMs: Date.now() - startedAt,
      checkedAt: new Date().toISOString(),
      error: extractErrorMessage(error),
    };
  }
}
