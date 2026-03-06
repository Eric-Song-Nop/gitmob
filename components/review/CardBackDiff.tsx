import { DiffView } from '@/components/pr/DiffView';
import { Text } from '@/components/ui/text';
import type { ReviewThread } from '@/api/types';
import type { DiffFile } from '@/services/diffParser';
import { Pressable, View } from 'react-native';

interface CardBackDiffProps {
  file: DiffFile;
  threads: ReviewThread[];
  onFlip: () => void;
  onLinePress?: (path: string, line: number) => void;
}

export function CardBackDiff({ file, threads, onFlip, onLinePress }: CardBackDiffProps) {
  return (
    <View className="flex-1 overflow-hidden rounded-[30px] bg-card">
      <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
        <Text className="font-mono text-xs text-muted-foreground">{file.newPath || file.oldPath}</Text>
        <Pressable onPress={onFlip} className="rounded-full border border-border bg-backgroundAlt px-3 py-2">
          <Text className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Front</Text>
        </Pressable>
      </View>
      <View className="border-b border-border px-4 py-2">
        <Text className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Tap a line to comment.
        </Text>
      </View>
      <DiffView file={file} threads={threads} onLinePress={onLinePress} />
    </View>
  );
}
