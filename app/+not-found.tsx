import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function NotFoundScreen() {
  const colors = useThemeColors();
  return (
    <>
      <Stack.Screen options={{ title: 'Lost?' }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={styles.emoji}>💀</Text>
        <Text style={[styles.title, { color: colors.text }]}>Wrong turn, soldier.</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>This page doesn't exist. Get back to work.</Text>
        <Link href="/" style={[styles.link, { backgroundColor: colors.toxic }]}>
          <Text style={[styles.linkText, { color: colors.background }]}>Back to Battle Plan</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center' as const,
    marginBottom: 24,
  },
  link: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
