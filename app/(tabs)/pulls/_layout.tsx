import { Stack } from 'expo-router';

export default function PullsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: 'Pull Requests' }}
      />
    </Stack>
  );
}
