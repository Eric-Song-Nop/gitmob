import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import type { InboxPRCardModel, PullRequestDetail } from '@/api/types';
import { Text } from '@/components/ui/text';
import { PRReviewCard } from './PRReviewCard';

interface PRDeckProps {
  current: InboxPRCardModel;
  next?: InboxPRCardModel;
  inboxMode: 'front' | 'peek';
  detail?: PullRequestDetail;
  detailPending?: boolean;
  onOpenReview: () => void;
  onSnooze: () => void;
  onTogglePeek: () => void;
}

const SWIPE_THRESHOLD = 120;

export function PRDeck({
  current,
  next,
  inboxMode,
  detail,
  detailPending,
  onOpenReview,
  onSnooze,
  onTogglePeek,
}: PRDeckProps) {
  const translateX = useSharedValue(0);
  const rotateZ = useSharedValue(0);

  useEffect(() => {
    translateX.value = withSpring(0);
    rotateZ.value = withSpring(0);
  }, [current.prKey, rotateZ, translateX]);

  const pan = Gesture.Pan()
    .enabled(inboxMode === 'front')
    .activeOffsetX([-12, 12])
    .onUpdate((event) => {
      translateX.value = event.translationX;
      rotateZ.value = event.translationX / 24;
    })
    .onEnd(() => {
      if (translateX.value > SWIPE_THRESHOLD) {
        translateX.value = withSpring(420);
        rotateZ.value = withSpring(18);
        runOnJS(onOpenReview)();
        return;
      }

      if (translateX.value < -SWIPE_THRESHOLD) {
        translateX.value = withSpring(-420);
        rotateZ.value = withSpring(-18);
        runOnJS(onSnooze)();
        return;
      }

      translateX.value = withSpring(0);
      rotateZ.value = withSpring(0);
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotateZ: `${rotateZ.value}deg` },
    ],
  }));

  const approveStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1]),
    transform: [{ scale: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0.9, 1]) }],
  }));

  const snoozeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0]),
    transform: [{ scale: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0.9]) }],
  }));

  return (
    <View className="flex-1 justify-center px-5 pb-28 pt-24">
      {next ? (
        <View className="absolute left-8 right-8 top-[150] rounded-[30px] border border-border/60 bg-card/45 px-5 py-6 opacity-80">
          <Text className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Up next</Text>
          <Text className="mt-2 text-lg font-semibold text-foreground/80" numberOfLines={2}>
            {next.pullRequest.title}
          </Text>
        </View>
      ) : null}

      <View className="absolute left-8 top-[176] z-10">
        <Animated.View style={approveStyle} className="rounded-full bg-[#98971a] px-4 py-2">
          <Text className="text-xs uppercase tracking-[0.2em] text-primary-foreground">Open Review</Text>
        </Animated.View>
      </View>
      <View className="absolute right-8 top-[176] z-10">
        <Animated.View style={snoozeStyle} className="rounded-full bg-destructive px-4 py-2">
          <Text className="text-xs uppercase tracking-[0.2em] text-primary-foreground">Save Later</Text>
        </Animated.View>
      </View>

      <GestureDetector gesture={pan}>
        <Animated.View style={cardStyle}>
          <Pressable onPress={onTogglePeek} className="min-h-[520px]">
            <PRReviewCard
              item={current}
              mode={inboxMode}
              detail={detail}
              detailPending={detailPending}
            />
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
