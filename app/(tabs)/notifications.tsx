import { Text } from '@/components/ui/text';
import { View } from 'react-native';

export default function NotificationsScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text variant="h3">Notifications</Text>
      <Text variant="muted" className="mt-2">
        Coming soon
      </Text>
    </View>
  );
}
