import { View } from 'react-native';

export function AmbientCanvas() {
  return (
    <>
      <View className="absolute inset-0 bg-background" />
      <View className="absolute -left-16 top-8 h-56 w-56 rounded-full bg-primary/10" />
      <View className="absolute right-[-72] top-40 h-72 w-72 rounded-full bg-accent/25" />
      <View className="absolute bottom-[-48] left-10 h-52 w-52 rounded-full bg-muted/35" />
    </>
  );
}
