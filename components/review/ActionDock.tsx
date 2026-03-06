import { BlurView } from 'expo-blur';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { View } from 'react-native';

interface ActionDockProps {
  onAccept: () => void;
  onConcern: () => void;
  onComment: () => void;
  onSkip: () => void;
  onSubmit: () => void;
}

export function ActionDock({ onAccept, onConcern, onComment, onSkip, onSubmit }: ActionDockProps) {
  return (
    <View className="absolute bottom-6 left-4 right-4 gap-3">
      <BlurView intensity={40} tint="default" className="overflow-hidden rounded-[28px] border border-border/80 px-4 py-4">
        <View className="flex-row gap-2">
          <Button variant="secondary" className="flex-1 rounded-2xl" onPress={onSkip}>
            <Text>Skip</Text>
          </Button>
          <Button variant="outline" className="flex-1 rounded-2xl" onPress={onComment}>
            <Text>Comment</Text>
          </Button>
        </View>
        <View className="mt-2 flex-row gap-2">
          <Button variant="outline" className="flex-1 rounded-2xl border-destructive/50" onPress={onConcern}>
            <Text>Concern</Text>
          </Button>
          <Button className="flex-1 rounded-2xl" onPress={onAccept}>
            <Text>Accept</Text>
          </Button>
        </View>
      </BlurView>
      <Button variant="ghost" className="self-center rounded-full bg-card/80 px-4" onPress={onSubmit}>
        <Text>Open Submit</Text>
      </Button>
    </View>
  );
}
