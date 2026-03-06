import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import type { PullRequest } from '@/api/types';
import { PRReviewCard } from './PRReviewCard';
import { View } from 'react-native';

interface PRDeckProps {
  current: PullRequest;
  next?: PullRequest;
  onOpenReview: () => void;
  onSkip: () => void;
}

export function PRDeck({ current, next, onOpenReview, onSkip }: PRDeckProps) {
  return (
    <View className="flex-1 justify-center px-5 pb-28 pt-24">
      {next ? (
        <View className="absolute left-8 right-8 top-[150] rounded-[30px] border border-border/60 bg-card/45 px-5 py-6 opacity-80">
          <Text className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Up next</Text>
          <Text className="mt-2 text-lg font-semibold text-foreground/80" numberOfLines={2}>{next.title}</Text>
        </View>
      ) : null}

      <PRReviewCard pr={current} />

      <View className="mt-6 flex-row gap-3">
        <Button variant="outline" className="flex-1 rounded-2xl" onPress={onSkip}>
          <Text>Skip PR</Text>
        </Button>
        <Button className="flex-1 rounded-2xl" onPress={onOpenReview}>
          <Text>Open Review</Text>
        </Button>
      </View>
    </View>
  );
}
