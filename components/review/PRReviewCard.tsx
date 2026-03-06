import { ActivityIndicator, View } from 'react-native';

import type { InboxPRCardModel, PullRequestDetail } from '@/api/types';
import { getSourceLabel } from '@/api/queries/usePRInbox';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { formatRelativeTime } from '@/lib/date';

interface PRReviewCardProps {
  item: InboxPRCardModel;
  mode: 'front' | 'peek';
  detail?: PullRequestDetail;
  detailPending?: boolean;
}

function ReviewSummary({ detail }: { detail?: PullRequestDetail }) {
  const approved = detail?.reviews.filter((review) => review.state === 'APPROVED').length ?? 0;
  const changesRequested =
    detail?.reviews.filter((review) => review.state === 'CHANGES_REQUESTED').length ?? 0;
  const commented = detail?.reviews.filter((review) => review.state === 'COMMENTED').length ?? 0;

  return (
    <View className="mt-5 flex-row flex-wrap gap-2">
      <Badge variant="secondary"><Text className="text-xs">Approve {approved}</Text></Badge>
      <Badge variant="secondary"><Text className="text-xs">Concern {changesRequested}</Text></Badge>
      <Badge variant="secondary"><Text className="text-xs">Comment {commented}</Text></Badge>
    </View>
  );
}

function CISummary({ detail }: { detail?: PullRequestDetail }) {
  const status = detail?.statusCheckRollup?.state ?? 'PENDING';
  const label =
    status === 'SUCCESS'
      ? 'CI good'
      : status === 'FAILURE' || status === 'ERROR'
        ? 'CI failing'
        : 'CI pending';
  const toneClass =
    status === 'SUCCESS'
      ? 'bg-[#98971a]'
      : status === 'FAILURE' || status === 'ERROR'
        ? 'bg-destructive'
        : 'bg-[#d79921]';

  return (
    <Badge className={toneClass}>
      <Text className="text-xs text-primary-foreground">{label}</Text>
    </Badge>
  );
}

export function PRReviewCard({ item, mode, detail, detailPending }: PRReviewCardProps) {
  const pr = item.pullRequest;
  const bodyPreview = (detail?.body || pr.body || '').trim();

  if (mode === 'peek') {
    return (
      <View className="flex-1 rounded-[30px] border border-border bg-card px-5 py-6 shadow-sm shadow-black/10">
        <Text className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
          Peek
        </Text>
        <Text variant="h3" className="mt-3 border-b-0 pb-0 text-left text-[28px] leading-[32px]">
          {pr.title}
        </Text>

        {detailPending ? (
          <View className="flex-1 items-center justify-center py-10">
            <ActivityIndicator size="small" />
            <Text className="mt-3 text-sm text-muted-foreground">Loading PR summary...</Text>
          </View>
        ) : (
          <>
            <View className="mt-4 flex-row flex-wrap gap-2">
              <CISummary detail={detail} />
              {item.sources.map((source) => (
                <Badge key={source} variant="outline">
                  <Text className="text-xs">{getSourceLabel(source)}</Text>
                </Badge>
              ))}
            </View>

            <Text className="mt-5 text-xs uppercase tracking-[0.22em] text-muted-foreground">
              PR Summary
            </Text>
            <Text className="mt-2 text-sm leading-6 text-foreground/85" numberOfLines={6}>
              {bodyPreview || 'No PR description provided.'}
            </Text>

            {detail?.labels?.length ? (
              <View className="mt-5 flex-row flex-wrap gap-2">
                {detail.labels.slice(0, 6).map((label) => (
                  <Badge key={label.name} variant="secondary">
                    <Text className="text-xs">{label.name}</Text>
                  </Badge>
                ))}
              </View>
            ) : null}

            <Text className="mt-5 text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Review Pulse
            </Text>
            <ReviewSummary detail={detail} />
          </>
        )}
      </View>
    );
  }

  return (
    <View className="flex-1 rounded-[30px] border border-border bg-card px-5 py-6 shadow-sm shadow-black/10">
      <View className="flex-row items-start justify-between gap-3">
        <Text className="flex-1 text-xs uppercase tracking-[0.28em] text-muted-foreground">
          {pr.repository.nameWithOwner}
        </Text>
        <View className="flex-row flex-wrap justify-end gap-2">
          <Badge variant="outline">
            <Text className="text-xs">{getSourceLabel(item.primarySource)}</Text>
          </Badge>
          {item.sources.length > 1 ? (
            <Badge variant="secondary">
              <Text className="text-xs">+{item.sources.length - 1}</Text>
            </Badge>
          ) : null}
        </View>
      </View>

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
        {pr.isDraft ? (
          <Badge>
            <Text className="text-xs text-primary-foreground">Draft</Text>
          </Badge>
        ) : null}
      </View>

      {pr.labels?.length ? (
        <View className="mt-6 flex-row flex-wrap gap-2">
          {pr.labels.slice(0, 4).map((label) => (
            <Badge key={label.name} variant="outline">
              <Text className="text-xs">{label.name}</Text>
            </Badge>
          ))}
        </View>
      ) : null}
    </View>
  );
}
