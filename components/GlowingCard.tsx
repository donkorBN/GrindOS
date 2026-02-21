/**
 * GlowingCard — Animated glowing border effect for input containers.
 * Cycles through blue-violet accent colors with breathing shadow.
 */
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';

interface GlowingCardProps {
    active?: boolean;
    borderRadius?: number;
    children: React.ReactNode;
}

const GLOW_COLORS = [
    'rgba(74, 144, 255, 0.5)',   // blue accent
    'rgba(120, 100, 255, 0.4)',  // soft violet
    'rgba(74, 144, 255, 0.45)',  // blue
    'rgba(74, 144, 255, 0.5)',   // back to blue
];

const SHADOW_COLORS = [
    'rgba(74, 144, 255, 0.25)',
    'rgba(120, 100, 255, 0.2)',
    'rgba(74, 144, 255, 0.22)',
    'rgba(74, 144, 255, 0.25)',
];

export default function GlowingCard({ active = true, borderRadius = 14, children }: GlowingCardProps) {
    const colors = useThemeColors();
    const colorAnim = useRef(new Animated.Value(0)).current;
    const glowOpacity = useRef(new Animated.Value(0)).current;
    const breathe = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!active) {
            Animated.timing(glowOpacity, { toValue: 0, duration: 400, useNativeDriver: false }).start();
            return;
        }

        Animated.timing(glowOpacity, { toValue: 1, duration: 600, useNativeDriver: false }).start();

        const colorLoop = Animated.loop(
            Animated.timing(colorAnim, { toValue: GLOW_COLORS.length - 1, duration: 6000, easing: Easing.linear, useNativeDriver: false })
        );
        colorLoop.start();

        const breatheLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(breathe, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
                Animated.timing(breathe, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
            ])
        );
        breatheLoop.start();

        return () => { colorLoop.stop(); breatheLoop.stop(); };
    }, [active, colorAnim, glowOpacity, breathe]);

    const borderColor = colorAnim.interpolate({ inputRange: GLOW_COLORS.map((_, i) => i), outputRange: GLOW_COLORS });
    const shadowColor = colorAnim.interpolate({ inputRange: SHADOW_COLORS.map((_, i) => i), outputRange: SHADOW_COLORS });
    const shadowRadius = breathe.interpolate({ inputRange: [0, 1], outputRange: [8, 18] });
    const shadowOpacity = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

    return (
        <View style={styles.wrapper}>
            <Animated.View style={[styles.glowLayer, { borderRadius: borderRadius + 2, borderColor, shadowColor, shadowRadius, shadowOpacity, opacity: glowOpacity }]} />
            <Animated.View style={[styles.card, { borderRadius, backgroundColor: colors.surface, borderColor: active ? borderColor : colors.surfaceBorder }]}>
                {children}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: { position: 'relative' },
    glowLayer: { position: 'absolute', top: -1, left: -1, right: -1, bottom: -1, borderWidth: 1.5, shadowOffset: { width: 0, height: 0 }, elevation: 12 },
    card: { borderWidth: 1, overflow: 'hidden' },
});
