import { BlurView } from 'expo-blur';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { Settings2Icon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import type { GitHubUser } from '@/api/types';

interface FloatingProfileOrbProps {
  user: GitHubUser | null;
  onPress: () => void;
}

export function FloatingProfileOrb({ user, onPress }: FloatingProfileOrbProps) {
  return (
    <Pressable onPress={onPress} className="h-14 w-14">
      <BlurView intensity={28} tint="default" className="h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-border/80 bg-card/80">
        {user?.avatarUrl ? (
          <Avatar alt={user.login} className="h-12 w-12">
            <AvatarImage source={{ uri: user.avatarUrl }} />
            <AvatarFallback />
          </Avatar>
        ) : (
          <View className="items-center justify-center">
            <Icon as={Settings2Icon} className="text-foreground" />
          </View>
        )}
      </BlurView>
    </Pressable>
  );
}
