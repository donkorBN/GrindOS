import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Text, TextInput, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { TaskProvider } from '@/providers/TaskProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { useThemeColors } from '@/hooks/useThemeColors';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

// Auto-map fontWeight to the correct Inter variant for all Text
function setDefaultFont() {
  const weightMap: Record<string, string> = {
    '100': 'Inter_400Regular',
    '200': 'Inter_400Regular',
    '300': 'Inter_400Regular',
    '400': 'Inter_400Regular',
    'normal': 'Inter_400Regular',
    '500': 'Inter_500Medium',
    '600': 'Inter_600SemiBold',
    '700': 'Inter_700Bold',
    'bold': 'Inter_700Bold',
    '800': 'Inter_800ExtraBold',
    '900': 'Inter_800ExtraBold',
  };

  const originalRender = (Text as any).render;
  if (originalRender) {
    (Text as any).render = function (props: any, ref: any) {
      // Flatten style to get fontWeight
      const flatStyle = props.style
        ? Array.isArray(props.style)
          ? Object.assign({}, ...props.style.flat(Infinity).filter(Boolean))
          : props.style
        : {};
      const weight = flatStyle.fontWeight || '400';
      const fontFamily = weightMap[String(weight)] || 'Inter_400Regular';
      const style = [{ fontFamily }, props.style];
      return originalRender.call(this, { ...props, style }, ref);
    };
  }

  (TextInput as any).defaultProps = (TextInput as any).defaultProps || {};
  (TextInput as any).defaultProps.style = [
    { fontFamily: 'Inter_400Regular' },
    (TextInput as any).defaultProps.style,
  ];
}

function RootLayoutNav() {
  const colors = useThemeColors();
  return (
    <Stack
      screenOptions={{
        headerBackTitle: 'Back',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

function ThemedStatusBar() {
  const colors = useThemeColors();
  const isDark = colors.background === '#1A1C20';
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      setDefaultFont();
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <TaskProvider>
            <ThemedStatusBar />
            <RootLayoutNav />
          </TaskProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
