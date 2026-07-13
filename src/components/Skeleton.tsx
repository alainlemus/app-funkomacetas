import React, { useEffect, useRef } from 'react';
import { Animated, View, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 6, style }: SkeletonProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.skeleton,
          opacity,
        },
        style,
      ]}
    />
  );
}

interface SkeletonCardProps {
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export function SkeletonCard({ height = 110, style }: SkeletonCardProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 12,
          marginBottom: 8,
        },
        style,
      ]}
    >
      <Skeleton width="60%" height={14} style={{ marginBottom: 6 }} />
      <Skeleton width="40%" height={10} style={{ marginBottom: 12 }} />
      <Skeleton width="100%" height={height} borderRadius={8} />
    </View>
  );
}

export function SkeletonStatCard() {
  const { colors } = useTheme();
  return (
    <View
      style={{
        width: '47%',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        backgroundColor: colors.surface,
      }}
    >
      <Skeleton width={48} height={48} borderRadius={24} style={{ marginBottom: 10 }} />
      <Skeleton width="60%" height={24} style={{ marginBottom: 6 }} />
      <Skeleton width="40%" height={12} />
    </View>
  );
}

export function SkeletonTableRow() {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <Skeleton width={44} height={44} borderRadius={8} style={{ marginRight: 8 }} />
      <View style={{ flex: 1 }}>
        <Skeleton width="80%" height={13} style={{ marginBottom: 4 }} />
        <Skeleton width="40%" height={10} />
      </View>
      <Skeleton width={60} height={20} />
    </View>
  );
}