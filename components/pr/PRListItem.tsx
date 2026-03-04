import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatRelativeTime } from '@/lib/date';
import type { PullRequest } from '@/api/types';
import { Pressable, View } from 'react-native';

interface PRListItemProps {
  pr: PullRequest;
  onPress?: () => void;
}

function PRListItem({ pr, onPress }: PRListItemProps) {
  return (
    <Pressable onPress={onPress} disabled={!onPress}>
    <Card className="mx-4 mb-2">
      <CardContent className="gap-2 p-4">
        {/* Header: repo name + time */}
        <View className="flex-row items-center justify-between">
          <Text variant="small" className="text-muted-foreground">
            {pr.repository.nameWithOwner}
          </Text>
          <Text variant="small" className="text-muted-foreground">
            {formatRelativeTime(pr.updatedAt)}
          </Text>
        </View>

        {/* Title */}
        <Text className="text-base font-semibold" numberOfLines={2}>
          {pr.title}
        </Text>

        {/* Meta row: author + status + stats */}
        <View className="flex-row items-center gap-2">
          <Avatar alt={pr.author?.login ?? 'User'} className="h-5 w-5">
            {pr.author?.avatarUrl ? (
              <AvatarImage source={{ uri: pr.author.avatarUrl }} />
            ) : (
              <AvatarFallback>
                <Text className="text-[8px]">{pr.author?.login?.charAt(0) ?? '?'}</Text>
              </AvatarFallback>
            )}
          </Avatar>
          <Text variant="small" className="text-muted-foreground">
            {pr.author?.login}
          </Text>

          <StatusBadge state={pr.state} isDraft={pr.isDraft} />

          {/* +/- stats */}
          <View className="ml-auto flex-row gap-1.5">
            <Text className="text-xs font-medium text-green-600">+{pr.additions}</Text>
            <Text className="text-xs font-medium text-red-600">-{pr.deletions}</Text>
          </View>
        </View>

        {/* Labels */}
        {pr.labels && pr.labels.length > 0 && (
          <View className="flex-row flex-wrap gap-1">
            {pr.labels.map((label) => (
              <Badge
                key={label.name}
                variant="outline"
                className="px-1.5 py-0"
              >
                <Text className="text-[10px]">{label.name}</Text>
              </Badge>
            ))}
          </View>
        )}
      </CardContent>
    </Card>
    </Pressable>
  );
}

export { PRListItem };
