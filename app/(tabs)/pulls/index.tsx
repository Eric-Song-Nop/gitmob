import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { LoadingState } from '@/components/common/LoadingState';
import { PRListItem } from '@/components/pr/PRListItem';
import { usePullRequests, type PRFilter } from '@/api/queries/usePullRequests';
import type { PullRequest } from '@/api/types';
import { useState, useCallback, useMemo } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useRouter } from 'expo-router';

const FILTERS: { key: PRFilter; label: string }[] = [
  { key: 'review-requested', label: 'Review' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'created', label: 'Created' },
];

export default function PullsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<PRFilter>('review-requested');
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isRefetching,
  } = usePullRequests(filter);

  const pullRequests = useMemo(
    () => data?.pages.flatMap((page) => page.nodes) ?? [],
    [data]
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handlePRPress = useCallback(
    (pr: PullRequest) => {
      const { owner, name } = pr.repository;
      router.push(`/(tabs)/pulls/${owner.login}/${name}/${pr.number}` as any);
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: PullRequest }) => (
      <PRListItem pr={item} onPress={() => handlePRPress(item)} />
    ),
    [handlePRPress]
  );

  const keyExtractor = useCallback(
    (item: PullRequest) => `${item.repository.nameWithOwner}#${item.number}`,
    []
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <FilterBar activeFilter={filter} onFilterChange={setFilter} />
        <LoadingState mode="skeleton" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center bg-background gap-3 p-6">
        <Text className="text-center text-destructive">
          {error?.message ?? 'Failed to load pull requests'}
        </Text>
        <Button onPress={() => refetch()} variant="outline">
          <Text>Retry</Text>
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FilterBar activeFilter={filter} onFilterChange={setFilter} />
      <FlatList
        data={pullRequests}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={{ paddingVertical: 8 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextPage ? <LoadingState mode="spinner" /> : null
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Text variant="muted">No pull requests found</Text>
          </View>
        }
      />
    </View>
  );
}

function FilterBar({
  activeFilter,
  onFilterChange,
}: {
  activeFilter: PRFilter;
  onFilterChange: (filter: PRFilter) => void;
}) {
  return (
    <View className="flex-row gap-2 px-4 py-2">
      {FILTERS.map(({ key, label }) => (
        <Button
          key={key}
          variant={activeFilter === key ? 'default' : 'outline'}
          size="sm"
          onPress={() => onFilterChange(key)}
        >
          <Text>{label}</Text>
        </Button>
      ))}
    </View>
  );
}
