import { Stack } from 'expo-router';

export default function PullsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: 'Pull Requests' }}
      />
      <Stack.Screen
        name="[owner]/[repo]/[number]"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="diff"
        options={{
          title: 'Diff',
          headerBackTitle: 'Back',
        }}
      />
    </Stack>
  );
}
