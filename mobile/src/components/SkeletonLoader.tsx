import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import { useTheme } from "@/theme/ThemeContext";

export function SkeletonLoader({ width = "100%", height = 16, borderRadius = 8, style }: any) {
  const { colors } = useTheme();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: colors.muted, opacity },
        style,
      ]}
    />
  );
}

export function ResultsSkeleton() {
  return (
    <View style={skeletonStyles.container}>
      <SkeletonLoader height={20} width="60%" style={{ marginBottom: 16 }} />
      <SkeletonLoader height={80} style={{ marginBottom: 12 }} />
      <SkeletonLoader height={48} style={{ marginBottom: 8 }} />
      <SkeletonLoader height={48} style={{ marginBottom: 8 }} />
      <SkeletonLoader height={48} style={{ marginBottom: 8 }} />
      <SkeletonLoader height={48} style={{ marginBottom: 8 }} />
      <SkeletonLoader height={48} />
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  container: { padding: 16 },
});
