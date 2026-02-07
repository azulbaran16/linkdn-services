import React from 'react';
import { Pressable, View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { colors, borderRadius, spacing, shadows } from '../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  elevated?: boolean;
}

export function Card({ children, style, onPress, elevated = false }: CardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withTiming(0.98, { duration: 100 });
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withTiming(1, { duration: 100 });
    }
  };

  const cardStyle = [
    styles.card,
    elevated ? styles.elevated : styles.bordered,
    style,
  ];

  if (onPress) {
    return (
      <Animated.View style={[cardStyle, animatedStyle]}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          {children as any}
        </Pressable>
      </Animated.View>
    );
  }

  return <View style={cardStyle}>{children as any}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  bordered: {
    borderWidth: 1,
    borderColor: colors.neutral200,
    ...shadows.card,
  },
  elevated: {
    ...shadows.elevated,
  },
});
