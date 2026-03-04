import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'expo-router';
import { LogOutIcon } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { View } from 'react-native';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <View className="flex-1 bg-background p-6">
      {/* User info */}
      <View className="items-center gap-3 py-8">
        <Avatar alt={user?.login ?? 'User'} className="h-20 w-20">
          {user?.avatarUrl ? (
            <AvatarImage source={{ uri: user.avatarUrl }} />
          ) : (
            <AvatarFallback>
              <Text variant="h2">{user?.login?.charAt(0).toUpperCase() ?? '?'}</Text>
            </AvatarFallback>
          )}
        </Avatar>
        <Text variant="h3">{user?.login ?? 'Unknown'}</Text>
      </View>

      <Separator />

      {/* Actions */}
      <View className="mt-6">
        <Button onPress={handleLogout} variant="destructive" className="w-full">
          <Icon as={LogOutIcon} className="text-white" />
          <Text>Logout</Text>
        </Button>
      </View>
    </View>
  );
}
