import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Zap, Skull, MessageSquare, Vibrate, ListChecks, Trash2, Sun, Moon, LogOut, Settings } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTasks } from '@/providers/TaskProvider';
import { useAuth } from '@/providers/AuthProvider';
import { ToxicLevel } from '@/types/task';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { settings, updateSettings, streak, allStats, clearDay } = useTasks();
  const { signOut, user } = useAuth();

  const TOXIC_LEVELS: Array<{ value: ToxicLevel; label: string; desc: string; color: string }> = [
    { value: 'mild', label: 'Mild', desc: 'Encouraging but firm', color: '#10B981' },
    { value: 'spicy', label: 'Spicy', desc: 'Sharp and motivating', color: colors.warning },
    { value: 'brutal', label: 'Brutal', desc: 'No mercy mode', color: colors.danger },
  ];

  const handleToxicLevel = useCallback((level: ToxicLevel) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateSettings({ toxicLevel: level });
  }, [updateSettings]);

  const handleToggle = useCallback((key: 'showSubtasks' | 'hapticFeedback' | 'dailyRecapEnabled', value: boolean) => {
    updateSettings({ [key]: value });
  }, [updateSettings]);

  const handleThemeToggle = useCallback((value: boolean) => {
    updateSettings({ theme: value ? 'light' : 'dark' });
  }, [updateSettings]);

  const handleClearAllData = useCallback(() => {
    Alert.alert('Nuclear Option', 'This will delete ALL your data. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete Everything', style: 'destructive', onPress: () => { clearDay(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } },
    ]);
  }, [clearDay]);

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  }, [signOut]);

  const totalCompleted = useMemo(() =>
    allStats.reduce((sum, s) => sum + s.completedTasks, 0), [allStats]);

  const isLight = settings.theme === 'light';
  const userName = user?.name || 'Warrior';

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── GrindOS branding header ─────────────────── */}
        <View style={styles.brandHeader}>
          <View style={styles.brandLeft}>
            <Settings size={18} color={colors.textSecondary} />
            <Text style={[styles.brandName, { color: colors.text }]}>GrindOS</Text>
          </View>
          <Settings size={18} color={colors.textMuted} />
        </View>

        {/* ── Profile card ────────────────────────────── */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
            <Text style={styles.avatarText}>{userName[0]?.toUpperCase()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>{userName}</Text>
            <Text style={[styles.profileMeta, { color: colors.textMuted }]}>
              {user?.email ? `${user.email}` : `${streak} day streak · ${totalCompleted} tasks`}
            </Text>
          </View>
        </View>

        {/* ── AI Task Generation ──────────────────────── */}
        <View style={[styles.featureCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.featureTitle, { color: colors.text }]}>AI Task Generation</Text>
          <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
            Speak your goals, get a structured daily plan.
          </Text>
        </View>

        {/* ── Toxic Motivation ────────────────────────── */}
        <View style={[styles.featureCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.featureTitle, { color: colors.text }]}>Toxic Motivation</Text>
          <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>Choose your pain level:</Text>
          <View style={styles.toxicRow}>
            {TOXIC_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.toxicPill,
                  { borderColor: colors.surfaceBorder },
                  settings.toxicLevel === level.value && { backgroundColor: level.color + '20', borderColor: level.color },
                ]}
                onPress={() => handleToxicLevel(level.value)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.toxicPillText,
                  { color: colors.textSecondary },
                  settings.toxicLevel === level.value && { color: level.color },
                ]}>{level.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Daily Recap card ────────────────────────── */}
        <View style={[styles.featureCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.featureTitle, { color: colors.text }]}>Daily Recap</Text>
          <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
            End-of-day AI roast based on your performance.
          </Text>
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: colors.textMuted }]}>Enabled</Text>
            <Switch
              value={settings.dailyRecapEnabled}
              onValueChange={(v) => handleToggle('dailyRecapEnabled', v)}
              trackColor={{ false: colors.surfaceBorder, true: colors.accent + '50' }}
              thumbColor={settings.dailyRecapEnabled ? colors.accent : colors.textMuted}
            />
          </View>
        </View>

        {/* ── Streak Tracking card ────────────────────── */}
        <View style={[styles.featureCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.featureTitle, { color: colors.text }]}>Streak Tracking</Text>
          <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
            Don't break the chain of productivity.
          </Text>
          <Text style={[styles.streakValue, { color: colors.accent }]}>🔥 {streak} days</Text>
        </View>

        {/* ── Preferences ─────────────────────────────── */}
        <View style={[styles.prefsCard, { backgroundColor: colors.surface }]}>
          <View style={styles.prefRow}>
            <View style={styles.prefLeft}>
              {isLight ? <Sun size={18} color={colors.warning} /> : <Moon size={18} color={colors.textSecondary} />}
              <Text style={[styles.prefLabel, { color: colors.text }]}>{isLight ? 'Light' : 'Dark'} Mode</Text>
            </View>
            <Switch
              value={isLight}
              onValueChange={handleThemeToggle}
              trackColor={{ false: colors.surfaceBorder, true: colors.accent + '50' }}
              thumbColor={isLight ? colors.accent : colors.textMuted}
            />
          </View>
          <View style={[styles.prefDivider, { backgroundColor: colors.surfaceBorder }]} />
          <View style={styles.prefRow}>
            <View style={styles.prefLeft}>
              <ListChecks size={18} color={colors.textSecondary} />
              <Text style={[styles.prefLabel, { color: colors.text }]}>Show Subtasks</Text>
            </View>
            <Switch
              value={settings.showSubtasks}
              onValueChange={(v) => handleToggle('showSubtasks', v)}
              trackColor={{ false: colors.surfaceBorder, true: colors.accent + '50' }}
              thumbColor={settings.showSubtasks ? colors.accent : colors.textMuted}
            />
          </View>
          <View style={[styles.prefDivider, { backgroundColor: colors.surfaceBorder }]} />
          <View style={styles.prefRow}>
            <View style={styles.prefLeft}>
              <Vibrate size={18} color={colors.textSecondary} />
              <Text style={[styles.prefLabel, { color: colors.text }]}>Haptic Feedback</Text>
            </View>
            <Switch
              value={settings.hapticFeedback}
              onValueChange={(v) => handleToggle('hapticFeedback', v)}
              trackColor={{ false: colors.surfaceBorder, true: colors.accent + '50' }}
              thumbColor={settings.hapticFeedback ? colors.accent : colors.textMuted}
            />
          </View>
        </View>

        {/* ── Danger zone ─────────────────────────────── */}
        <TouchableOpacity
          style={[styles.dangerBtn, { backgroundColor: colors.dangerDim }]}
          onPress={handleClearAllData}
          activeOpacity={0.7}
        >
          <Trash2 size={18} color={colors.danger} />
          <Text style={[styles.dangerText, { color: colors.danger }]}>Clear All Data</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.signOutBtn, { backgroundColor: colors.surface }]}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <LogOut size={18} color={colors.danger} />
          <Text style={[styles.signOutText, { color: colors.danger }]}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>Built for people who need a push.</Text>
          <Text style={[styles.footerVersion, { color: colors.textMuted }]}>v1.0.0</Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },

  // Branding
  brandHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  brandLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },

  // Profile
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 16, padding: 18, marginBottom: 16 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '700' },
  profileMeta: { fontSize: 13, marginTop: 2 },

  // Feature cards
  featureCard: { borderRadius: 16, padding: 18, marginBottom: 12 },
  featureTitle: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  featureDesc: { fontSize: 13, lineHeight: 19 },

  // Toxic pills
  toxicRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  toxicPill: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 18, paddingVertical: 8 },
  toxicPillText: { fontSize: 13, fontWeight: '700' },

  // Toggle
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  toggleLabel: { fontSize: 13 },

  streakValue: { fontSize: 18, fontWeight: '800', marginTop: 10 },

  // Preferences
  prefsCard: { borderRadius: 16, marginBottom: 16 },
  prefRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  prefLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  prefLabel: { fontSize: 15, fontWeight: '500' },
  prefDivider: { height: 1, marginHorizontal: 16 },

  // Danger
  dangerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 14, paddingVertical: 14, marginBottom: 12 },
  dangerText: { fontSize: 15, fontWeight: '700' },

  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 14, paddingVertical: 14, marginBottom: 16 },
  signOutText: { fontSize: 15, fontWeight: '700' },

  footer: { alignItems: 'center', paddingVertical: 16 },
  footerText: { fontSize: 13, fontStyle: 'italic' },
  footerVersion: { fontSize: 11, marginTop: 4, opacity: 0.5 },
});
