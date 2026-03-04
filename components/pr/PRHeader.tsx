import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatRelativeTime } from '@/lib/date';
import { Icon } from '@/components/ui/icon';
import { GitBranch } from 'lucide-react-native';
import type { PullRequestDetail } from '@/api/types';
import { View } from 'react-native';

interface PRHeaderProps {
  pr: PullRequestDetail;
}

function PRHeader({ pr }: PRHeaderProps) {
  return (
    <View className="gap-3 border-b border-border px-4 pb-4 pt-2">
      {/* Title + number */}
      <View className="flex-row items-start gap-2">
        <Text className="flex-1 text-lg font-bold leading-6">
          {pr.title}
        </Text>
        <Text variant="muted" className="text-base">
          #{pr.number}
        </Text>
      </View>

      {/* Branch info */}
      <View className="flex-row items-center gap-1.5">
        <Icon as={GitBranch} className="h-3.5 w-3.5 text-muted-foreground" />
        <Text variant="small" className="text-muted-foreground" numberOfLines={1}>
          {pr.headRefName}
        </Text>
        <Text variant="small" className="text-muted-foreground">→</Text>
        <Text variant="small" className="text-muted-foreground" numberOfLines={1}>
          {pr.baseRefName}
        </Text>
      </View>

      {/* Author + status + time */}
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
        <Text variant="small" className="ml-auto text-muted-foreground">
          {formatRelativeTime(pr.createdAt)}
        </Text>
      </View>

      {/* Stats row */}
      <View className="flex-row items-center gap-3">
        <View className="flex-row gap-1.5">
          <Text className="text-xs font-medium text-green-600">+{pr.additions}</Text>
          <Text className="text-xs font-medium text-red-600">-{pr.deletions}</Text>
        </View>
        <Text variant="small" className="text-muted-foreground">
          {pr.changedFiles} files
        </Text>
        <Text variant="small" className="text-muted-foreground">
          {pr.commits} commits
        </Text>
      </View>

      {/* Labels */}
      {pr.labels.length > 0 && (
        <View className="flex-row flex-wrap gap-1">
          {pr.labels.map((label) => (
            <Badge key={label.name} variant="outline" className="px-1.5 py-0">
              <Text className="text-[10px]">{label.name}</Text>
            </Badge>
          ))}
        </View>
      )}
    </View>
  );
}

export { PRHeader };
