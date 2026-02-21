import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';

const BG = '#1A1C20';
const SURFACE = '#252830';
const ACCENT = '#4A90FF';
const TEXT = '#FFFFFF';
const MUTED = '#555860';

export default function SplashScreen() {
    const router = useRouter();
    const { user, isLoading } = useAuth();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();
    }, []);

    useEffect(() => {
        if (!isLoading) {
            const timer = setTimeout(() => {
                if (user) {
                    router.replace('/(tabs)/(today)');
                } else {
                    router.replace('/(auth)/login');
                }
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [user, isLoading, router]);

    return (
        <View style={styles.root}>
            <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                <Text style={styles.logo}>⚡</Text>
                <Text style={styles.title}>GRIND OS</Text>
                <Text style={styles.tagline}>The only productivity{'\n'}app you need</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: BG,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    content: {
        alignItems: 'center',
    },
    logo: {
        fontSize: 64,
        marginBottom: 20,
    },
    title: {
        fontSize: 34,
        fontWeight: '900',
        color: TEXT,
        letterSpacing: 3,
        marginBottom: 12,
    },
    tagline: {
        fontSize: 22,
        fontWeight: '700',
        color: TEXT,
        textAlign: 'center',
        lineHeight: 30,
        opacity: 0.8,
    },
});
