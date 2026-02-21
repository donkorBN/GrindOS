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
const ACCENT = '#4A90FF';
const TEXT = '#FFFFFF';
const DIM = '#555860';
const ERR = '#FF4D5A';

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
            if (msg.includes('email')) setError('Email already in use.');
            else if (msg.includes('password')) setError('Password too weak.');
            else setError('Something went wrong.');
        } finally {
            setLoading(false);
        }
    }, [name, email, password, signUp]);

    return (
        <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <Text style={styles.logo}>⚡</Text>
                    <Text style={styles.title}>Create Account</Text>
                </View>

                <View style={styles.form}>
                    <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Name" placeholderTextColor={DIM} autoCapitalize="words" autoComplete="name" />
                    <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={DIM} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
                    <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Password (min 8 chars)" placeholderTextColor={DIM} secureTextEntry autoComplete="new-password" />

                    {error ? <Text style={styles.error}>⚠ {error}</Text> : null}

                    <TouchableOpacity style={styles.btn} onPress={handleSignUp} disabled={loading} activeOpacity={0.8}>
                        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Create Account</Text>}
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
    root: { flex: 1, backgroundColor: BG },
    scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 60 },
    header: { alignItems: 'center', marginBottom: 36 },
    logo: { fontSize: 48, marginBottom: 12 },
    title: { fontSize: 28, fontWeight: '800', color: TEXT },
    form: { gap: 14, marginBottom: 28 },
    input: { backgroundColor: SURFACE, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: TEXT },
    error: { color: ERR, fontSize: 13 },
    btn: { backgroundColor: ACCENT, borderRadius: 28, paddingVertical: 16, alignItems: 'center', shadowColor: ACCENT, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
    btnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    footer: { flexDirection: 'row', justifyContent: 'center' },
    footerText: { color: DIM, fontSize: 14 },
    footerLink: { color: ACCENT, fontSize: 14, fontWeight: '700' },
});
