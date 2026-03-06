import type { SegmentCardModel } from '@/api/llm/types';
import type { DiffFile } from '@/services/diffParser';
import type { ReviewThread } from '@/api/types';
import { SegmentReviewCard } from './SegmentReviewCard';
import { Text } from '@/components/ui/text';
import { View } from 'react-native';

interface SegmentDeckProps {
  segment: SegmentCardModel;
  nextSegment?: SegmentCardModel;
  isFlipped: boolean;
  onFlip: () => void;
  file?: DiffFile;
  threads: ReviewThread[];
  onLinePress?: (path: string, line: number) => void;
}

export function SegmentDeck({
  segment,
  nextSegment,
  isFlipped,
  onFlip,
  file,
  threads,
  onLinePress,
}: SegmentDeckProps) {
  return (
    <View className="flex-1 px-5 pb-28 pt-24">
      {nextSegment ? (
        <View className="absolute left-8 right-8 top-[140] rounded-[30px] border border-border/60 bg-card/40 px-5 py-6 opacity-80">
          <Text className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Next segment</Text>
          <Text className="mt-2 text-lg font-semibold text-foreground/80" numberOfLines={2}>{nextSegment.title}</Text>
        </View>
      ) : null}

      <SegmentReviewCard
        segment={segment}
        isFlipped={isFlipped}
        onFlip={onFlip}
        file={file}
        threads={threads}
        onLinePress={onLinePress}
      />
    </View>
  );
}
