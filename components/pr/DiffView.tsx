import { memo, useMemo } from 'react';
import { FlatList, View } from 'react-native';
import { DiffLine } from './DiffLine';
import { DiffHunkHeader } from './DiffHunkHeader';
import { CommentThread } from './CommentThread';
import type { DiffFile } from '@/services/diffParser';
import type { ReviewThread } from '@/api/types';

interface DiffViewProps {
  file: DiffFile;
  threads: ReviewThread[];
}

type ListItem =
  | { type: 'hunk-header'; key: string; header: string }
  | { type: 'line'; key: string; line: DiffFile['hunks'][0]['lines'][0] }
  | { type: 'comment'; key: string; thread: ReviewThread };

function DiffViewComponent({ file, threads }: DiffViewProps) {
  // Index threads by new line number for this file
  const threadsByLine = useMemo(() => {
    const map = new Map<number, ReviewThread[]>();
    for (const thread of threads) {
      if (thread.path === file.newPath && thread.line != null) {
        const existing = map.get(thread.line);
        if (existing) {
          existing.push(thread);
        } else {
          map.set(thread.line, [thread]);
        }
      }
    }
    return map;
  }, [threads, file.newPath]);

  // Build flat list of items: hunk headers + diff lines + inline comments
  const items = useMemo(() => {
    const result: ListItem[] = [];

    for (let hi = 0; hi < file.hunks.length; hi++) {
      const hunk = file.hunks[hi];
      result.push({
        type: 'hunk-header',
        key: `hunk-${hi}`,
        header: hunk.header,
      });

      for (let li = 0; li < hunk.lines.length; li++) {
        const line = hunk.lines[li];
        result.push({
          type: 'line',
          key: `line-${hi}-${li}`,
          line,
        });

        // Insert comment threads after the corresponding line
        if (line.newLineNumber != null) {
          const lineThreads = threadsByLine.get(line.newLineNumber);
          if (lineThreads) {
            for (const thread of lineThreads) {
              result.push({
                type: 'comment',
                key: `comment-${thread.id}`,
                thread,
              });
            }
          }
        }
      }
    }

    return result;
  }, [file.hunks, threadsByLine]);

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.key}
      renderItem={({ item }) => {
        switch (item.type) {
          case 'hunk-header':
            return <DiffHunkHeader header={item.header} />;
          case 'line':
            return <DiffLine line={item.line} />;
          case 'comment':
            return <CommentThread thread={item.thread} />;
        }
      }}
      getItemLayout={(_data, index) => ({
        length: 22,
        offset: 22 * index,
        index,
      })}
      initialNumToRender={50}
      maxToRenderPerBatch={30}
      windowSize={10}
      removeClippedSubviews
    />
  );
}

export const DiffView = memo(DiffViewComponent);
