import type { PRFile } from '@/api/types';

export interface FileTreeSection {
  directory: string;
  files: PRFile[];
}

/**
 * Group flat file list into sections by directory.
 * Files at the root level are grouped under "/".
 */
export function buildFileTree(files: PRFile[]): FileTreeSection[] {
  const dirMap = new Map<string, PRFile[]>();

  for (const file of files) {
    const lastSlash = file.filename.lastIndexOf('/');
    const dir = lastSlash === -1 ? '/' : file.filename.substring(0, lastSlash);

    const existing = dirMap.get(dir);
    if (existing) {
      existing.push(file);
    } else {
      dirMap.set(dir, [file]);
    }
  }

  // Sort directories alphabetically, but root first
  const entries = Array.from(dirMap.entries()).sort(([a], [b]) => {
    if (a === '/') return -1;
    if (b === '/') return 1;
    return a.localeCompare(b);
  });

  return entries.map(([directory, files]) => ({
    directory,
    files: files.sort((a, b) => a.filename.localeCompare(b.filename)),
  }));
}
