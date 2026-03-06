import { Text } from '@/components/ui/text';
import { Badge } from '@/components/ui/badge';
import type { PullRequest } from '@/api/types';
import { formatRelativeTime } from '@/lib/date';
import { View } from 'react-native';

interface PRReviewCardProps {
  pr: PullRequest;
}

export function PRReviewCard({ pr }: PRReviewCardProps) {
  return (
    <View className="rounded-[30px] border border-border bg-card px-5 py-6 shadow-sm shadow-black/10">
      <Text className="text-xs uppercase tracking-[0.28em] text-muted-foreground">{pr.repository.nameWithOwner}</Text>
      <Text variant="h3" className="mt-3 border-b-0 pb-0 text-left text-[30px] leading-[34px]">
        {pr.title}
      </Text>
      <Text className="mt-4 text-sm leading-6 text-muted-foreground">
        @{pr.author?.login} updated {formatRelativeTime(pr.updatedAt)}
      </Text>

      <View className="mt-6 flex-row flex-wrap gap-2">
        <Badge variant="secondary"><Text className="text-xs">{pr.changedFiles} files</Text></Badge>
        <Badge variant="secondary"><Text className="text-xs">+{pr.additions}</Text></Badge>
        <Badge variant="secondary"><Text className="text-xs">-{pr.deletions}</Text></Badge>
        {pr.isDraft ? <Badge><Text className="text-xs text-primary-foreground">Draft</Text></Badge> : null}
      </View>

      {pr.labels?.length ? (
        <View className="mt-6 flex-row flex-wrap gap-2">
          {pr.labels.slice(0, 4).map((label) => (
            <Badge key={label.name} variant="outline"><Text className="text-xs">{label.name}</Text></Badge>
          ))}
        </View>
      ) : null}

      <Text className="mt-10 text-sm leading-6 text-foreground/80">
        Start here if you want the highest-signal review item first.
      </Text>
    </View>
  );
}
