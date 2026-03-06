import { generateObject } from 'ai';
import { z } from 'zod';
import { getLanguageModel } from './providers';
import type { SegmentationInput, SegmentationResult } from './types';
import type { LLMConfig } from '@/stores/llmConfigStore';

const segmentSchema = z.object({
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

function buildPrompt(input: SegmentationInput) {
  const fileSections = input.files
    .map((file) => {
      const hunks = file.hunks
        .map(
          (hunk) =>
            `- hunkKey: ${hunk.hunkKey}\n  header: ${hunk.header}\n  additions: ${hunk.additions}\n  deletions: ${hunk.deletions}\n  summary: ${hunk.summaryText}`
        )
        .join('\n');

      return `file: ${file.path}\n${hunks}`;
    })
    .join('\n\n');

  return `Organize parsed GitHub diff hunks into reviewable semantic segments for a mobile code review app.

Rules:
- Every input hunk must appear in exactly one segment.
- Never invent file paths or hunk ids.
- Prefer segments that represent one coherent change.
- Keep segments small enough for a mobile review card.
- Return concise titles and summaries.

PR Title: ${input.prTitle}
PR Body: ${input.prBody ?? 'None'}

Files and Hunks:
${fileSections}`;
}

function chunkInput(input: SegmentationInput, size = 18): SegmentationInput[] {
  const flat = input.files.flatMap((file) =>
    file.hunks.map((hunk) => ({ path: file.path, hunk }))
  );

  if (flat.length <= size) return [input];

  const chunks: SegmentationInput[] = [];
  for (let i = 0; i < flat.length; i += size) {
    const slice = flat.slice(i, i + size);
    const byFile = new Map<string, typeof input.files[number]['hunks']>();

    for (const item of slice) {
      byFile.set(item.path, [...(byFile.get(item.path) ?? []), item.hunk]);
    }

    chunks.push({
      prTitle: input.prTitle,
      prBody: input.prBody,
      files: [...byFile.entries()].map(([path, hunks]) => ({ path, hunks })),
    });
  }

  return chunks;
}

export async function segmentPullRequest(
  input: SegmentationInput,
  config: LLMConfig
): Promise<SegmentationResult> {
  const model = getLanguageModel(config);
  const chunks = chunkInput(input);
  const segments = [] as SegmentationResult['segments'];

  for (let index = 0; index < chunks.length; index += 1) {
    const result = await generateObject({
      model,
      schema: segmentSchema,
      prompt: buildPrompt(chunks[index]),
    });

    segments.push(
      ...result.object.segments.map((segment) => ({
        ...segment,
        id: `${index}-${segment.id}`,
      }))
    );
  }

  return { segments };
}
