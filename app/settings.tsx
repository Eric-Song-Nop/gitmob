import { ScrollView, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeftIcon, MoonStarIcon, SunMediumIcon } from 'lucide-react-native';
import { useMutation } from '@tanstack/react-query';

import { checkLLMHealth } from '@/api/llm/checkHealth';
import { getProviderMeta } from '@/api/llm/providers';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useAuthStore } from '@/stores/authStore';
import { useLLMConfigStore } from '@/stores/llmConfigStore';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { AmbientCanvas } from '@/components/review/AmbientCanvas';

const DEFAULT_MODELS = {
  openai: 'gpt-4.1-mini',
  anthropic: 'claude-3-7-sonnet-latest',
  moonshot: 'kimi-k2.5',
} as const;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const theme = usePreferencesStore((state) => state.theme);
  const setTheme = usePreferencesStore((state) => state.setTheme);
  const config = useLLMConfigStore((state) => state.config);
  const healthCheck = useLLMConfigStore((state) => state.healthCheck);
  const setConfig = useLLMConfigStore((state) => state.setConfig);
  const setHealthCheck = useLLMConfigStore((state) => state.setHealthCheck);
  const clearHealthCheck = useLLMConfigStore((state) => state.clearHealthCheck);
  const loginRoute = '/login' as Href;
  const providerMeta = getProviderMeta(config);
  const healthCheckMutation = useMutation({
    mutationFn: () => checkLLMHealth(config),
    onSuccess: (result) => {
      setHealthCheck(result);
    },
  });

  return (
    <View className="flex-1 bg-background">
      <AmbientCanvas />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }}
      >
        <View className="px-4">
          <Button variant="ghost" className="h-12 w-12 rounded-full bg-card/80" onPress={() => router.back()}>
            <Icon as={ArrowLeftIcon} size={18} />
          </Button>
        </View>

        <View className="mt-6 px-5">
          <Text className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Settings</Text>
          <Text variant="h1" className="mt-4 text-left text-[42px] leading-[46px] text-foreground">
            Keep review setup lean.
          </Text>
          <Text className="mt-4 max-w-[320px] text-base leading-7 text-muted-foreground">
            Theme, model access, and account controls. Nothing else stays on screen.
          </Text>
        </View>

        <View className="mt-8 gap-4 px-5">
          <View className="rounded-[30px] border border-border bg-card/90 p-5 shadow-sm shadow-black/10">
            <Text className="text-xs uppercase tracking-[0.22em] text-muted-foreground">GitHub</Text>
            <Text className="mt-3 text-2xl text-foreground">@{user?.login ?? 'Unknown user'}</Text>
            <Text className="mt-2 text-sm leading-6 text-muted-foreground">
              Your authenticated account is used for pull request queries and review submission.
            </Text>
            <Button
              variant="outline"
              className="mt-5 rounded-2xl"
              onPress={() => {
                logout();
                router.replace(loginRoute);
              }}
            >
              <Text>Logout</Text>
            </Button>
          </View>

          <View className="rounded-[30px] border border-border bg-card/90 p-5 shadow-sm shadow-black/10">
            <Text className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Theme</Text>
            <View className="mt-4 flex-row gap-3">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                className="flex-1 rounded-2xl"
                onPress={() => setTheme('light')}
              >
                <Icon as={SunMediumIcon} size={16} className={theme === 'light' ? 'text-primary-foreground' : ''} />
                <Text>Light</Text>
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                className="flex-1 rounded-2xl"
                onPress={() => setTheme('dark')}
              >
                <Icon as={MoonStarIcon} size={16} className={theme === 'dark' ? 'text-primary-foreground' : ''} />
                <Text>Dark</Text>
              </Button>
            </View>
            <Text className="mt-4 text-sm leading-6 text-muted-foreground">
              Both themes use Gruvbox tokens. Light is paper-like; dark keeps terminal contrast for diff reading.
            </Text>
          </View>

          <View className="rounded-[30px] border border-border bg-card/90 p-5 shadow-sm shadow-black/10">
            <Text className="text-xs uppercase tracking-[0.22em] text-muted-foreground">LLM</Text>
            <Text className="mt-3 text-sm leading-6 text-muted-foreground">
              Segmentation runs directly from the device with your own API key.
            </Text>

            <Text className="mt-5 text-sm text-foreground">Provider</Text>
            <View className="mt-3 flex-row gap-3">
              <Button
                variant={config.provider === 'openai' ? 'default' : 'outline'}
                className="flex-1 rounded-2xl"
                onPress={() => setConfig({ provider: 'openai', model: DEFAULT_MODELS.openai })}
              >
                <Text>OpenAI</Text>
              </Button>
              <Button
                variant={config.provider === 'anthropic' ? 'default' : 'outline'}
                className="flex-1 rounded-2xl"
                onPress={() => setConfig({ provider: 'anthropic', model: DEFAULT_MODELS.anthropic })}
              >
                <Text>Anthropic</Text>
              </Button>
            </View>
            <View className="mt-3 flex-row gap-3">
              <Button
                variant={config.provider === 'moonshot' ? 'default' : 'outline'}
                className="flex-1 rounded-2xl"
                onPress={() =>
                  setConfig({
                    provider: 'moonshot',
                    model: DEFAULT_MODELS.moonshot,
                    moonshotRegion: config.moonshotRegion ?? 'china',
                  })
                }
              >
                <Text>Moonshot</Text>
              </Button>
            </View>

            {config.provider === 'moonshot' ? (
              <>
                <Text className="mt-5 text-sm text-foreground">Region</Text>
                <View className="mt-3 flex-row gap-3">
                  <Button
                    variant={config.moonshotRegion !== 'global' ? 'default' : 'outline'}
                    className="flex-1 rounded-2xl"
                    onPress={() => setConfig({ moonshotRegion: 'china' })}
                  >
                    <Text>China</Text>
                  </Button>
                  <Button
                    variant={config.moonshotRegion === 'global' ? 'default' : 'outline'}
                    className="flex-1 rounded-2xl"
                    onPress={() => setConfig({ moonshotRegion: 'global' })}
                  >
                    <Text>Global</Text>
                  </Button>
                </View>
              </>
            ) : null}

            <Text className="mt-5 text-sm text-foreground">Model</Text>
            <Input
              value={config.model}
              onChangeText={(value) => setConfig({ model: value })}
              placeholder={DEFAULT_MODELS[config.provider]}
              className="mt-3"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text className="mt-5 text-sm text-foreground">API Key</Text>
            <Input
              value={config.apiKey}
              onChangeText={(value) => setConfig({ apiKey: value })}
              placeholder="Paste your provider key"
              className="mt-3"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
            />

            <View className="mt-5 flex-row gap-3">
              <Button
                className="flex-1 rounded-2xl"
                disabled={!config.apiKey.trim() || healthCheckMutation.isPending}
                onPress={() => {
                  clearHealthCheck();
                  healthCheckMutation.mutate();
                }}
              >
                <Text>
                  {healthCheckMutation.isPending ? 'Checking...' : 'Health Check'}
                </Text>
              </Button>
            </View>

            {healthCheck ? (
              <View className="mt-4 rounded-[22px] border border-border bg-backgroundAlt px-4 py-4">
                <Text className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {healthCheck.ok ? 'Healthy' : 'Unhealthy'}
                  {healthCheck.stale ? ' · Stale' : ''}
                </Text>
                <Text className="mt-2 text-sm text-foreground">
                  {healthCheck.provider} / {healthCheck.model}
                </Text>
                {healthCheck.regionLabel ? (
                  <Text className="mt-1 text-sm text-muted-foreground">{healthCheck.regionLabel}</Text>
                ) : null}
                {healthCheck.baseURL ? (
                  <Text className="mt-1 text-sm text-muted-foreground">{healthCheck.baseURL}</Text>
                ) : null}
                <Text className="mt-1 text-sm text-muted-foreground">
                  {healthCheck.latencyMs} ms · {new Date(healthCheck.checkedAt).toLocaleString()}
                </Text>
                {healthCheck.error ? (
                  <Text className="mt-3 text-sm leading-6 text-destructive">
                    {healthCheck.error}
                  </Text>
                ) : (
                  <Text className="mt-3 text-sm leading-6 text-muted-foreground">
                    Structured output check passed.
                  </Text>
                )}
              </View>
            ) : (
              <View className="mt-4 rounded-[22px] border border-border bg-backgroundAlt px-4 py-4">
                <Text className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Current route</Text>
                <Text className="mt-2 text-sm text-foreground">
                  {providerMeta.provider} / {providerMeta.model}
                </Text>
                {providerMeta.regionLabel ? (
                  <Text className="mt-1 text-sm text-muted-foreground">{providerMeta.regionLabel}</Text>
                ) : null}
                {providerMeta.baseURL ? (
                  <Text className="mt-1 text-sm text-muted-foreground">{providerMeta.baseURL}</Text>
                ) : null}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
