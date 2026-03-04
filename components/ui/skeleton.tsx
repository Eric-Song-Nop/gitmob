import { cn } from '@/lib/utils';
import * as React from 'react';
import { useEffect, useRef } from 'react';
import { Animated, type ViewProps } from 'react-native';

function Skeleton({ className, ...props }: ViewProps) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      className={cn('rounded-md bg-secondary', className)}
      style={{ opacity }}
      {...props}
    />
  );
}

export { Skeleton };
