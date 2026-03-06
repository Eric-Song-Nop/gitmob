import { useMemo } from 'react';

import type { InboxPRCardModel, PRSource, PullRequest } from '@/api/types';
import { usePullRequests } from '@/api/queries/usePullRequests';
import { usePRInboxStore } from '@/stores/prInboxStore';

const SOURCE_PRIORITY: Record<PRSource, number> = {
  'review-requested': 0,
  assigned: 1,
  authored: 2,
};

function flattenPulls(data: ReturnType<typeof usePullRequests>['data']): PullRequest[] {
  return data?.pages.flatMap((page) => page.nodes) ?? [];
}

function getPRKey(pr: PullRequest) {
  return `${pr.repository.owner.login}/${pr.repository.name}/${pr.number}`;
}

function sortSources(sources: PRSource[]) {
  return [...sources].sort((a, b) => SOURCE_PRIORITY[a] - SOURCE_PRIORITY[b]);
}

export function usePRInbox() {
  const snoozedPRKeys = usePRInboxStore((state) => state.snoozedPRKeys);
  const reviewRequestedQuery = usePullRequests('review-requested');
  const assignedQuery = usePullRequests('assigned');
  const authoredQuery = usePullRequests('created');

  const items = useMemo(() => {
    const merged = new Map<string, InboxPRCardModel>();
    const sourceBuckets: Array<[PRSource, PullRequest[]]> = [
      ['review-requested', flattenPulls(reviewRequestedQuery.data)],
      ['assigned', flattenPulls(assignedQuery.data)],
      ['authored', flattenPulls(authoredQuery.data)],
    ];

    for (const [source, prs] of sourceBuckets) {
      for (const pr of prs) {
        const prKey = getPRKey(pr);
        const existing = merged.get(prKey);
        if (existing) {
          existing.sources = sortSources([...new Set([...existing.sources, source])]);
          existing.primarySource = existing.sources[0];
          if (new Date(pr.updatedAt).getTime() > new Date(existing.pullRequest.updatedAt).getTime()) {
            existing.pullRequest = pr;
          }
          continue;
        }

        merged.set(prKey, {
          prKey,
          pullRequest: pr,
          sources: [source],
          primarySource: source,
          snoozed: snoozedPRKeys.includes(prKey),
        });
      }
    }

    return [...merged.values()]
      .map((item) => ({
        ...item,
        sources: sortSources(item.sources),
        primarySource: sortSources(item.sources)[0],
        snoozed: snoozedPRKeys.includes(item.prKey),
      }))
      .sort((a, b) => {
        const sourceDelta = SOURCE_PRIORITY[a.primarySource] - SOURCE_PRIORITY[b.primarySource];
        if (sourceDelta !== 0) return sourceDelta;
        return new Date(b.pullRequest.updatedAt).getTime() - new Date(a.pullRequest.updatedAt).getTime();
      });
  }, [assignedQuery.data, authoredQuery.data, reviewRequestedQuery.data, snoozedPRKeys]);

  const visibleItems = useMemo(() => items.filter((item) => !item.snoozed), [items]);
  const hiddenCount = items.length - visibleItems.length;

  return {
    items: visibleItems,
    totalCount: items.length,
    hiddenCount,
    isPending:
      reviewRequestedQuery.isPending || assignedQuery.isPending || authoredQuery.isPending,
    isFetching:
      reviewRequestedQuery.isFetching || assignedQuery.isFetching || authoredQuery.isFetching,
    error: reviewRequestedQuery.error ?? assignedQuery.error ?? authoredQuery.error ?? null,
    refetch: () => {
      void reviewRequestedQuery.refetch();
      void assignedQuery.refetch();
      void authoredQuery.refetch();
    },
  };
}

export function getSourceLabel(source: PRSource) {
  switch (source) {
    case 'review-requested':
      return 'Requested';
    case 'assigned':
      return 'Assigned';
    case 'authored':
      return 'Authored';
  }
}
