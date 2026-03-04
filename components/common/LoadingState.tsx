import { Skeleton } from '@/components/ui/skeleton';
import { ActivityIndicator, View } from 'react-native';

interface LoadingStateProps {
  mode?: 'skeleton' | 'spinner';
  count?: number;
}

function LoadingState({ mode = 'skeleton', count = 5 }: LoadingStateProps) {
  if (mode === 'spinner') {
    return (
      <View className="flex-1 items-center justify-center py-12">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="gap-3 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} className="gap-2 rounded-lg border border-border p-4">
          <View className="flex-row items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </View>
          <Skeleton className="h-5 w-full" />
          <View className="flex-row gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </View>
        </View>
      ))}
    </View>
  );
}

export { LoadingState };
