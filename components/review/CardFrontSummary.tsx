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
  return (
    <View className="flex-1 justify-between px-5 py-6">
      <View>
        <View className="flex-row items-center justify-between gap-2">
          <Badge className={RISK_CLASS[segment.risk]}>
            <Text className="text-xs font-semibold text-primary-foreground uppercase">{segment.risk}</Text>
          </Badge>
          <Text className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Summary</Text>
        </View>

        <Text variant="h3" className="mt-5 border-b-0 pb-0 text-left text-[30px] leading-[34px]">
          {segment.title}
        </Text>
        <Text className="mt-4 text-base leading-7 text-foreground/90">{segment.summary}</Text>
      </View>

      <View className="gap-5">
        <View>
          <Text className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Why it matters</Text>
          <Text className="mt-2 text-sm leading-6 text-foreground/85">{segment.rationale}</Text>
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-muted-foreground">{segment.refs.length} hunk refs</Text>
          <Text className="text-sm text-muted-foreground">Tap to flip</Text>
        </View>
      </View>
    </View>
  );
}
