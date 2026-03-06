import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useGitHubAuth } from '@/hooks/useGitHubAuth';
import { router, type Href } from 'expo-router';
import { BlurView } from 'expo-blur';
import { CopyIcon, GithubIcon } from 'lucide-react-native';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function LoginScreen() {
  const { status, userCode, error, login, copyCodeAndOpenBrowser } = useGitHubAuth();
  const reviewRoute = '/review' as Href;

  useEffect(() => {
    if (status === 'success') {
      router.replace(reviewRoute);
    }
  }, [reviewRoute, status]);

  return (
    <View className="flex-1 bg-background px-6 py-12">
      <View className="absolute inset-0 bg-background" />
      <View className="absolute left-[-80] top-16 h-64 w-64 rounded-full bg-primary/10" />
      <View className="absolute bottom-20 right-[-60] h-56 w-56 rounded-full bg-accent/25" />

      <View className="flex-1 justify-between">
        <View className="pt-10">
          <Text className="text-xs uppercase tracking-[0.32em] text-muted-foreground">
            GitMob
          </Text>
          <Text variant="h1" className="mt-4 text-left text-[44px] leading-[48px] text-foreground">
            Review code with less chrome and more focus.
          </Text>
          <Text className="mt-4 max-w-[320px] text-base leading-6 text-muted-foreground">
            Gruvbox surfaces, full-screen cards, and a cleaner mobile review flow.
          </Text>
        </View>

        <BlurView intensity={30} tint="default" className="overflow-hidden rounded-[28px] border border-border/70 bg-card/80 p-5">
          {status === 'idle' && (
            <View className="gap-4">
              <Text className="text-base text-card-foreground">Authenticate with GitHub Device Flow to enter the review deck.</Text>
              <Button onPress={login} className="h-14 rounded-2xl">
                <Icon as={GithubIcon} className="text-primary-foreground" />
                <Text>Continue with GitHub</Text>
              </Button>
            </View>
          )}

          {status === 'awaiting_code' && (
            <View className="items-center gap-3 py-6">
              <ActivityIndicator size="small" />
              <Text className="text-muted-foreground">Requesting device code...</Text>
            </View>
          )}

          {status === 'polling' && (
            <View className="gap-4">
              <Text className="text-sm uppercase tracking-[0.2em] text-muted-foreground">GitHub Device Code</Text>
              <View className="rounded-[22px] border border-border bg-backgroundAlt px-4 py-5">
                <Text className="text-center font-mono text-3xl tracking-[0.45em] text-foreground">{userCode}</Text>
              </View>
              <Button onPress={copyCodeAndOpenBrowser} variant="secondary" className="h-14 rounded-2xl">
                <Icon as={CopyIcon} className="text-secondary-foreground" />
                <Text>Copy code and open GitHub</Text>
              </Button>
              <View className="flex-row items-center gap-2">
                <ActivityIndicator size="small" />
                <Text className="text-muted-foreground">Waiting for authorization...</Text>
              </View>
            </View>
          )}

          {status === 'error' && (
            <View className="gap-4">
              <Text className="text-sm leading-6 text-destructive">{error}</Text>
              <Button onPress={login} variant="outline" className="h-14 rounded-2xl">
                <Text>Try again</Text>
              </Button>
            </View>
          )}
        </BlurView>
      </View>
    </View>
  );
}
