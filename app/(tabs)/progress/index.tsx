import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Flame, Target, TrendingUp, Award, Skull, Calendar, Clock } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTasks } from '@/providers/TaskProvider';
import ProgressRing from '@/components/ProgressRing';
import StreakCalendar from '@/components/StreakCalendar';
import { CATEGORIES } from '@/constants/categories';

function StatWidget({
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
    <View style={[styles.widget, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      <View style={[styles.widgetIcon, { backgroundColor: color + '15' }]}>
        {icon}
      </View>
      <Text style={[styles.widgetValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.widgetLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

function WeekDay({ day, completed, total, isToday, colors }: { day: string; completed: number; total: number; isToday: boolean; colors: ReturnType<typeof useThemeColors> }) {
  const pct = total > 0 ? (completed / total) * 100 : 0;
  const barColor = pct >= 100 ? colors.toxic : pct >= 50 ? colors.warning : pct > 0 ? colors.danger : colors.surfaceBorder;

  return (
    <View style={styles.weekDay}>
      <View style={[styles.weekBar, { backgroundColor: colors.surfaceBorder }]}>
        <View style={[styles.weekBarFill, { height: `${Math.max(pct, 5)}%`, backgroundColor: barColor }]} />
      </View>
      <Text style={[styles.weekLabel, { color: colors.textMuted }, isToday && { color: colors.toxic }]}>{day}</Text>
    </View>
  );
}

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { todayStats, allStats, streak, tasks, categoryStats } = useTasks();

  const totalTasksEver = useMemo(() =>
    allStats.reduce((sum, s) => sum + s.totalTasks, 0), [allStats]);

  const totalCompletedEver = useMemo(() =>
    allStats.reduce((sum, s) => sum + s.completedTasks, 0), [allStats]);

  const avgCompletion = useMemo(() => {
    if (allStats.length === 0) return 0;
    return Math.round(allStats.reduce((sum, s) => sum + s.completionRate, 0) / allStats.length);
  }, [allStats]);

  const totalMinutesToday = useMemo(() =>
    tasks.filter(t => t.completed).reduce((sum, t) => sum + t.duration, 0), [tasks]);

  const weekDays = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const todayIndex = today.getDay();

    return days.map((day, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (todayIndex - i));
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const stat = allStats.find(s => s.date === key);
      return {
        day,
        completed: stat?.completedTasks ?? 0,
        total: stat?.totalTasks ?? 0,
        isToday: i === todayIndex,
      };
    });
  }, [allStats]);

  const toxicVerdict = useMemo(() => {
    if (todayStats.totalTasks === 0) return "You haven't even started. Embarrassing.";
    if (todayStats.completionRate === 100) return "All done. Don't get comfortable.";
    if (todayStats.completionRate >= 75) return "Almost there. Don't slack off now.";
    if (todayStats.completionRate >= 50) return "Halfway? That's not a flex.";
    if (todayStats.completionRate >= 25) return "Barely started. Pick up the pace.";
    return "This is pathetic. Get moving.";
  }, [todayStats]);

  const activeDays = useMemo(() =>
    allStats.filter(s => s.totalTasks > 0).length, [allStats]);

  const categoryBreakdown = useMemo(() => {
    return Object.entries(categoryStats)
      .filter(([_, v]) => v.total > 0)
      .sort((a, b) => b[1].total - a[1].total);
  }, [categoryStats]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.pageTitle, { color: colors.text }]}>Your Stats</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>The numbers don't lie</Text>

        <View style={[styles.ringSection, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <ProgressRing
            progress={todayStats.completionRate}
            size={160}
            strokeWidth={12}
            label="Today"
            sublabel={`${todayStats.completedTasks}/${todayStats.totalTasks} tasks`}
          />
          <Text style={[styles.verdict, { color: colors.textSecondary }]}>{toxicVerdict}</Text>
        </View>

        <View style={styles.widgetGrid}>
          <StatWidget
            icon={<Flame size={20} color={colors.danger} />}
            label="Day Streak"
            value={String(streak)}
            color={colors.danger}
            colors={colors}
          />
          <StatWidget
            icon={<Target size={20} color={colors.toxic} />}
            label="Today Done"
            value={String(todayStats.completedTasks)}
            color={colors.toxic}
            colors={colors}
          />
          <StatWidget
            icon={<TrendingUp size={20} color={colors.warning} />}
            label="Avg Rate"
            value={`${avgCompletion}%`}
            color={colors.warning}
            colors={colors}
          />
          <StatWidget
            icon={<Award size={20} color="#A855F7" />}
            label="All Time"
            value={String(totalCompletedEver)}
            color="#A855F7"
            colors={colors}
          />
          <StatWidget
            icon={<Clock size={20} color="#06B6D4" />}
            label="Focus Today"
            value={`${totalMinutesToday}m`}
            color="#06B6D4"
            colors={colors}
          />
          <StatWidget
            icon={<Calendar size={20} color="#EC4899" />}
            label="Active Days"
            value={String(activeDays)}
            color="#EC4899"
            colors={colors}
          />
        </View>

        <View style={[styles.weekSection, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.weekHeader}>
            <Calendar size={16} color={colors.textSecondary} />
            <Text style={[styles.weekTitle, { color: colors.textSecondary }]}>THIS WEEK</Text>
          </View>
          <View style={styles.weekChart}>
            {weekDays.map((d) => (
              <WeekDay key={d.day} {...d} colors={colors} />
            ))}
          </View>
        </View>

        <View style={styles.heatmapSection}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ACTIVITY HEATMAP</Text>
          <StreakCalendar stats={allStats} weeks={12} />
        </View>

        {categoryBreakdown.length > 0 && (
          <View style={styles.categorySection}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>CATEGORY BREAKDOWN</Text>
            <View style={[styles.categoryList, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              {categoryBreakdown.map(([key, val]) => {
                const cat = CATEGORIES[key as keyof typeof CATEGORIES];
                const pct = val.total > 0 ? Math.round((val.completed / val.total) * 100) : 0;
                return (
                  <View key={key} style={styles.categoryRow}>
                    <Text style={styles.catEmoji}>{cat?.emoji ?? '📌'}</Text>
                    <Text style={[styles.catName, { color: colors.textSecondary }]}>{cat?.label ?? key}</Text>
                    <View style={[styles.catBar, { backgroundColor: colors.surfaceBorder }]}>
                      <View style={[styles.catBarFill, { width: `${pct}%`, backgroundColor: cat?.color ?? colors.textMuted }]} />
                    </View>
                    <Text style={[styles.catPct, { color: colors.textSecondary }]}>{pct}%</Text>
                    <Text style={[styles.catCount, { color: colors.textMuted }]}>{val.completed}/{val.total}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={[styles.toxicCard, { backgroundColor: colors.toxicDim, borderColor: colors.toxic + '20' }]}>
          <Skull size={24} color={colors.toxic} />
          <View style={styles.toxicCardContent}>
            <Text style={[styles.toxicCardTitle, { color: colors.toxic }]}>Reality Check</Text>
            <Text style={[styles.toxicCardText, { color: colors.toxic }]}>
              {totalTasksEver === 0
                ? "You've done literally nothing. Not one single task. Open the app and actually DO something."
                : totalCompletedEver / Math.max(totalTasksEver, 1) > 0.8
                  ? `${totalCompletedEver} tasks completed out of ${totalTasksEver}. Decent. But can you keep it up?`
                  : `${totalCompletedEver} out of ${totalTasksEver} tasks done. That's a ${Math.round((totalCompletedEver / Math.max(totalTasksEver, 1)) * 100)}% rate. You need to do better.`}
            </Text>
          </View>
        </View>

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
  ringSection: {
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  verdict: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginTop: 16,
    fontStyle: 'italic' as const,
  },
  widgetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  widget: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  widgetIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  widgetValue: {
    fontSize: 24,
    fontWeight: '800' as const,
  },
  widgetLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  weekSection: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    marginBottom: 20,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  weekTitle: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 1,
  },
  weekChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
  },
  weekDay: {
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  weekBar: {
    width: 20,
    height: 80,
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  weekBarFill: {
    width: '100%',
    borderRadius: 6,
  },
  weekLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  heatmapSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 1,
    marginBottom: 10,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryList: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 14,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  catEmoji: {
    fontSize: 16,
  },
  catName: {
    fontSize: 13,
    fontWeight: '600' as const,
    width: 60,
  },
  catBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  catBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  catPct: {
    fontSize: 12,
    fontWeight: '700' as const,
    width: 35,
    textAlign: 'right' as const,
  },
  catCount: {
    fontSize: 11,
    width: 30,
    textAlign: 'right' as const,
  },
  toxicCard: {
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    gap: 14,
    borderWidth: 1,
  },
  toxicCardContent: {
    flex: 1,
  },
  toxicCardTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    marginBottom: 6,
  },
  toxicCardText: {
    fontSize: 13,
    lineHeight: 20,
    opacity: 0.8,
  },
});
