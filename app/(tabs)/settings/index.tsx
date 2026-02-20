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
import { Flame, Zap, Skull, MessageSquare, Vibrate, ListChecks, Trash2, Sun, Moon, LogOut } from 'lucide-react-native';
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

  const TOXIC_LEVELS: Array<{ value: ToxicLevel; label: string; description: string; icon: React.ReactNode; color: string }> = [
    {
      value: 'mild',
      label: 'Mild',
      description: 'Encouraging but firm. For sensitive souls.',
      icon: <MessageSquare size={20} color="#10B981" />,
      color: '#10B981',
    },
    {
      value: 'spicy',
      label: 'Spicy',
      description: 'Sharp and motivating. The default grind.',
      icon: <Zap size={20} color={colors.warning} />,
      color: colors.warning,
    },
    {
      value: 'brutal',
      label: 'Brutal',
      description: 'No mercy. Verbal destruction mode.',
      icon: <Skull size={20} color={colors.danger} />,
      color: colors.danger,
    },
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
    Alert.alert(
      'Nuclear Option',
      'This will delete ALL your data locally. Tasks, stats, streaks, everything. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => {
            clearDay();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  }, [clearDay]);

  const handleSignOut = useCallback(() => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  }, [signOut]);

  const totalCompleted = useMemo(() =>
    allStats.reduce((sum, s) => sum + s.completedTasks, 0), [allStats]);

  const isLight = settings.theme === 'light';

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.pageTitle, { color: colors.text }]}>Settings</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Customize your suffering</Text>

        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={[styles.profileAvatar, { backgroundColor: colors.dangerDim }]}>
            <Flame size={28} color={colors.danger} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>{user?.name || 'Warrior'}</Text>
            <Text style={[styles.profileMeta, { color: colors.textMuted }]}>
              {user?.email ? `${user.email} · ` : ''}{streak} day streak · {totalCompleted} tasks crushed
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>TOXIC LEVEL</Text>
        <View style={styles.toxicLevels}>
          {TOXIC_LEVELS.map((level) => (
            <TouchableOpacity
              key={level.value}
              style={[
                styles.toxicLevelCard,
                { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                settings.toxicLevel === level.value && {
                  borderColor: level.color,
                  backgroundColor: level.color + '10',
                },
              ]}
              onPress={() => handleToxicLevel(level.value)}
              activeOpacity={0.7}
            >
              <View style={styles.toxicLevelLeft}>
                {level.icon}
                <View>
                  <Text style={[
                    styles.toxicLevelLabel,
                    { color: colors.text },
                    settings.toxicLevel === level.value && { color: level.color },
                  ]}>
                    {level.label}
                  </Text>
                  <Text style={[styles.toxicLevelDesc, { color: colors.textMuted }]}>{level.description}</Text>
                </View>
              </View>
              <View style={[
                styles.radioOuter,
                { borderColor: colors.surfaceBorder },
                settings.toxicLevel === level.value && { borderColor: level.color },
              ]}>
                {settings.toxicLevel === level.value && (
                  <View style={[styles.radioInner, { backgroundColor: level.color }]} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>PREFERENCES</Text>
        <View style={[styles.settingsGroup, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              {isLight ? <Sun size={18} color={colors.warning} /> : <Moon size={18} color={colors.textSecondary} />}
              <View>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Light Mode</Text>
                <Text style={[styles.settingDesc, { color: colors.textMuted }]}>Switch to {isLight ? 'dark' : 'light'} theme</Text>
              </View>
            </View>
            <Switch
              value={isLight}
              onValueChange={handleThemeToggle}
              trackColor={{ false: colors.surfaceBorder, true: colors.toxic + '50' }}
              thumbColor={isLight ? colors.toxic : colors.textMuted}
            />
          </View>

          <View style={[styles.settingDivider, { backgroundColor: colors.surfaceBorder }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <ListChecks size={18} color={colors.textSecondary} />
              <View>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Show Subtasks</Text>
                <Text style={[styles.settingDesc, { color: colors.textMuted }]}>Expand subtasks on task cards</Text>
              </View>
            </View>
            <Switch
              value={settings.showSubtasks}
              onValueChange={(v) => handleToggle('showSubtasks', v)}
              trackColor={{ false: colors.surfaceBorder, true: colors.toxic + '50' }}
              thumbColor={settings.showSubtasks ? colors.toxic : colors.textMuted}
            />
          </View>

          <View style={[styles.settingDivider, { backgroundColor: colors.surfaceBorder }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Vibrate size={18} color={colors.textSecondary} />
              <View>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Haptic Feedback</Text>
                <Text style={[styles.settingDesc, { color: colors.textMuted }]}>Vibrations on interactions</Text>
              </View>
            </View>
            <Switch
              value={settings.hapticFeedback}
              onValueChange={(v) => handleToggle('hapticFeedback', v)}
              trackColor={{ false: colors.surfaceBorder, true: colors.toxic + '50' }}
              thumbColor={settings.hapticFeedback ? colors.toxic : colors.textMuted}
            />
          </View>

          <View style={[styles.settingDivider, { backgroundColor: colors.surfaceBorder }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Skull size={18} color={colors.textSecondary} />
              <View>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Daily Roast</Text>
                <Text style={[styles.settingDesc, { color: colors.textMuted }]}>AI-generated end-of-day recap</Text>
              </View>
            </View>
            <Switch
              value={settings.dailyRecapEnabled}
              onValueChange={(v) => handleToggle('dailyRecapEnabled', v)}
              trackColor={{ false: colors.surfaceBorder, true: colors.toxic + '50' }}
              thumbColor={settings.dailyRecapEnabled ? colors.toxic : colors.textMuted}
            />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>DANGER ZONE</Text>
        <View style={[styles.dangerSection, { backgroundColor: colors.dangerDim, borderColor: colors.danger + '25' }]}>
          <TouchableOpacity
            style={styles.dangerBtn}
            onPress={handleClearAllData}
            activeOpacity={0.7}
          >
            <Trash2 size={18} color={colors.danger} />
            <View>
              <Text style={[styles.dangerBtnTitle, { color: colors.danger }]}>Clear All Data</Text>
              <Text style={[styles.dangerBtnDesc, { color: colors.danger }]}>Delete everything. No undo.</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>Built for people who need a push.</Text>
          <Text style={[styles.footerVersion, { color: colors.textMuted }]}>v1.0.0</Text>
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          style={[styles.signOutBtn, { backgroundColor: colors.dangerDim, borderColor: colors.danger }]}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <LogOut size={18} color={colors.danger} />
          <Text style={[styles.signOutText, { color: colors.danger }]}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 24,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    marginBottom: 28,
  },
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  profileMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  toxicLevels: {
    gap: 10,
    marginBottom: 28,
  },
  toxicLevelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  toxicLevelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  toxicLevelLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  toxicLevelDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  settingsGroup: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 28,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
  settingDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  settingDivider: {
    height: 1,
    marginHorizontal: 16,
  },
  dangerSection: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 28,
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  dangerBtnTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  dangerBtnDesc: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 13,
    fontStyle: 'italic' as const,
  },
  footerVersion: {
    fontSize: 11,
    marginTop: 4,
    opacity: 0.5,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    marginBottom: 16,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
});
