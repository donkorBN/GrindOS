import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';

const BG = '#1A1C20';
const SURFACE = '#252830';
const BORDER = '#353840';
const ACCENT = '#4A90FF';
const TEXT = '#FFFFFF';
const MUTED = '#9A9DAA';
const DIM = '#555860';
const ERR = '#FF4D5A';

export default function LoginScreen() {
    const router = useRouter();
    const { signIn } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = useCallback(async () => {
        if (!email.trim() || !password.trim()) {
            setError('Please fill in all fields.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            await signIn(email.trim(), password);
        } catch (e: any) {
            const msg = e?.message || '';
            if (msg.includes('Invalid credentials') || msg.includes('password')) {
                setError('Invalid email or password.');
            } else if (msg.includes('user')) {
                setError('No account found. Sign up first.');
            } else {
                setError('Something went wrong. Try again.');
            }
        } finally {
            setLoading(false);
        }
    }, [email, password, signIn]);

    return (
        <KeyboardAvoidingView
            style={styles.root}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <Text style={styles.logo}>⚡</Text>
                    <Text style={styles.tagline}>The only productivity{'\n'}app you need</Text>
                </View>

                <View style={styles.form}>
                    <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={handleLogin}
                        activeOpacity={0.8}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.primaryBtnText}>Sign in with Email</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.inputGroup}>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Email"
                            placeholderTextColor={DIM}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                        />
                        <TextInput
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Password"
                            placeholderTextColor={DIM}
                            secureTextEntry
                            autoComplete="password"
                        />
                    </View>

                    {error ? (
                        <Text style={styles.errorText}>⚠ {error}</Text>
                    ) : null}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Don't have an account? </Text>
                    <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                        <Text style={styles.footerLink}>Sign Up</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: BG },
    scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 60 },
    header: { alignItems: 'center', marginBottom: 40 },
    logo: { fontSize: 56, marginBottom: 16 },
    tagline: {
        fontSize: 26,
        fontWeight: '800',
        color: TEXT,
        textAlign: 'center',
        lineHeight: 34,
    },
    form: { gap: 16, marginBottom: 32 },
    primaryBtn: {
        backgroundColor: ACCENT,
        borderRadius: 28,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    inputGroup: { gap: 12 },
    input: {
        backgroundColor: SURFACE,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: TEXT,
    },
    errorText: { color: ERR, fontSize: 13 },
    footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    footerText: { color: DIM, fontSize: 14 },
    footerLink: { color: ACCENT, fontSize: 14, fontWeight: '700' },
});
