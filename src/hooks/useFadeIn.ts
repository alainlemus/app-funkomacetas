import { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

export function useFadeIn(duration = 400, delay = 0) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [duration, delay]);

  return {
    opacity,
    transform: [{ translateY }],
  } as ViewStyle;
}

export function useStaggerFadeIn(itemCount: number, stagger = 60, duration = 350) {
  return (index: number) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(10)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration,
          delay: index * stagger,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration,
          delay: index * stagger,
          useNativeDriver: true,
        }),
      ]).start();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [index]);

    return {
      opacity,
      transform: [{ translateY }],
    } as ViewStyle;
  };
}