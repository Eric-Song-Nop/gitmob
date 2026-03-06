import { BlurView } from 'expo-blur';
import { Text } from '@/components/ui/text';

interface ProgressPillProps {
  label: string;
}

export function ProgressPill({ label }: ProgressPillProps) {
  return (
    <BlurView intensity={28} tint="default" className="overflow-hidden rounded-full border border-border/80 px-3 py-2">
      <Text className="text-xs tracking-[0.18em] text-muted-foreground uppercase">{label}</Text>
    </BlurView>
  );
}
