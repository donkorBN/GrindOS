import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, ChevronRight, CheckCircle2, XCircle, Clock } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTasks } from '@/providers/TaskProvider';
import { Task } from '@/types/task';
import { CATEGORIES } from '@/constants/categories';

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  if (dateStr === todayKey) return 'Today';
  if (dateStr === yesterdayKey) return 'Yesterday';

  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function HistoryDayCard({
  dateKey,
  onExpand,
  isExpanded,
  tasks,
  isLoading,
  stats,
  colors,
}: {
  dateKey: string;
  onExpand: () => void;
  isExpanded: boolean;
  tasks: Task[];
  isLoading: boolean;
  stats: { total: number; completed: number; rate: number } | null;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const completed = stats?.completed ?? 0;
  const total = stats?.total ?? 0;
  const rate = stats?.rate ?? 0;

  const rateColor = rate >= 100 ? colors.toxic : rate >= 50 ? colors.warning : colors.danger;

  return (
    <View style={[styles.dayCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      <TouchableOpacity style={styles.dayHeader} onPress={onExpand} activeOpacity={0.7}>
        <View style={styles.dayLeft}>
          <View style={[styles.dayDot, { backgroundColor: rateColor }]} />
          <View>
            <Text style={[styles.dayLabel, { color: colors.text }]}>{formatDateLabel(dateKey)}</Text>
            <Text style={[styles.dayMeta, { color: colors.textMuted }]}>{completed}/{total} tasks</Text>
          </View>
        </View>
        <View style={styles.dayRight}>
          <Text style={[styles.dayRate, { color: rateColor }]}>{rate}%</Text>
          <ChevronRight
            size={16}
            color={colors.textMuted}
            style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
          />
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={[styles.dayTasks, { borderTopColor: colors.surfaceBorder }]}>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.toxic} style={{ padding: 16 }} />
          ) : tasks.length === 0 ? (
            <Text style={[styles.noTasks, { color: colors.textMuted }]}>No tasks recorded</Text>
          ) : (
            tasks.map((task) => {
              const cat = CATEGORIES[task.category ?? 'other'];
              return (
                <View key={task.id} style={styles.historyTask}>
                  {task.completed ? (
                    <CheckCircle2 size={16} color={colors.toxic} />
                  ) : (
                    <XCircle size={16} color={colors.danger} />
                  )}
                  <View style={styles.historyTaskInfo}>
                    <Text style={[styles.historyTaskTitle, { color: colors.text }, task.completed && { textDecorationLine: 'line-through' as const, color: colors.textMuted }]}>
                      {task.title}
                    </Text>
                    <View style={styles.historyTaskMeta}>
                      <Text style={[styles.historyTaskMetaText, { color: colors.textMuted }]}>{cat?.emoji} {cat?.label}</Text>
                      <Clock size={10} color={colors.textMuted} />
                      <Text style={[styles.historyTaskMetaText, { color: colors.textMuted }]}>{task.timeSlot}</Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}
    </View>
  );
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { historyKeys, allStats, loadHistoryTasks } = useTasks();
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [loadedTasks, setLoadedTasks] = useState<Record<string, Task[]>>({});
  const [loadingDay, setLoadingDay] = useState<string | null>(null);

  const statsMap = useMemo(() => {
    const map: Record<string, { total: number; completed: number; rate: number }> = {};
    allStats.forEach(s => {
      map[s.date] = { total: s.totalTasks, completed: s.completedTasks, rate: s.completionRate };
    });
    return map;
  }, [allStats]);

  const handleExpand = useCallback(async (dateKey: string) => {
    if (expandedDay === dateKey) {
      setExpandedDay(null);
      return;
    }
    setExpandedDay(dateKey);
    if (!loadedTasks[dateKey]) {
      setLoadingDay(dateKey);
      try {
        const tasks = await loadHistoryTasks(dateKey);
        setLoadedTasks(prev => ({ ...prev, [dateKey]: tasks }));
      } catch (err) {
        console.error('[History] Failed to load tasks for', dateKey, err);
      } finally {
        setLoadingDay(null);
      }
    }
  }, [expandedDay, loadedTasks, loadHistoryTasks]);

  const sortedKeys = useMemo(() => {
    return [...historyKeys].sort((a, b) => b.localeCompare(a));
  }, [historyKeys]);

  const totalDays = sortedKeys.length;
  const perfectDays = useMemo(() =>
    allStats.filter(s => s.completionRate === 100 && s.totalTasks > 0).length, [allStats]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.pageTitle, { color: colors.text }]}>History</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Your war log</Text>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{totalDays}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Days Tracked</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.summaryValue, { color: colors.toxic }]}>{perfectDays}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Perfect Days</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.summaryValue, { color: colors.danger }]}>{totalDays - perfectDays}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Incomplete</Text>
          </View>
        </View>

        {sortedKeys.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={40} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No history yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Start planning days and your history will appear here.
              Or keep procrastinating. Your call.
            </Text>
          </View>
        ) : (
          <View style={styles.timeline}>
            {sortedKeys.map((dateKey) => (
              <HistoryDayCard
                key={dateKey}
                dateKey={dateKey}
                onExpand={() => handleExpand(dateKey)}
                isExpanded={expandedDay === dateKey}
                tasks={loadedTasks[dateKey] ?? []}
                isLoading={loadingDay === dateKey}
                stats={statsMap[dateKey] ?? null}
                colors={colors}
              />
            ))}
          </View>
        )}

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
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '800' as const,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center' as const,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  timeline: {
    gap: 8,
  },
  dayCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  dayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dayLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  dayMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  dayRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayRate: {
    fontSize: 16,
    fontWeight: '800' as const,
  },
  dayTasks: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  noTasks: {
    fontSize: 13,
    textAlign: 'center' as const,
    paddingVertical: 12,
  },
  historyTask: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
  },
  historyTaskInfo: {
    flex: 1,
  },
  historyTaskTitle: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  historyTaskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  historyTaskMetaText: {
    fontSize: 11,
  },
});
