import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/common/LoadingState';
import { FileStatusBadge } from '@/components/common/FileStatusBadge';
import { usePRFiles } from '@/api/queries/usePRFiles';
import { buildFileTree, type FileTreeSection } from '@/lib/fileTree';
import type { PRFile } from '@/api/types';
import { useGlobalSearchParams, useRouter } from 'expo-router';
import { SectionList, Pressable, RefreshControl, View } from 'react-native';
import { useMemo, useCallback } from 'react';

export default function PRFilesScreen() {
  const router = useRouter();
  const { owner, repo, number } = useGlobalSearchParams<{
    owner: string;
    repo: string;
    number: string;
  }>();

  const prNumber = parseInt(number, 10);
  const { data: files, isLoading, isError, error, refetch, isRefetching } = usePRFiles(
    owner,
    repo,
    prNumber
  );

  const sections = useMemo(() => {
    if (!files) return [];
    return buildFileTree(files).map((section) => ({
      title: section.directory,
      data: section.files,
    }));
  }, [files]);

  const handleFilePress = useCallback(
    (file: PRFile) => {
      router.push({
        pathname: '/(tabs)/pulls/diff' as any,
        params: { owner, repo, number, path: file.filename },
      });
    },
    [router, owner, repo, number]
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <LoadingState mode="skeleton" count={6} />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center bg-background gap-3 p-6">
        <Text className="text-center text-destructive">
          {error?.message ?? 'Failed to load files'}
        </Text>
        <Button onPress={() => refetch()} variant="outline">
          <Text>Retry</Text>
        </Button>
      </View>
    );
  }

  return (
    <SectionList<PRFile, { title: string; data: PRFile[] }>
      sections={sections}
      className="flex-1 bg-background"
      keyExtractor={(item) => item.filename}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
      }
      renderSectionHeader={({ section }) => (
        <View className="bg-muted px-4 py-1.5">
          <Text variant="small" className="font-mono text-muted-foreground">
            {section.title}
          </Text>
        </View>
      )}
      renderItem={({ item }) => (
        <Pressable onPress={() => handleFilePress(item)}>
          <View className="flex-row items-center gap-3 border-b border-border px-4 py-3">
            <FileStatusBadge status={item.status} />
            <Text variant="small" className="flex-1 font-mono" numberOfLines={1}>
              {item.filename.split('/').pop()}
            </Text>
            <View className="flex-row gap-1.5">
              <Text className="text-xs font-medium text-green-600">+{item.additions}</Text>
              <Text className="text-xs font-medium text-red-600">-{item.deletions}</Text>
            </View>
          </View>
        </Pressable>
      )}
      ListEmptyComponent={
        <View className="flex-1 items-center justify-center py-20">
          <Text variant="muted">No files changed</Text>
        </View>
      }
      stickySectionHeadersEnabled
    />
  );
}
