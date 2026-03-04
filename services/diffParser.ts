export interface DiffLine {
  type: 'addition' | 'deletion' | 'context';
  content: string;
  oldLineNumber: number | null;
  newLineNumber: number | null;
}

export interface DiffHunk {
  header: string;
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
  lines: DiffLine[];
}

export interface DiffFile {
  oldPath: string;
  newPath: string;
  hunks: DiffHunk[];
}

const DIFF_HEADER_RE = /^diff --git a\/(.+) b\/(.+)$/;
const HUNK_RE = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)$/;

/**
 * Parse a unified diff string into structured DiffFile objects.
 */
export function parseDiff(diffText: string): DiffFile[] {
  const files: DiffFile[] = [];
  const lines = diffText.split('\n');
  let i = 0;

  while (i < lines.length) {
    const headerMatch = lines[i].match(DIFF_HEADER_RE);
    if (!headerMatch) {
      i++;
      continue;
    }

    const file: DiffFile = {
      oldPath: headerMatch[1],
      newPath: headerMatch[2],
      hunks: [],
    };

    i++;

    // Skip file metadata lines (index, ---, +++)
    while (i < lines.length && !lines[i].startsWith('@@') && !lines[i].startsWith('diff --git')) {
      i++;
    }

    // Parse hunks
    while (i < lines.length && !lines[i].startsWith('diff --git')) {
      const hunkMatch = lines[i].match(HUNK_RE);
      if (!hunkMatch) {
        i++;
        continue;
      }

      const hunk: DiffHunk = {
        header: lines[i],
        oldStart: parseInt(hunkMatch[1], 10),
        oldCount: parseInt(hunkMatch[2] ?? '1', 10),
        newStart: parseInt(hunkMatch[3], 10),
        newCount: parseInt(hunkMatch[4] ?? '1', 10),
        lines: [],
      };

      let oldLine = hunk.oldStart;
      let newLine = hunk.newStart;

      i++;

      while (i < lines.length && !lines[i].startsWith('@@') && !lines[i].startsWith('diff --git')) {
        const line = lines[i];

        if (line.startsWith('+')) {
          hunk.lines.push({
            type: 'addition',
            content: line.substring(1),
            oldLineNumber: null,
            newLineNumber: newLine++,
          });
        } else if (line.startsWith('-')) {
          hunk.lines.push({
            type: 'deletion',
            content: line.substring(1),
            oldLineNumber: oldLine++,
            newLineNumber: null,
          });
        } else if (line.startsWith(' ') || line === '') {
          hunk.lines.push({
            type: 'context',
            content: line.startsWith(' ') ? line.substring(1) : line,
            oldLineNumber: oldLine++,
            newLineNumber: newLine++,
          });
        } else if (line.startsWith('\\')) {
          // "\ No newline at end of file" - skip
          i++;
          continue;
        } else {
          break;
        }

        i++;
      }

      file.hunks.push(hunk);
    }

    files.push(file);
  }

  return files;
}
