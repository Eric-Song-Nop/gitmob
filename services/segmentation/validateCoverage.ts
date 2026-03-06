import type { SegmentCardModel, HunkReference } from '@/api/llm/types';

export function validateCoverage(segments: SegmentCardModel[], hunks: HunkReference[]) {
  const expected = new Set(hunks.map((hunk) => hunk.hunkKey));
  const seen = new Map<string, number>();

  for (const segment of segments) {
    for (const ref of segment.refs) {
      seen.set(ref.hunkKey, (seen.get(ref.hunkKey) ?? 0) + 1);
    }
  }

  const missing = [...expected].filter((key) => !seen.has(key));
  const duplicates = [...seen.entries()].filter(([, count]) => count > 1).map(([key]) => key);

  if (missing.length || duplicates.length) {
    throw new Error(
      `Invalid segmentation coverage. Missing: ${missing.join(', ') || 'none'}; Duplicates: ${duplicates.join(', ') || 'none'}`
    );
  }
}
