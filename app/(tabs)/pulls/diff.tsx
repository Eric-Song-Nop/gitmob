import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/common/LoadingState';
import { DiffView } from '@/components/pr/DiffView';
import { usePRDiff } from '@/api/queries/usePRDiff';
import { usePRComments } from '@/api/queries/usePRComments';
import { parseDiff } from '@/services/diffParser';
import { useLocalSearchParams, Stack } from 'expo-router';
import { View } from 'react-native';
import { useMemo } from 'react';

export default function DiffScreen() {
  const { owner, repo, number, path } = useLocalSearchParams<{
    owner: string;
    repo: string;
    number: string;
    path: string;
  }>();

  const prNumber = parseInt(number, 10);
  const { data: diffText, isLoading: isDiffLoading, isError: isDiffError, error: diffError, refetch: refetchDiff } = usePRDiff(
    owner,
    repo,
    prNumber
  );
  const { data: threads = [] } = usePRComments(owner, repo, prNumber);

  // Parse full diff, then find the target file
  const diffFile = useMemo(() => {
    if (!diffText) return null;
    const files = parseDiff(diffText);
    return files.find((f) => f.newPath === path || f.oldPath === path) ?? null;
  }, [diffText, path]);

  // Filter threads for this file
  const fileThreads = useMemo(
    () => threads.filter((t) => t.path === path),
    [threads, path]
  );

  const fileName = path?.split('/').pop() ?? 'Diff';

  if (isDiffLoading) {
    return (
      <View className="flex-1 bg-background">
        <Stack.Screen options={{ title: fileName }} />
        <LoadingState mode="spinner" />
      </View>
    );
  }

  if (isDiffError) {
    return (
      <View className="flex-1 items-center justify-center bg-background gap-3 p-6">
        <Stack.Screen options={{ title: fileName }} />
        <Text className="text-center text-destructive">
          {diffError?.message ?? 'Failed to load diff'}
        </Text>
        <Button onPress={() => refetchDiff()} variant="outline">
          <Text>Retry</Text>
        </Button>
      </View>
    );
  }

  if (!diffFile) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Stack.Screen options={{ title: fileName }} />
        <Text variant="muted">No diff available for this file</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: fileName }} />
      <DiffView file={diffFile} threads={fileThreads} />
    </View>
  );
}
