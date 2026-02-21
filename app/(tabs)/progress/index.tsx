import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Flame, Target, TrendingUp, Award, Calendar, Clock } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTasks } from '@/providers/TaskProvider';
import StreakCalendar from '@/components/StreakCalendar';
import { CATEGORIES } from '@/constants/categories';

function StatCard({
  icon,
  label,
  value,
  color,
  colors,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
        {icon}
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { todayStats, allStats, streak, tasks, categoryStats } = useTasks();

  const totalCompletedEver = useMemo(() =>
    allStats.reduce((sum, s) => sum + s.completedTasks, 0), [allStats]);

  const avgCompletion = useMemo(() => {
    if (allStats.length === 0) return 0;
    return Math.round(allStats.reduce((sum, s) => sum + s.completionRate, 0) / allStats.length);
  }, [allStats]);

  const totalMinutesToday = useMemo(() =>
    tasks.filter(t => t.completed).reduce((sum, t) => sum + t.duration, 0), [tasks]);

  const activeDays = useMemo(() =>
    allStats.filter(s => s.totalTasks > 0).length, [allStats]);

  const weekDays = useMemo(() => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const today = new Date();
    const todayIndex = today.getDay();

    return days.map((day, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (todayIndex - i));
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const stat = allStats.find(s => s.date === key);
      const pct = stat && stat.totalTasks > 0 ? (stat.completedTasks / stat.totalTasks) * 100 : 0;
      return { day, pct, isToday: i === todayIndex };
    });
  }, [allStats]);

  const categoryBreakdown = useMemo(() =>
    Object.entries(categoryStats)
      .filter(([_, v]) => v.total > 0)
      .sort((a, b) => b[1].total - a[1].total),
    [categoryStats]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>Your Stats</Text>

        {/* ── Today progress ──────────────────────────── */}
        <View style={[styles.progressCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Today's progress</Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
            {todayStats.completedTasks}/{todayStats.totalTasks} tasks
          </Text>
          <Text style={[styles.bigPercent, { color: colors.text }]}>
            {Math.round(todayStats.completionRate)}%
          </Text>
          <View style={[styles.barBg, { backgroundColor: colors.surfaceLight }]}>
            <View style={[styles.barFill, { backgroundColor: colors.accent, width: `${todayStats.completionRate}%` }]} />
          </View>
        </View>

        {/* ── Stat grid ───────────────────────────────── */}
        <View style={styles.statGrid}>
          <StatCard icon={<Flame size={18} color={colors.danger} />} label="Streak" value={`${streak} days`} color={colors.danger} colors={colors} />
          <StatCard icon={<Target size={18} color={colors.accent} />} label="Done Today" value={String(todayStats.completedTasks)} color={colors.accent} colors={colors} />
          <StatCard icon={<TrendingUp size={18} color={colors.warning} />} label="Avg Rate" value={`${avgCompletion}%`} color={colors.warning} colors={colors} />
          <StatCard icon={<Award size={18} color="#A855F7" />} label="All Time" value={String(totalCompletedEver)} color="#A855F7" colors={colors} />
          <StatCard icon={<Clock size={18} color="#06B6D4" />} label="Focus" value={`${totalMinutesToday}m`} color="#06B6D4" colors={colors} />
          <StatCard icon={<Calendar size={18} color="#EC4899" />} label="Active Days" value={String(activeDays)} color="#EC4899" colors={colors} />
        </View>

        {/* ── This week bar chart ─────────────────────── */}
        <View style={[styles.weekCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>This week</Text>
          <View style={styles.weekChart}>
            {weekDays.map((d, i) => (
              <View key={i} style={styles.weekCol}>
                <View style={[styles.weekBar, { backgroundColor: colors.surfaceLight }]}>
                  <View style={[
                    styles.weekBarFill,
                    {
                      height: `${Math.max(d.pct, 5)}%`,
                      backgroundColor: d.pct >= 100 ? colors.completed : d.pct > 0 ? colors.accent : colors.surfaceBorder,
                    },
                  ]} />
                </View>
                <Text style={[styles.weekLabel, { color: d.isToday ? colors.accent : colors.textMuted }]}>{d.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Heatmap ─────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ACTIVITY</Text>
        <StreakCalendar stats={allStats} weeks={12} />

        {/* ── Category breakdown ──────────────────────── */}
        {categoryBreakdown.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 20 }]}>CATEGORIES</Text>
            <View style={[styles.catCard, { backgroundColor: colors.surface }]}>
              {categoryBreakdown.map(([key, val]) => {
                const cat = CATEGORIES[key as keyof typeof CATEGORIES];
                const pct = val.total > 0 ? Math.round((val.completed / val.total) * 100) : 0;
                return (
                  <View key={key} style={styles.catRow}>
                    <Text style={styles.catEmoji}>{cat?.emoji ?? '📌'}</Text>
                    <Text style={[styles.catName, { color: colors.textSecondary }]}>{cat?.label ?? key}</Text>
                    <View style={[styles.catBar, { backgroundColor: colors.surfaceLight }]}>
                      <View style={[styles.catBarFill, { width: `${pct}%`, backgroundColor: cat?.color ?? colors.textMuted }]} />
                    </View>
                    <Text style={[styles.catPct, { color: colors.textSecondary }]}>{pct}%</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  pageTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: 20 },

  // Progress card
  progressCard: { borderRadius: 16, padding: 18, marginBottom: 16 },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  cardSub: { fontSize: 12, marginTop: 3 },
  bigPercent: { fontSize: 36, fontWeight: '800', marginTop: 8, marginBottom: 8 },
  barBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },

  // Stat grid
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: { borderRadius: 14, padding: 14, flexGrow: 1, flexBasis: '30%', minWidth: '30%' },
  statIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '600', marginTop: 2, letterSpacing: 0.5 },

  // Week chart
  weekCard: { borderRadius: 16, padding: 18, marginBottom: 16 },
  weekChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 90, marginTop: 14 },
  weekCol: { alignItems: 'center', flex: 1, gap: 6 },
  weekBar: { width: 18, height: 70, borderRadius: 6, overflow: 'hidden', justifyContent: 'flex-end' },
  weekBarFill: { width: '100%', borderRadius: 6 },
  weekLabel: { fontSize: 10, fontWeight: '600' },

  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },

  // Category
  catCard: { borderRadius: 16, padding: 16, gap: 12 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  catEmoji: { fontSize: 16 },
  catName: { fontSize: 13, fontWeight: '600', width: 65 },
  catBar: { flex: 1, height: 5, borderRadius: 3, overflow: 'hidden' },
  catBarFill: { height: '100%', borderRadius: 3 },
  catPct: { fontSize: 12, fontWeight: '700', width: 35, textAlign: 'right' },
});
