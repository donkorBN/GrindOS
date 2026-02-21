import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { Flame, Clock, Zap, Target, ArrowRight, Timer, Trophy, Skull } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Task, DayStats } from '@/types/task';

interface DashboardWidgetsProps {
  tasks: Task[];
  todayStats: DayStats;
  streak: number;
}

function useAnimatedEntry(delay: number) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 500,
      delay,
      easing: Easing.out(Easing.back(1.2)),
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);
  return {
    opacity: anim,
    transform: [
      { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
      { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) },
    ],
  };
}

function StreakWidget({ streak }: { streak: number }) {
  const colors = useThemeColors();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const entryStyle = useAnimatedEntry(0);

  useEffect(() => {
    if (streak > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    }
  }, [streak, pulseAnim]);

  const streakLabel = streak === 0 ? 'No streak' : streak === 1 ? '1 day' : `${streak} days`;

  return (
    <Animated.View style={[styles.streakWidget, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }, entryStyle]}>
      <View style={styles.streakTop}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Flame size={24} color={colors.textSecondary} fill={streak > 0 ? colors.textSecondary : 'transparent'} />
        </Animated.View>
        <Text style={[styles.streakCount, { color: colors.text }]}>{streak}</Text>
      </View>
      <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>{streakLabel}</Text>
      <View style={[styles.streakBar, { backgroundColor: colors.surfaceLight }]}>
        <View style={[styles.streakBarFill, { width: `${Math.min((streak / 7) * 100, 100)}%`, backgroundColor: colors.accent }]} />
      </View>
      <Text style={[styles.streakGoal, { color: colors.textMuted }]}>{streak >= 7 ? 'On fire' : `${7 - streak} to weekly`}</Text>
    </Animated.View>
  );
}

function TimeLeftWidget({ tasks }: { tasks: Task[] }) {
  const colors = useThemeColors();
  const entryStyle = useAnimatedEntry(80);

  const { hoursLeft, minutesLeft } = useMemo(() => {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59);
    const diffMs = endOfDay.getTime() - now.getTime();
    const h = Math.floor(diffMs / (1000 * 60 * 60));
    const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return { hoursLeft: h, minutesLeft: m };
  }, []);

  const pendingCount = tasks.filter(t => !t.completed).length;
  const totalMinutes = tasks.filter(t => !t.completed).reduce((s, t) => s + t.duration, 0);

  return (
    <Animated.View style={[styles.timeWidget, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }, entryStyle]}>
      <View style={styles.timeTop}>
        <Timer size={14} color={colors.textSecondary} />
        <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>TIME LEFT</Text>
      </View>
      <View style={styles.timeRow}>
        <Text style={[styles.timeValue, { color: colors.text }]}>{hoursLeft}</Text>
        <Text style={[styles.timeUnit, { color: colors.textMuted }]}>h</Text>
        <Text style={[styles.timeValue, { color: colors.text }]}>{minutesLeft}</Text>
        <Text style={[styles.timeUnit, { color: colors.textMuted }]}>m</Text>
      </View>
      {pendingCount > 0 && (
        <Text style={[styles.timeMeta, { color: colors.textMuted }]}>
          {pendingCount} tasks · ~{totalMinutes}min
        </Text>
      )}
    </Animated.View>
  );
}

function NextUpWidget({ task }: { task: Task | null }) {
  const colors = useThemeColors();
  const entryStyle = useAnimatedEntry(160);

  if (!task) {
    return (
      <Animated.View style={[styles.nextWidget, styles.nextWidgetEmpty, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }, entryStyle]}>
        <Trophy size={18} color={colors.textSecondary} />
        <Text style={[styles.nextEmptyText, { color: colors.textSecondary }]}>All clear. For now.</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.nextWidget, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }, entryStyle]}>
      <View style={styles.nextTop}>
        <View style={[styles.nextPriorityDot, { backgroundColor: colors.textMuted }]} />
        <Text style={[styles.nextLabel, { color: colors.textMuted }]}>NEXT UP</Text>
        <ArrowRight size={12} color={colors.textMuted} />
      </View>
      <Text style={[styles.nextTitle, { color: colors.text }]} numberOfLines={2}>{task.title}</Text>
      <View style={styles.nextMeta}>
        <Clock size={11} color={colors.textMuted} />
        <Text style={[styles.nextTime, { color: colors.textMuted }]}>{task.timeSlot}</Text>
        <Text style={[styles.nextDuration, { color: colors.textMuted }]}>· {task.duration}min</Text>
      </View>
      {task.subtasks.length > 0 && (
        <Text style={[styles.nextSubtasks, { color: colors.textMuted }]}>
          {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} subtasks
        </Text>
      )}
    </Animated.View>
  );
}

function QuickStatsRow({ tasks, todayStats }: { tasks: Task[]; todayStats: DayStats }) {
  const colors = useThemeColors();
  const entryStyle = useAnimatedEntry(240);

  const focusMinutes = useMemo(() =>
    tasks.filter(t => t.completed).reduce((s, t) => s + t.duration, 0), [tasks]);

  const criticalPending = useMemo(() =>
    tasks.filter(t => !t.completed && (t.priority === 'critical' || t.priority === 'high')).length, [tasks]);

  return (
    <Animated.View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }, entryStyle]}>
      <View style={styles.statPill}>
        <Zap size={13} color={colors.accent} fill={colors.accent} />
        <Text style={[styles.statPillValue, { color: colors.text }]}>{todayStats.completedTasks}</Text>
        <Text style={[styles.statPillLabel, { color: colors.textMuted }]}>done</Text>
      </View>
      <View style={[styles.statPillDivider, { backgroundColor: colors.surfaceBorder }]} />
      <View style={styles.statPill}>
        <Target size={13} color={colors.textSecondary} />
        <Text style={[styles.statPillValue, { color: colors.text }]}>{todayStats.totalTasks - todayStats.completedTasks}</Text>
        <Text style={[styles.statPillLabel, { color: colors.textMuted }]}>left</Text>
      </View>
      <View style={[styles.statPillDivider, { backgroundColor: colors.surfaceBorder }]} />
      <View style={styles.statPill}>
        <Clock size={13} color={colors.textSecondary} />
        <Text style={[styles.statPillValue, { color: colors.text }]}>{focusMinutes}m</Text>
        <Text style={[styles.statPillLabel, { color: colors.textMuted }]}>focused</Text>
      </View>
      {criticalPending > 0 && (
        <>
          <View style={[styles.statPillDivider, { backgroundColor: colors.surfaceBorder }]} />
          <View style={styles.statPill}>
            <Skull size={13} color={colors.textSecondary} />
            <Text style={[styles.statPillValue, { color: colors.text }]}>{criticalPending}</Text>
            <Text style={[styles.statPillLabel, { color: colors.textMuted }]}>urgent</Text>
          </View>
        </>
      )}
    </Animated.View>
  );
}

export default function DashboardWidgets({ tasks, todayStats, streak }: DashboardWidgetsProps) {
  const nextTask = useMemo(() => {
    const pending = tasks.filter(t => !t.completed).sort((a, b) => a.order - b.order);
    return pending.length > 0 ? pending[0] : null;
  }, [tasks]);

  if (tasks.length === 0) return null;

  return (
    <View style={styles.container}>
      <QuickStatsRow tasks={tasks} todayStats={todayStats} />

      <View style={styles.widgetRow}>
        <StreakWidget streak={streak} />
        <TimeLeftWidget tasks={tasks} />
      </View>

      <NextUpWidget task={nextTask} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10, marginBottom: 8 },
  widgetRow: { flexDirection: 'row', gap: 10 },
  streakWidget: { flex: 1, borderRadius: 14, padding: 14, borderWidth: 1 },
  streakTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  streakCount: { fontSize: 28, fontWeight: '900' as const, letterSpacing: -1 },
  streakLabel: { fontSize: 11, fontWeight: '600' as const, marginBottom: 10 },
  streakBar: { height: 3, borderRadius: 2, overflow: 'hidden', marginBottom: 6 },
  streakBarFill: { height: '100%', borderRadius: 2 },
  streakGoal: { fontSize: 10, fontWeight: '500' as const },
  timeWidget: { flex: 1, borderRadius: 14, padding: 14, borderWidth: 1 },
  timeTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  timeLabel: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 1 },
  timeRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2, marginBottom: 6 },
  timeValue: { fontSize: 26, fontWeight: '900' as const, letterSpacing: -1 },
  timeUnit: { fontSize: 13, fontWeight: '600' as const, marginRight: 4 },
  timeMeta: { fontSize: 10, fontWeight: '500' as const },
  nextWidget: { borderRadius: 14, padding: 14, borderWidth: 1 },
  nextWidgetEmpty: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  nextTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  nextPriorityDot: { width: 6, height: 6, borderRadius: 3 },
  nextLabel: { flex: 1, fontSize: 10, fontWeight: '700' as const, letterSpacing: 1 },
  nextTitle: { fontSize: 15, fontWeight: '700' as const, lineHeight: 20, marginBottom: 6 },
  nextMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  nextTime: { fontSize: 11, fontWeight: '500' as const },
  nextDuration: { fontSize: 11, fontWeight: '500' as const },
  nextSubtasks: { fontSize: 11, fontWeight: '500' as const, marginTop: 6 },
  nextEmptyText: { fontSize: 13, fontWeight: '700' as const },
  statsRow: { flexDirection: 'row', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  statPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8 },
  statPillDivider: { width: 1, height: 16 },
  statPillValue: { fontSize: 14, fontWeight: '800' as const },
  statPillLabel: { fontSize: 11, fontWeight: '500' as const },
});
