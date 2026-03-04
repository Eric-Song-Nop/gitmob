import { Icon } from '@/components/ui/icon';
import { Tabs } from 'expo-router';
import { GitPullRequestIcon, BellIcon, UserIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { NAV_THEME } from '@/lib/theme';

export default function TabsLayout() {
  const { colorScheme } = useColorScheme();
  const theme = NAV_THEME[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="pulls"
        options={{
          title: 'Pull Requests',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon as={GitPullRequestIcon} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, size }) => (
            <Icon as={BellIcon} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Icon as={UserIcon} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
