import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useThemeColors } from '@/hooks/useThemeColors';

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
}

export default function ProgressRing({
  progress,
  size = 140,
  strokeWidth = 10,
  label,
  sublabel,
}: ProgressRingProps) {
  const colors = useThemeColors();
  const animatedValue = useRef(new Animated.Value(0)).current;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [dashOffset, setDashOffset] = React.useState(circumference);

  useEffect(() => {
    const clampedProgress = Math.min(100, Math.max(0, progress));

    Animated.timing(animatedValue, {
      toValue: clampedProgress,
      duration: 800,
      useNativeDriver: false,
    }).start();

    const listener = animatedValue.addListener(({ value }) => {
      const offset = circumference - (circumference * value) / 100;
      setDashOffset(offset);
    });

    return () => {
      animatedValue.removeListener(listener);
    };
  }, [progress, circumference, animatedValue]);

  const progressColor = colors.accent;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.surfaceBorder}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.labelContainer}>
        <Text style={[styles.percentage, { color: progressColor }]}>
          {Math.round(progress)}%
        </Text>
        {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
        {sublabel && <Text style={[styles.sublabel, { color: colors.textMuted }]}>{sublabel}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    position: 'absolute' as const,
    alignItems: 'center',
  },
  percentage: {
    fontSize: 28,
    fontWeight: '800' as const,
  },
  label: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500' as const,
  },
  sublabel: {
    fontSize: 10,
    marginTop: 1,
  },
});
