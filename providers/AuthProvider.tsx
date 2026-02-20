import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { account } from '@/services/appwrite';
import { Models } from 'appwrite';

type AuthUser = Models.User<Models.Preferences> | null;

function useAuthProvider() {
    const [user, setUser] = useState<AuthUser>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const segments = useSegments();

    // Restore session on mount
    useEffect(() => {
        (async () => {
            try {
                const session = await account.get();
                setUser(session);
            } catch {
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    // Route protection
    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!user && !inAuthGroup) {
            router.replace('/(auth)/splash');
        } else if (user && inAuthGroup) {
            router.replace('/(tabs)');
        }
    }, [user, segments, isLoading]);

    const signIn = useCallback(async (email: string, password: string) => {
        await account.createEmailPasswordSession(email, password);
        const session = await account.get();
        setUser(session);
        router.replace('/(tabs)');
    }, [router]);

    const signUp = useCallback(async (name: string, email: string, password: string) => {
        await account.create('unique()', email, password, name);
        await account.createEmailPasswordSession(email, password);
        const session = await account.get();
        setUser(session);
        router.replace('/(tabs)');
    }, [router]);

    const signOut = useCallback(async () => {
        try {
            await account.deleteSession('current');
        } catch {
            // ignore
        }
        setUser(null);
        router.replace('/(auth)/login');
    }, [router]);

    return { user, isLoading, signIn, signUp, signOut };
}

export const [AuthProvider, useAuth] = createContextHook(useAuthProvider);
