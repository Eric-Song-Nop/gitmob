import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import type { SegmentCardModel } from '@/api/llm/types';
import { View } from 'react-native';

interface CardFrontSummaryProps {
  segment: SegmentCardModel;
}

const RISK_CLASS = {
  low: 'bg-[#98971a]',
  medium: 'bg-[#d79921]',
  high: 'bg-destructive',
} as const;

export function CardFrontSummary({ segment }: CardFrontSummaryProps) {
  const fileCount = new Set(segment.refs.map((ref) => ref.filePath)).size;

  return (
    <View className="flex-1 justify-between px-5 py-6">
      <View>
        <View className="flex-row items-center justify-between gap-2">
          <Badge className={RISK_CLASS[segment.risk]}>
            <Text className="text-xs font-semibold text-primary-foreground uppercase">{segment.risk}</Text>
          </Badge>
          <Text className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Conclusion</Text>
        </View>

        <Text variant="h3" className="mt-5 border-b-0 pb-0 text-left text-[30px] leading-[34px]">
          {segment.title}
        </Text>
        <Text className="mt-4 text-xs uppercase tracking-[0.22em] text-muted-foreground">
          Why this deserves a call
        </Text>
        <Text className="mt-2 text-base leading-7 text-foreground/90">{segment.rationale}</Text>
      </View>

      <View className="gap-5">
        <View>
          <Text className="text-xs uppercase tracking-[0.24em] text-muted-foreground">LLM summary</Text>
          <Text className="mt-2 text-sm leading-6 text-foreground/85">{segment.summary}</Text>
        </View>
        <View className="rounded-[24px] border border-border/70 bg-backgroundAlt/70 px-4 py-4">
          <Text className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Impact scope</Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            <Badge variant="secondary">
              <Text className="text-xs">{fileCount} files</Text>
            </Badge>
            <Badge variant="secondary">
              <Text className="text-xs">{segment.refs.length} refs</Text>
            </Badge>
          </View>
          <Text className="mt-3 text-sm leading-6 text-foreground/80">
            Swipe right to accept, left to raise concern, up to comment. Tap to inspect the diff.
          </Text>
        </View>
      </View>
    </View>
  );
}
