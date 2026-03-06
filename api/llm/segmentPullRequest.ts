import { generateObject } from 'ai';
import { z } from 'zod';
import { getGenerationOptions, getLanguageModel } from './providers';
import type {
  SegmentationInput,
  SegmentationResult,
  SegmentCardModel,
  SegmentQualityFlag,
} from './types';
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

const MULTI_INTENT_PATTERN = /\b(and|also|同时|以及|并且|并行)\b/i;
const GENERIC_TITLE_PATTERN =
  /^(refactor|update|fix|cleanup|clean up|changes?|improve|adjust|misc|miscellaneous)\b/i;

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

  return `You are planning a mobile-first code review route for a large pull request.

Goal:
- Organize the diff into semantic review steps, not file slices.
- Each segment should represent one clear code intent that a reviewer can judge in one pass.
- Return segments in dependency-first review order so the reviewer learns the change in the most natural sequence.

How to reason:
- Use file paths to infer module/layer relationships.
- Use hunk headers to infer function/class/section boundaries.
- Use hunk summaries to infer behavior and intent.
- Use the PR title/body only as supporting context, never as a replacement for code evidence.

Segment rules:
- Every input hunk must appear in exactly one segment.
- Never invent file paths or hunk ids.
- A good segment can be named with one action-oriented phrase.
- Do not mechanically group by file or diff adjacency.
- Cross-file segments are good when those files work together to implement one intent.
- If one segment would naturally need "and", "also", or "simultaneously" in its title, it should probably be split.
- If part of the change is the main behavior and another part is only support or cleanup, prefer separate earlier/later segments unless the support code is meaningless on its own.
- Keep each segment small enough for a focused mobile review card.

Ordering rules:
- Return segments already sorted in review order.
- Prefer this order: entry points and upstream triggers -> orchestration/state wiring -> core logic -> data/persistence/integration details -> support cleanup or cosmetic work.
- If real dependencies are unclear, choose the order that best helps a reviewer build a mental model.
- Do not default to file name order, raw diff order, or risk order.

Field expectations:
- title: a concrete action + object, describing what this segment does in the system.
- summary: what behavior or responsibility changed.
- rationale: why these hunks belong together and why this segment appears at this point in the review route.
- risk: review risk of the segment as a whole.

Title style:
- Prefer titles like "Thread review decisions into submit flow" or "Persist Moonshot region in settings".
- Avoid vague titles like "Refactor code", "Update files", or "Misc changes".

PR Title: ${input.prTitle}
PR Body: ${input.prBody ?? 'None'}

Files and Hunks:
${fileSections}`;
}

function collectQualityFlags(segment: SegmentCardModel): SegmentQualityFlag[] {
  const flags: SegmentQualityFlag[] = [];
  const fileCount = new Set(segment.refs.map((ref) => ref.filePath)).size;
  const combinedText = `${segment.title} ${segment.summary}`;

  if (segment.refs.length > 5 || fileCount > 3) {
    flags.push('possibly-too-broad');
  }

  if (MULTI_INTENT_PATTERN.test(combinedText)) {
    flags.push('possibly-multi-purpose');
  }

  if (GENERIC_TITLE_PATTERN.test(segment.title.trim())) {
    flags.push('weak-title');
  }

  return flags;
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
  const generationOptions = getGenerationOptions(config);
  const chunks = chunkInput(input);
  const segments = [] as SegmentationResult['segments'];
  const qualitySignals = [] as SegmentationResult['qualitySignals'];

  for (let index = 0; index < chunks.length; index += 1) {
    const result = await generateObject({
      model,
      schema: segmentSchema,
      prompt: buildPrompt(chunks[index]),
      ...generationOptions,
    });

    segments.push(
      ...result.object.segments.map((segment) => {
        const normalizedSegment = {
          ...segment,
          id: `${index}-${segment.id}`,
        };
        const flags = collectQualityFlags(normalizedSegment);

        if (flags.length) {
          qualitySignals.push({
            segmentId: normalizedSegment.id,
            flags,
          });
        }

        return normalizedSegment;
      })
    );
  }

  return { segments, qualitySignals };
}
