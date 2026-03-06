import { BlurView } from 'expo-blur';
import { Text } from '@/components/ui/text';

interface RepoPillProps {
  repo: string;
}

export function RepoPill({ repo }: RepoPillProps) {
  return (
    <BlurView intensity={24} tint="default" className="overflow-hidden rounded-full border border-border/80 px-3 py-2">
      <Text className="max-w-[180px] text-xs text-foreground" numberOfLines={1}>{repo}</Text>
    </BlurView>
  );
}
