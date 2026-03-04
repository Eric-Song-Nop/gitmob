import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Text } from '@/components/ui/text';
import { formatRelativeTime } from '@/lib/date';
import type { ReviewThread } from '@/api/types';
import { View } from 'react-native';

interface CommentThreadProps {
  thread: ReviewThread;
}

function CommentThread({ thread }: CommentThreadProps) {
  return (
    <View className="mx-2 my-1 rounded-lg border border-border bg-card">
      {thread.isResolved && (
        <View className="border-b border-border bg-muted px-3 py-1">
          <Text variant="small" className="text-muted-foreground italic">Resolved</Text>
        </View>
      )}
      {thread.comments.map((comment) => (
        <View key={comment.id} className="gap-1.5 border-b border-border px-3 py-2 last:border-b-0">
          <View className="flex-row items-center gap-2">
            <Avatar alt={comment.author?.login ?? 'User'} className="h-4 w-4">
              {comment.author?.avatarUrl ? (
                <AvatarImage source={{ uri: comment.author.avatarUrl }} />
              ) : (
                <AvatarFallback>
                  <Text className="text-[6px]">{comment.author?.login?.charAt(0) ?? '?'}</Text>
                </AvatarFallback>
              )}
            </Avatar>
            <Text className="text-xs font-semibold">{comment.author?.login}</Text>
            <Text className="text-xs text-muted-foreground">
              {formatRelativeTime(comment.createdAt)}
            </Text>
          </View>
          <Text className="text-xs leading-4">{comment.body}</Text>
        </View>
      ))}
    </View>
  );
}

export { CommentThread };
