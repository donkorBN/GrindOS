import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Zap } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';

interface ToxicBannerProps {
  message: string;
}

export default function ToxicBanner({ message }: ToxicBannerProps) {
  const colors = useThemeColors();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-10)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(-10);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [message, fadeAnim, slideAnim]);

  if (!message) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <Zap size={14} color={colors.textSecondary} />
      <Text style={[styles.text, { color: colors.textSecondary }]} numberOfLines={3}>
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  text: {
    fontSize: 13,
    fontWeight: '500' as const,
    flex: 1,
    lineHeight: 19,
    letterSpacing: 0.2,
  },
});
