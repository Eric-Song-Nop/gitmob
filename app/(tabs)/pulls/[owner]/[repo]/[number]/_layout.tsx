import { withLayoutContext } from 'expo-router';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { THEME } from '@/lib/theme';

const { Navigator } = createMaterialTopTabNavigator();
const MaterialTopTabs = withLayoutContext(Navigator);

export default function PRDetailLayout() {
  const { owner, repo, number } = useLocalSearchParams<{
    owner: string;
    repo: string;
    number: string;
  }>();
  const { colorScheme } = useColorScheme();
  const theme = THEME[colorScheme ?? 'light'];

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: `${owner}/${repo}#${number}`,
          headerBackTitle: 'Back',
        }}
      />
      <MaterialTopTabs
        screenOptions={{
          tabBarActiveTintColor: theme.foreground,
          tabBarInactiveTintColor: theme.mutedForeground,
          tabBarIndicatorStyle: {
            backgroundColor: theme.foreground,
          },
          tabBarStyle: {
            backgroundColor: theme.background,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
          },
          tabBarLabelStyle: {
            fontSize: 13,
            fontWeight: '600',
            textTransform: 'none',
          },
        }}
      >
        <MaterialTopTabs.Screen
          name="index"
          options={{ title: 'Overview' }}
        />
        <MaterialTopTabs.Screen
          name="files"
          options={{ title: 'Files' }}
        />
      </MaterialTopTabs>
    </>
  );
}
