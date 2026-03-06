import { useAuthStore } from '@/stores/authStore';
import { Redirect, type Href } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

const LOGIN_ROUTE = '/login' as Href;
const REVIEW_ROUTE = '/review' as Href;

export default function Index() {
  const { isLoading, isAuthenticated } = useAuthStore();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Redirect href={isAuthenticated ? REVIEW_ROUTE : LOGIN_ROUTE} />;
}
