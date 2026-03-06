import { useEffect } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import type { SegmentCardModel } from '@/api/llm/types';
import type { DiffFile } from '@/services/diffParser';
import type { ReviewThread } from '@/api/types';
import { SegmentReviewCard } from './SegmentReviewCard';
import { Text } from '@/components/ui/text';
import { View } from 'react-native';

interface SegmentDeckProps {
  segment: SegmentCardModel;
  nextSegment?: SegmentCardModel;
  isFlipped: boolean;
  onFlip: () => void;
  onAccept: () => void;
  onConcern: () => void;
  onComment: () => void;
  file?: DiffFile;
  threads: ReviewThread[];
  onLinePress?: (path: string, line: number) => void;
}

const SWIPE_X_THRESHOLD = 120;
const SWIPE_Y_THRESHOLD = 100;

export function SegmentDeck({
  segment,
  nextSegment,
  isFlipped,
  onFlip,
  onAccept,
  onConcern,
  onComment,
  file,
  threads,
  onLinePress,
}: SegmentDeckProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotateZ = useSharedValue(0);

  useEffect(() => {
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    rotateZ.value = withSpring(0);
  }, [rotateZ, segment.id, translateX, translateY]);

  const pan = Gesture.Pan()
    .enabled(!isFlipped)
    .activeOffsetX([-12, 12])
    .activeOffsetY([-12, 12])
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      rotateZ.value = event.translationX / 28;
    })
    .onEnd(() => {
      const isVerticalIntent =
        translateY.value < -SWIPE_Y_THRESHOLD &&
        Math.abs(translateY.value) > Math.abs(translateX.value);

      if (isVerticalIntent) {
        translateY.value = withSequence(withSpring(-120), withSpring(0));
        rotateZ.value = withSpring(0);
        runOnJS(onComment)();
        return;
      }

      if (translateX.value > SWIPE_X_THRESHOLD) {
        translateX.value = withSpring(420);
        rotateZ.value = withSpring(16);
        runOnJS(onAccept)();
        return;
      }

      if (translateX.value < -SWIPE_X_THRESHOLD) {
        translateX.value = withSpring(-420);
        rotateZ.value = withSpring(-16);
        runOnJS(onConcern)();
        return;
      }

      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      rotateZ.value = withSpring(0);
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotateZ: `${rotateZ.value}deg` },
    ],
  }));

  const acceptStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_X_THRESHOLD], [0, 1]),
    transform: [{ scale: interpolate(translateX.value, [0, SWIPE_X_THRESHOLD], [0.9, 1]) }],
  }));

  const concernStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_X_THRESHOLD, 0], [1, 0]),
    transform: [{ scale: interpolate(translateX.value, [-SWIPE_X_THRESHOLD, 0], [1, 0.9]) }],
  }));

  const commentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [-SWIPE_Y_THRESHOLD, 0], [1, 0]),
    transform: [{ scale: interpolate(translateY.value, [-SWIPE_Y_THRESHOLD, 0], [1, 0.9]) }],
  }));

  return (
    <View className="flex-1 px-5 pb-28 pt-24">
      {nextSegment ? (
        <View className="absolute left-8 right-8 top-[140] rounded-[30px] border border-border/60 bg-card/40 px-5 py-6 opacity-80">
          <Text className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Next segment</Text>
          <Text className="mt-2 text-lg font-semibold text-foreground/80" numberOfLines={2}>{nextSegment.title}</Text>
        </View>
      ) : null}

      {!isFlipped ? (
        <>
          <View className="absolute left-8 top-[164] z-10">
            <Animated.View style={acceptStyle} className="rounded-full bg-[#98971a] px-4 py-2">
              <Text className="text-xs uppercase tracking-[0.2em] text-primary-foreground">Accept</Text>
            </Animated.View>
          </View>
          <View className="absolute right-8 top-[164] z-10">
            <Animated.View style={concernStyle} className="rounded-full bg-destructive px-4 py-2">
              <Text className="text-xs uppercase tracking-[0.2em] text-primary-foreground">Concern</Text>
            </Animated.View>
          </View>
          <View className="absolute left-1/2 top-[104] z-10 -ml-[52px]">
            <Animated.View style={commentStyle} className="rounded-full bg-[#458588] px-4 py-2">
              <Text className="text-xs uppercase tracking-[0.2em] text-primary-foreground">Comment</Text>
            </Animated.View>
          </View>
        </>
      ) : null}

      <GestureDetector gesture={pan}>
        <Animated.View style={cardStyle} className="flex-1">
          <SegmentReviewCard
            segment={segment}
            isFlipped={isFlipped}
            onFlip={onFlip}
            file={file}
            threads={threads}
            onLinePress={onLinePress}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
