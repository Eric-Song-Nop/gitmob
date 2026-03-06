import { CardBackDiff } from './CardBackDiff';
import { CardFrontSummary } from './CardFrontSummary';
import type { SegmentCardModel } from '@/api/llm/types';
import type { DiffFile } from '@/services/diffParser';
import type { ReviewThread } from '@/api/types';
import { Pressable, View } from 'react-native';

interface SegmentReviewCardProps {
  segment: SegmentCardModel;
  isFlipped: boolean;
  onFlip: () => void;
  file?: DiffFile;
  threads: ReviewThread[];
  onLinePress?: (path: string, line: number) => void;
}

export function SegmentReviewCard({
  segment,
  isFlipped,
  onFlip,
  file,
  threads,
  onLinePress,
}: SegmentReviewCardProps) {
  if (isFlipped && file) {
    return (
      <View className="flex-1 overflow-hidden rounded-[34px] border border-border bg-card shadow-xl shadow-black/15">
        <CardBackDiff file={file} threads={threads} onFlip={onFlip} onLinePress={onLinePress} />
      </View>
    );
  }

  return (
    <Pressable onPress={onFlip} className="flex-1">
      <View className="flex-1 overflow-hidden rounded-[34px] border border-border bg-card shadow-xl shadow-black/15">
        <CardFrontSummary segment={segment} />
      </View>
    </Pressable>
  );
}
