import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { CheckCircle, XCircle, MessageCircle, Clock } from 'lucide-react-native';
import type { PullRequestDetail } from '@/api/types';
import { View } from 'react-native';

interface ReviewerListProps {
  pr: PullRequestDetail;
}

type ReviewState = 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'PENDING';

interface Reviewer {
  login: string;
  avatarUrl?: string;
  state: ReviewState;
}

const REVIEW_STATE_CONFIG: Record<ReviewState, { icon: typeof CheckCircle; className: string }> = {
  APPROVED: { icon: CheckCircle, className: 'text-green-600' },
  CHANGES_REQUESTED: { icon: XCircle, className: 'text-red-600' },
  COMMENTED: { icon: MessageCircle, className: 'text-muted-foreground' },
  PENDING: { icon: Clock, className: 'text-yellow-600' },
};

function ReviewerList({ pr }: ReviewerListProps) {
  const reviewers = buildReviewerList(pr);

  if (reviewers.length === 0) {
    return (
      <View className="gap-2 px-4 py-3">
        <Text variant="small" className="font-semibold">Reviewers</Text>
        <Text variant="small" className="text-muted-foreground">No reviewers</Text>
      </View>
    );
  }

  return (
    <View className="gap-2 px-4 py-3">
      <Text variant="small" className="font-semibold">Reviewers</Text>
      <View className="gap-1.5">
        {reviewers.map((reviewer) => {
          const config = REVIEW_STATE_CONFIG[reviewer.state];
          return (
            <View key={reviewer.login} className="flex-row items-center gap-2">
              <Avatar alt={reviewer.login} className="h-5 w-5">
                {reviewer.avatarUrl ? (
                  <AvatarImage source={{ uri: reviewer.avatarUrl }} />
                ) : (
                  <AvatarFallback>
                    <Text className="text-[8px]">{reviewer.login.charAt(0)}</Text>
                  </AvatarFallback>
                )}
              </Avatar>
              <Text variant="small" className="flex-1">{reviewer.login}</Text>
              <Icon as={config.icon} className={`h-4 w-4 ${config.className}`} />
            </View>
          );
        })}
      </View>
    </View>
  );
}

/** Merge requested reviewers + submitted reviews into a deduplicated list */
function buildReviewerList(pr: PullRequestDetail): Reviewer[] {
  const map = new Map<string, Reviewer>();

  // Requested reviewers (pending state)
  for (const req of pr.reviewRequests) {
    const login = req.login ?? req.name;
    if (login) {
      map.set(login, {
        login,
        avatarUrl: (req as { avatarUrl?: string }).avatarUrl,
        state: 'PENDING',
      });
    }
  }

  // Submitted reviews override pending (latest review wins)
  for (const review of pr.reviews) {
    if (review.author?.login) {
      map.set(review.author.login, {
        login: review.author.login,
        avatarUrl: review.author.avatarUrl,
        state: review.state,
      });
    }
  }

  return Array.from(map.values());
}

export { ReviewerList };
