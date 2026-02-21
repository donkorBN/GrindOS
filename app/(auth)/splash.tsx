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

const { height } = Dimensions.get('window');

const ACCENT = '#00E5A0';
const BG = '#08090A';

export default function SplashScreen() {
    const router = useRouter();
    const { user, isLoading } = useAuth();

    const logoScale = useRef(new Animated.Value(0.3)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const taglineOpacity = useRef(new Animated.Value(0)).current;
    const taglineY = useRef(new Animated.Value(20)).current;
    const glowOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
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
            <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />

            <Animated.View
                style={[
                    styles.logoContainer,
                    { opacity: logoOpacity, transform: [{ scale: logoScale }] },
                ]}
            >
                <Text style={styles.icon}>⚡</Text>
                <Text style={styles.appName}>GRIND</Text>
                <Text style={styles.appNameSub}>OS</Text>
            </Animated.View>

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

            <Animated.Text style={[styles.version, { opacity: taglineOpacity }]}>
                — get to work —
            </Animated.Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BG,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    glow: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: ACCENT,
        top: height / 2 - 200,
        alignSelf: 'center',
        opacity: 0.05,
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
        fontSize: 56,
        fontWeight: '900',
        color: ACCENT,
        letterSpacing: 16,
        textShadowColor: 'rgba(0, 229, 160, 0.3)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
    },
    appNameSub: {
        fontSize: 24,
        fontWeight: '200',
        color: '#6C7080',
        letterSpacing: 20,
        marginTop: -4,
    },
    taglineContainer: {
        alignItems: 'center',
        gap: 16,
    },
    tagline: {
        fontSize: 14,
        color: '#3E424A',
        letterSpacing: 2,
        fontStyle: 'italic',
    },
    divider: {
        width: 40,
        height: 1,
        backgroundColor: ACCENT,
        opacity: 0.3,
    },
    version: {
        position: 'absolute',
        bottom: 60,
        fontSize: 11,
        color: '#22262C',
        letterSpacing: 3,
        textTransform: 'uppercase',
    },
});
