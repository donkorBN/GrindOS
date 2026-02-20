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

  const streakLabel = streak === 0 ? 'No streak yet' : streak === 1 ? '1 day' : `${streak} days`;
  const bgColor = streak >= 7 ? '#FF6B0020' : streak >= 3 ? '#FFB80020' : colors.toxic + '10';
  const accentColor = streak >= 7 ? '#FF6B00' : streak >= 3 ? '#FFB800' : colors.toxic;

  return (
    <Animated.View style={[styles.streakWidget, { backgroundColor: bgColor, borderColor: accentColor + '30' }, entryStyle]}>
      <View style={styles.streakTop}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Flame size={28} color={accentColor} fill={streak > 0 ? accentColor : 'transparent'} />
        </Animated.View>
        <Text style={[styles.streakCount, { color: accentColor }]}>{streak}</Text>
      </View>
      <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>{streakLabel}</Text>
      <View style={[styles.streakBar, { backgroundColor: accentColor + '20' }]}>
        <View style={[styles.streakBarFill, { width: `${Math.min((streak / 7) * 100, 100)}%`, backgroundColor: accentColor }]} />
      </View>
      <Text style={[styles.streakGoal, { color: colors.textMuted }]}>{streak >= 7 ? '🔥 On fire!' : `${7 - streak} to weekly goal`}</Text>
    </Animated.View>
  );
}

function TimeLeftWidget({ tasks }: { tasks: Task[] }) {
  const colors = useThemeColors();
  const entryStyle = useAnimatedEntry(80);

  const { hoursLeft, minutesLeft, urgency } = useMemo(() => {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59);
    const diffMs = endOfDay.getTime() - now.getTime();
    const h = Math.floor(diffMs / (1000 * 60 * 60));
    const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const urg = h <= 3 ? 'critical' as const : h <= 6 ? 'warning' as const : 'normal' as const;
    return { hoursLeft: h, minutesLeft: m, urgency: urg };
  }, []);

  const pendingCount = tasks.filter(t => !t.completed).length;
  const totalMinutes = tasks.filter(t => !t.completed).reduce((s, t) => s + t.duration, 0);

  const urgencyColor = urgency === 'critical' ? colors.danger : urgency === 'warning' ? colors.warning : colors.textSecondary;
  const bgColor = urgency === 'critical' ? colors.danger + '12' : urgency === 'warning' ? colors.warning + '12' : colors.surface;

  return (
    <Animated.View style={[styles.timeWidget, { backgroundColor: bgColor, borderColor: urgencyColor + '20' }, entryStyle]}>
      <View style={styles.timeTop}>
        <Timer size={16} color={urgencyColor} />
        <Text style={[styles.timeLabel, { color: urgencyColor }]}>TIME LEFT</Text>
      </View>
      <View style={styles.timeRow}>
        <Text style={[styles.timeValue, { color: urgencyColor }]}>{hoursLeft}</Text>
        <Text style={[styles.timeUnit, { color: urgencyColor }]}>h</Text>
        <Text style={[styles.timeValue, { color: urgencyColor }]}>{minutesLeft}</Text>
        <Text style={[styles.timeUnit, { color: urgencyColor }]}>m</Text>
      </View>
      {pendingCount > 0 && (
        <Text style={[styles.timeMeta, { color: colors.textMuted }]}>
          {pendingCount} tasks · ~{totalMinutes}min left
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
      <Animated.View style={[styles.nextWidget, styles.nextWidgetEmpty, { backgroundColor: colors.toxicDim, borderColor: colors.toxic + '20' }, entryStyle]}>
        <Trophy size={20} color={colors.toxic} />
        <Text style={[styles.nextEmptyText, { color: colors.toxic }]}>All clear. For now.</Text>
      </Animated.View>
    );
  }

  const priorityColors: Record<string, string> = {
    critical: colors.danger,
    high: '#FF6B00',
    medium: colors.warning,
    low: colors.textMuted,
  };
  const pColor = priorityColors[task.priority] ?? colors.textMuted;

  return (
    <Animated.View style={[styles.nextWidget, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }, entryStyle]}>
      <View style={styles.nextTop}>
        <View style={[styles.nextPriorityDot, { backgroundColor: pColor }]} />
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
          {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} subtasks done
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
        <Zap size={13} color={colors.toxic} fill={colors.toxic} />
        <Text style={[styles.statPillValue, { color: colors.text }]}>{todayStats.completedTasks}</Text>
        <Text style={[styles.statPillLabel, { color: colors.textMuted }]}>done</Text>
      </View>
      <View style={[styles.statPillDivider, { backgroundColor: colors.surfaceBorder }]} />
      <View style={styles.statPill}>
        <Target size={13} color={colors.warning} />
        <Text style={[styles.statPillValue, { color: colors.text }]}>{todayStats.totalTasks - todayStats.completedTasks}</Text>
        <Text style={[styles.statPillLabel, { color: colors.textMuted }]}>left</Text>
      </View>
      <View style={[styles.statPillDivider, { backgroundColor: colors.surfaceBorder }]} />
      <View style={styles.statPill}>
        <Clock size={13} color="#06B6D4" />
        <Text style={[styles.statPillValue, { color: colors.text }]}>{focusMinutes}m</Text>
        <Text style={[styles.statPillLabel, { color: colors.textMuted }]}>focused</Text>
      </View>
      {criticalPending > 0 && (
        <>
          <View style={[styles.statPillDivider, { backgroundColor: colors.surfaceBorder }]} />
          <View style={styles.statPill}>
            <Skull size={13} color={colors.danger} />
            <Text style={[styles.statPillValue, { color: colors.danger }]}>{criticalPending}</Text>
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
  container: {
    gap: 10,
    marginBottom: 8,
  },
  widgetRow: {
    flexDirection: 'row',
    gap: 10,
  },
  streakWidget: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  streakTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  streakCount: {
    fontSize: 32,
    fontWeight: '900' as const,
    letterSpacing: -1,
  },
  streakLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    marginBottom: 10,
  },
  streakBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  streakBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  streakGoal: {
    fontSize: 10,
    fontWeight: '500' as const,
  },
  timeWidget: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  timeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginBottom: 6,
  },
  timeValue: {
    fontSize: 28,
    fontWeight: '900' as const,
    letterSpacing: -1,
  },
  timeUnit: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginRight: 4,
    opacity: 0.7,
  },
  timeMeta: {
    fontSize: 10,
    fontWeight: '500' as const,
  },
  nextWidget: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  nextWidgetEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  nextTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  nextPriorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nextLabel: {
    flex: 1,
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 1,
  },
  nextTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    lineHeight: 22,
    marginBottom: 6,
  },
  nextMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nextTime: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  nextDuration: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  nextSubtasks: {
    fontSize: 11,
    fontWeight: '500' as const,
    marginTop: 6,
  },
  nextEmptyText: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  statsRow: {
    flexDirection: 'row',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  statPillDivider: {
    width: 1,
    height: 16,
    paddingHorizontal: 0,
  },
  statPillValue: {
    fontSize: 14,
    fontWeight: '800' as const,
  },
  statPillLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
});
