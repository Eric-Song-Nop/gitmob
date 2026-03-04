import { useEffect } from 'react';
import { router } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useGitHubAuth } from '@/hooks/useGitHubAuth';
import { Icon } from '@/components/ui/icon';
import { GithubIcon, CopyIcon, Loader2Icon } from 'lucide-react-native';
import { ActivityIndicator, View } from 'react-native';

export default function LoginScreen() {
  const { status, userCode, error, login, copyCodeAndOpenBrowser } = useGitHubAuth();

  useEffect(() => {
    if (status === 'success') {
      router.replace('/(tabs)/pulls');
    }
  }, [status]);

  return (
    <View className="flex-1 items-center justify-center gap-8 bg-background p-6">
      {/* App branding */}
      <View className="items-center gap-2">
        <Text variant="h1">GitMob</Text>
        <Text variant="muted">A better GitHub mobile experience</Text>
      </View>

      {/* Login flow */}
      <View className="w-full max-w-sm gap-4">
        {status === 'idle' && (
          <Button onPress={login} className="w-full">
            <Icon as={GithubIcon} className="text-primary-foreground" />
            <Text>Login with GitHub</Text>
          </Button>
        )}

        {status === 'awaiting_code' && (
          <View className="items-center gap-3">
            <ActivityIndicator size="small" />
            <Text variant="muted">Requesting device code...</Text>
          </View>
        )}

        {status === 'polling' && (
          <View className="items-center gap-4">
            <Text variant="muted">Enter this code on GitHub:</Text>
            <View className="rounded-lg bg-muted px-6 py-4">
              <Text className="text-center font-mono text-3xl font-bold tracking-widest">
                {userCode}
              </Text>
            </View>
            <Button onPress={copyCodeAndOpenBrowser} variant="outline" className="w-full">
              <Icon as={CopyIcon} className="text-foreground" />
              <Text>Copy Code & Open GitHub</Text>
            </Button>
            <View className="flex-row items-center gap-2">
              <ActivityIndicator size="small" />
              <Text variant="muted">Waiting for authorization...</Text>
            </View>
          </View>
        )}

        {status === 'error' && (
          <View className="items-center gap-4">
            <Text className="text-center text-destructive">{error}</Text>
            <Button onPress={login} variant="outline" className="w-full">
              <Text>Try Again</Text>
            </Button>
          </View>
        )}
      </View>
    </View>
  );
}
