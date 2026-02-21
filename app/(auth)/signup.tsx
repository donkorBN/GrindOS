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

const ACCENT = '#00E5A0';
const BG = '#08090A';
const SURFACE = '#101114';
const BORDER = '#22262C';
const ERR = '#E04050';

export default function SignupScreen() {
    const router = useRouter();
    const { signUp } = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignUp = useCallback(async () => {
        if (!name.trim() || !email.trim() || !password.trim()) {
            setError('Please fill in all fields.');
            return;
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            await signUp(name.trim(), email.trim(), password);
        } catch (e: any) {
            const msg = e?.message || '';
            if (msg.includes('email')) {
                setError('This email is already in use.');
            } else if (msg.includes('password')) {
                setError('Password too weak. Use at least 8 characters.');
            } else {
                setError('Something went wrong. Try again.');
            }
        } finally {
            setLoading(false);
        }
    }, [name, email, password, signUp]);

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
                    <Text style={styles.icon}>⚡</Text>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Your goals won't chase themselves.</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Your Name</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="What should we call you?"
                            placeholderTextColor="#3E424A"
                            autoCapitalize="words"
                            autoComplete="name"
                        />
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="you@example.com"
                            placeholderTextColor="#3E424A"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                        />
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Min. 8 characters"
                            placeholderTextColor="#3E424A"
                            secureTextEntry
                            autoComplete="new-password"
                        />
                    </View>

                    {error ? (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>⚠ {error}</Text>
                        </View>
                    ) : null}

                    <TouchableOpacity
                        style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                        onPress={handleSignUp}
                        activeOpacity={0.8}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={BG} />
                        ) : (
                            <Text style={styles.primaryBtnText}>Create Account</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={styles.footerLink}>Sign In</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: BG,
    },
    scroll: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 28,
        paddingVertical: 60,
    },
    header: {
        alignItems: 'center',
        marginBottom: 44,
    },
    icon: {
        fontSize: 48,
        marginBottom: 12,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#E8E8EC',
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#3E424A',
        textAlign: 'center',
    },
    form: {
        gap: 20,
        marginBottom: 32,
    },
    fieldGroup: {
        gap: 8,
    },
    label: {
        fontSize: 11,
        fontWeight: '700',
        color: '#6C7080',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    input: {
        backgroundColor: SURFACE,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#E8E8EC',
    },
    errorBox: {
        backgroundColor: '#1F0A0E',
        borderWidth: 1,
        borderColor: ERR,
        borderRadius: 10,
        padding: 12,
    },
    errorText: {
        color: ERR,
        fontSize: 13,
    },
    primaryBtn: {
        backgroundColor: ACCENT,
        borderRadius: 10,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 4,
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 6,
    },
    primaryBtnDisabled: {
        opacity: 0.6,
    },
    primaryBtnText: {
        color: BG,
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerText: {
        color: '#3E424A',
        fontSize: 14,
    },
    footerLink: {
        color: ACCENT,
        fontSize: 14,
        fontWeight: '700',
    },
});
