import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
    const router = useRouter();
    const { user, isLoading } = useAuth();

    // Animations
    const logoScale = useRef(new Animated.Value(0.3)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const taglineOpacity = useRef(new Animated.Value(0)).current;
    const taglineY = useRef(new Animated.Value(20)).current;
    const glowOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Sequence: logo pops in → glow pulses → tagline slides up
        Animated.sequence([
            Animated.parallel([
                Animated.spring(logoScale, {
                    toValue: 1,
                    tension: 60,
                    friction: 7,
                    useNativeDriver: true,
                }),
                Animated.timing(logoOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]),
            Animated.parallel([
                Animated.timing(taglineOpacity, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(taglineY, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(glowOpacity, {
                    toValue: 0.6,
                    duration: 700,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();
    }, []);

    // Navigate after animation
    useEffect(() => {
        if (isLoading) return;
        const timer = setTimeout(() => {
            if (user) {
                router.replace('/(tabs)');
            } else {
                router.replace('/(auth)/login');
            }
        }, 2600);
        return () => clearTimeout(timer);
    }, [isLoading, user]);

    return (
        <View style={styles.container}>
            {/* Background glow */}
            <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />

            {/* Logo area */}
            <Animated.View
                style={[
                    styles.logoContainer,
                    { opacity: logoOpacity, transform: [{ scale: logoScale }] },
                ]}
            >
                <Text style={styles.icon}>⚡</Text>
                <Text style={styles.appName}>TOXIC</Text>
                <Text style={styles.appNameSub}>PLANNER</Text>
            </Animated.View>

            {/* Tagline */}
            <Animated.View
                style={[
                    styles.taglineContainer,
                    {
                        opacity: taglineOpacity,
                        transform: [{ translateY: taglineY }],
                    },
                ]}
            >
                <Text style={styles.tagline}>No excuses. Just results.</Text>
                <View style={styles.divider} />
            </Animated.View>

            {/* Bottom */}
            <Animated.Text style={[styles.version, { opacity: taglineOpacity }]}>
                — get to work —
            </Animated.Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A0A',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    glow: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: '#39FF14',
        top: height / 2 - 200,
        alignSelf: 'center',
        // React Native doesn't support CSS blur, so we simulate with opacity layers
        opacity: 0.08,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    icon: {
        fontSize: 72,
        marginBottom: 8,
    },
    appName: {
        fontSize: 52,
        fontWeight: '900',
        color: '#39FF14',
        letterSpacing: 12,
        textShadowColor: 'rgba(57, 255, 20, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
    },
    appNameSub: {
        fontSize: 20,
        fontWeight: '300',
        color: '#8A8A8A',
        letterSpacing: 14,
        marginTop: -6,
    },
    taglineContainer: {
        alignItems: 'center',
        gap: 16,
    },
    tagline: {
        fontSize: 16,
        color: '#555555',
        letterSpacing: 1,
        fontStyle: 'italic',
    },
    divider: {
        width: 60,
        height: 1,
        backgroundColor: '#39FF14',
        opacity: 0.4,
    },
    version: {
        position: 'absolute',
        bottom: 60,
        fontSize: 12,
        color: '#333333',
        letterSpacing: 2,
    },
});
