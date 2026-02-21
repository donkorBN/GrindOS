/**
 * CardSwap — React Native adaptation of a GSAP card swap animation.
 * Simulates depth/perspective with scale, translate, opacity, and rotation.
 * Auto-cycles cards with an elastic drop-and-return effect.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Easing,
    Dimensions,
    TouchableOpacity,
} from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CardData {
    title: string;
    body: string;
    icon: string;
}

interface CardSwapProps {
    cards: CardData[];
    /** ms between auto-swaps */
    delay?: number;
    cardWidth?: number;
    cardHeight?: number;
    /** horizontal offset per card in stack */
    stackOffsetX?: number;
    /** vertical offset per card in stack */
    stackOffsetY?: number;
    /** scale reduction per card in stack */
    scaleStep?: number;
}

export default function CardSwap({
    cards,
    delay = 4000,
    cardWidth = SCREEN_WIDTH - 80,
    cardHeight = 160,
    stackOffsetX = 14,
    stackOffsetY = -10,
    scaleStep = 0.04,
}: CardSwapProps) {
    const colors = useThemeColors();
    const [order, setOrder] = useState(() => cards.map((_, i) => i));
    const anims = useRef(cards.map(() => ({
        translateX: new Animated.Value(0),
        translateY: new Animated.Value(0),
        scale: new Animated.Value(1),
        opacity: new Animated.Value(1),
        rotate: new Animated.Value(0),
    }))).current;

    // Position all cards at their stacked slot
    const positionAll = useCallback((currentOrder: number[]) => {
        currentOrder.forEach((cardIdx, stackPos) => {
            const a = anims[cardIdx];
            a.translateX.setValue(stackPos * stackOffsetX);
            a.translateY.setValue(stackPos * stackOffsetY);
            a.scale.setValue(1 - stackPos * scaleStep);
            a.opacity.setValue(1 - stackPos * 0.15);
            a.rotate.setValue(0);
        });
    }, [anims, stackOffsetX, stackOffsetY, scaleStep]);

    // Initial position
    useEffect(() => {
        positionAll(order);
    }, []);

    // Auto-cycle
    useEffect(() => {
        const timer = setInterval(() => {
            setOrder(prev => {
                const [front, ...rest] = prev;
                const newOrder = [...rest, front];
                const frontAnim = anims[front];

                // 1. Drop the front card down and rotate
                Animated.parallel([
                    Animated.timing(frontAnim.translateY, {
                        toValue: 300,
                        duration: 500,
                        easing: Easing.in(Easing.cubic),
                        useNativeDriver: true,
                    }),
                    Animated.timing(frontAnim.rotate, {
                        toValue: 8,
                        duration: 500,
                        easing: Easing.in(Easing.cubic),
                        useNativeDriver: true,
                    }),
                    Animated.timing(frontAnim.opacity, {
                        toValue: 0,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                ]).start(() => {
                    // 2. Move remaining cards forward
                    rest.forEach((cardIdx, newPos) => {
                        const a = anims[cardIdx];
                        Animated.parallel([
                            Animated.timing(a.translateX, {
                                toValue: newPos * stackOffsetX,
                                duration: 600,
                                easing: Easing.out(Easing.back(1.2)),
                                useNativeDriver: true,
                            }),
                            Animated.timing(a.translateY, {
                                toValue: newPos * stackOffsetY,
                                duration: 600,
                                easing: Easing.out(Easing.back(1.2)),
                                useNativeDriver: true,
                            }),
                            Animated.timing(a.scale, {
                                toValue: 1 - newPos * scaleStep,
                                duration: 600,
                                easing: Easing.out(Easing.back(1.2)),
                                useNativeDriver: true,
                            }),
                            Animated.timing(a.opacity, {
                                toValue: 1 - newPos * 0.15,
                                duration: 400,
                                useNativeDriver: true,
                            }),
                        ]).start();
                    });

                    // 3. Return dropped card to back of stack
                    const backPos = cards.length - 1;
                    frontAnim.translateX.setValue((backPos + 1) * stackOffsetX);
                    frontAnim.translateY.setValue(-60);
                    frontAnim.rotate.setValue(-4);
                    frontAnim.scale.setValue(1 - backPos * scaleStep);

                    Animated.parallel([
                        Animated.timing(frontAnim.translateX, {
                            toValue: backPos * stackOffsetX,
                            duration: 700,
                            easing: Easing.out(Easing.back(1.4)),
                            useNativeDriver: true,
                        }),
                        Animated.timing(frontAnim.translateY, {
                            toValue: backPos * stackOffsetY,
                            duration: 700,
                            easing: Easing.out(Easing.back(1.4)),
                            useNativeDriver: true,
                        }),
                        Animated.timing(frontAnim.opacity, {
                            toValue: 1 - backPos * 0.15,
                            duration: 500,
                            useNativeDriver: true,
                        }),
                        Animated.timing(frontAnim.rotate, {
                            toValue: 0,
                            duration: 700,
                            easing: Easing.out(Easing.back(1.4)),
                            useNativeDriver: true,
                        }),
                    ]).start();
                });

                return newOrder;
            });
        }, delay);

        return () => clearInterval(timer);
    }, [delay, anims, cards.length, stackOffsetX, stackOffsetY, scaleStep]);

    // Render cards in reverse order so first is on top
    const renderOrder = [...order].reverse();

    return (
        <View style={[styles.container, { height: cardHeight + 50 }]}>
            {renderOrder.map((cardIdx) => {
                const card = cards[cardIdx];
                const a = anims[cardIdx];
                const rotateStr = a.rotate.interpolate({
                    inputRange: [-10, 0, 10],
                    outputRange: ['-10deg', '0deg', '10deg'],
                });

                return (
                    <Animated.View
                        key={cardIdx}
                        style={[
                            styles.card,
                            {
                                width: cardWidth,
                                height: cardHeight,
                                backgroundColor: colors.surface,
                                borderColor: colors.surfaceBorder,
                                transform: [
                                    { translateX: a.translateX },
                                    { translateY: a.translateY },
                                    { scale: a.scale },
                                    { rotate: rotateStr },
                                ],
                                opacity: a.opacity,
                            },
                        ]}
                    >
                        <Text style={styles.cardIcon}>{card.icon}</Text>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>{card.title}</Text>
                        <Text style={[styles.cardBody, { color: colors.textSecondary }]}>{card.body}</Text>
                    </Animated.View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        marginVertical: 8,
    },
    card: {
        position: 'absolute',
        borderRadius: 14,
        borderWidth: 1,
        padding: 20,
        justifyContent: 'center',
    },
    cardIcon: {
        fontSize: 28,
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 6,
        letterSpacing: -0.3,
    },
    cardBody: {
        fontSize: 13,
        lineHeight: 18,
    },
});
