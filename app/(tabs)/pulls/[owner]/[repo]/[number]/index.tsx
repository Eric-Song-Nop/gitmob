import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/common/LoadingState';
import { PRHeader } from '@/components/pr/PRHeader';
import { CIChecks } from '@/components/pr/CIChecks';
import { ReviewerList } from '@/components/pr/ReviewerList';
import { Separator } from '@/components/ui/separator';
import { usePullRequest } from '@/api/queries/usePullRequest';
import { useGlobalSearchParams } from 'expo-router';
import { ScrollView, RefreshControl, View } from 'react-native';

export default function PROverviewScreen() {
  const { owner, repo, number } = useGlobalSearchParams<{
    owner: string;
    repo: string;
    number: string;
  }>();

  const prNumber = parseInt(number, 10);
  const { data: pr, isLoading, isError, error, refetch, isRefetching } = usePullRequest(
    owner,
    repo,
    prNumber
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <LoadingState mode="skeleton" count={3} />
      </View>
    );
  }

  if (isError || !pr) {
    return (
      <View className="flex-1 items-center justify-center bg-background gap-3 p-6">
        <Text className="text-center text-destructive">
          {error?.message ?? 'Failed to load pull request'}
        </Text>
        <Button onPress={() => refetch()} variant="outline">
          <Text>Retry</Text>
        </Button>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
      }
    >
      <PRHeader pr={pr} />

      {/* Description */}
      {pr.body ? (
        <View className="px-4 py-3">
          <Text variant="small" className="font-semibold">Description</Text>
          <Text variant="small" className="mt-1 leading-5 text-muted-foreground">
            {pr.body}
          </Text>
        </View>
      ) : (
        <View className="px-4 py-3">
          <Text variant="small" className="font-semibold">Description</Text>
          <Text variant="small" className="mt-1 text-muted-foreground italic">
            No description provided
          </Text>
        </View>
      )}

      <Separator />

      {/* CI Checks */}
      <CIChecks rollup={pr.statusCheckRollup} />

      <Separator />

      {/* Reviewers */}
      <ReviewerList pr={pr} />
    </ScrollView>
  );
}
