import type { DiffFile } from '@/services/diffParser';
import type { HunkReference, SegmentationInput } from '@/api/llm/types';

function summarizeHunk(filePath: string, header: string, previewLines: string[]) {
  const detail = previewLines
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4)
    .join(' | ')
    .slice(0, 240);

  return `${filePath} ${header}${detail ? ` :: ${detail}` : ''}`;
}

export function buildSegmentationInput(
  files: DiffFile[],
  prTitle: string,
  prBody?: string
): { input: SegmentationInput; flatHunks: HunkReference[] } {
  const mappedFiles = files.map((file) => {
    const filePath = file.newPath || file.oldPath;
    const hunks = file.hunks.map((hunk, index) => {
      const additions = hunk.lines.filter((line) => line.type === 'addition').length;
      const deletions = hunk.lines.filter((line) => line.type === 'deletion').length;
      const previewLines = hunk.lines
        .filter((line) => line.type !== 'context')
        .slice(0, 5)
        .map((line) => `${line.type === 'addition' ? '+' : '-'}${line.content}`);

      return {
        filePath,
        hunkKey: `${filePath}::${index}`,
        header: hunk.header,
        additions,
        deletions,
        summaryText: summarizeHunk(filePath, hunk.header, previewLines),
      } satisfies HunkReference;
    });

    return {
      path: filePath,
      hunks,
    };
  });

  const flatHunks = mappedFiles.flatMap((file) => file.hunks);

  return {
    input: {
      prTitle,
      prBody,
      files: mappedFiles,
    },
    flatHunks,
  };
}
