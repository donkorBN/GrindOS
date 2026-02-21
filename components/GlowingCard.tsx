/**
 * GlowingCard — React Native adaptation of a CSS mesh-gradient glowing edge card.
 *
 * Since RN doesn't support CSS mesh gradients, conic masks, or pointer tracking,
 * we simulate the effect with:
 *  • Animated border color cycling through 4 accent hues
 *  • Animated shadow glow that breathes in sync
 *  • A subtle scale pulse on the outer glow layer
 *
 * Usage:
 *   <GlowingCard active={isFocused}>
 *     <TextInput ... />
 *   </GlowingCard>
 */
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';

interface GlowingCardProps {
    /** Whether the glow is active (e.g. input is focused) */
    active?: boolean;
    /** Border radius */
    borderRadius?: number;
    children: React.ReactNode;
}

// The color keyframes — subtle, monochromatic-ish with a hint of accent
const GLOW_COLORS = [
    'rgba(0, 229, 160, 0.5)',   // accent cyan
    'rgba(120, 100, 255, 0.4)', // soft violet
    'rgba(0, 180, 220, 0.45)',  // cool blue
    'rgba(0, 229, 160, 0.5)',   // back to cyan
];

const SHADOW_COLORS = [
    'rgba(0, 229, 160, 0.25)',
    'rgba(120, 100, 255, 0.2)',
    'rgba(0, 180, 220, 0.22)',
    'rgba(0, 229, 160, 0.25)',
];

export default function GlowingCard({
    active = true,
    borderRadius = 14,
    children,
}: GlowingCardProps) {
    const colors = useThemeColors();
    const colorAnim = useRef(new Animated.Value(0)).current;
    const glowOpacity = useRef(new Animated.Value(0)).current;
    const breathe = useRef(new Animated.Value(0)).current;

    // Color cycle loop
    useEffect(() => {
        if (!active) {
            // Fade out glow
            Animated.timing(glowOpacity, {
                toValue: 0,
                duration: 400,
                useNativeDriver: false,
            }).start();
            return;
        }

        // Fade in glow
        Animated.timing(glowOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: false,
        }).start();

        // Color cycling
        const colorLoop = Animated.loop(
            Animated.timing(colorAnim, {
                toValue: GLOW_COLORS.length - 1,
                duration: 6000,
                easing: Easing.linear,
                useNativeDriver: false,
            })
        );
        colorLoop.start();

        // Breathing glow intensity
        const breatheLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(breathe, {
                    toValue: 1,
                    duration: 2000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: false,
                }),
                Animated.timing(breathe, {
                    toValue: 0,
                    duration: 2000,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: false,
                }),
            ])
        );
        breatheLoop.start();

        return () => {
            colorLoop.stop();
            breatheLoop.stop();
        };
    }, [active, colorAnim, glowOpacity, breathe]);

    const borderColor = colorAnim.interpolate({
        inputRange: GLOW_COLORS.map((_, i) => i),
        outputRange: GLOW_COLORS,
    });

    const shadowColor = colorAnim.interpolate({
        inputRange: SHADOW_COLORS.map((_, i) => i),
        outputRange: SHADOW_COLORS,
    });

    const shadowRadius = breathe.interpolate({
        inputRange: [0, 1],
        outputRange: [8, 18],
    });

    const shadowOpacity = breathe.interpolate({
        inputRange: [0, 1],
        outputRange: [0.5, 1],
    });

    return (
        <View style={styles.wrapper}>
            {/* Outer glow layer — sits behind to create the "glow" bleeding effect */}
            <Animated.View
                style={[
                    styles.glowLayer,
                    {
                        borderRadius: borderRadius + 2,
                        borderColor: borderColor,
                        shadowColor: shadowColor,
                        shadowRadius: shadowRadius,
                        shadowOpacity: shadowOpacity,
                        opacity: glowOpacity,
                    },
                ]}
            />

            {/* Main card */}
            <Animated.View
                style={[
                    styles.card,
                    {
                        borderRadius,
                        backgroundColor: colors.surface,
                        borderColor: active ? borderColor : colors.surfaceBorder,
                        opacity: Animated.add(
                            // Always at least 1 opacity for the card itself
                            new Animated.Value(1),
                            new Animated.Value(0)
                        ),
                    },
                ]}
            >
                {children}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: 'relative',
    },
    glowLayer: {
        position: 'absolute',
        top: -1,
        left: -1,
        right: -1,
        bottom: -1,
        borderWidth: 1.5,
        // Shadow for the glow bleed
        shadowOffset: { width: 0, height: 0 },
        elevation: 12,
    },
    card: {
        borderWidth: 1,
        overflow: 'hidden',
    },
});
