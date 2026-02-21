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
  const pct = total > 0 ? (completed / total) * 100 : 0;

  return (
    <View style={[styles.dayCard, { backgroundColor: colors.surface }]}>
      <TouchableOpacity style={styles.dayRow} onPress={onExpand} activeOpacity={0.7}>
        <View style={[styles.dayIndicator, {
          backgroundColor: pct >= 100 ? colors.completed : pct >= 50 ? colors.accent : pct > 0 ? colors.warning : colors.surfaceBorder,
        }]} />

        <View style={styles.dayContent}>
          <Text style={[styles.dayLabel, { color: colors.text }]}>{formatDateLabel(dateKey)}</Text>
          <Text style={[styles.dayMeta, { color: colors.textMuted }]}>{completed}/{total} tasks · {rate}%</Text>
        </View>

        <View style={[styles.dayProgress, { backgroundColor: colors.surfaceLight }]}>
          <View style={[styles.dayProgressFill, { width: `${pct}%`, backgroundColor: colors.accent }]} />
        </View>

        <ChevronRight
          size={16}
          color={colors.textMuted}
          style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={[styles.dayTasks, { borderTopColor: colors.surfaceBorder }]}>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.accent} style={{ padding: 16 }} />
          ) : tasks.length === 0 ? (
            <Text style={[styles.noTasks, { color: colors.textMuted }]}>No tasks recorded</Text>
          ) : (
            tasks.map((task) => {
              const cat = CATEGORIES[task.category ?? 'other'];
              return (
                <View key={task.id} style={styles.historyTask}>
                  {task.completed
                    ? <CheckCircle2 size={16} color={colors.completed} />
                    : <XCircle size={16} color={colors.danger} />
                  }
                  <View style={styles.historyTaskInfo}>
                    <Text style={[
                      styles.historyTaskTitle,
                      { color: colors.text },
                      task.completed && { textDecorationLine: 'line-through', color: colors.textMuted },
                    ]}>
                      {task.title}
                    </Text>
                    <View style={styles.historyTaskMeta}>
                      <Text style={[styles.historyMetaText, { color: colors.textMuted }]}>{cat?.emoji} {cat?.label}</Text>
                      <Clock size={10} color={colors.textMuted} />
                      <Text style={[styles.historyMetaText, { color: colors.textMuted }]}>{task.timeSlot}</Text>
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
    if (expandedDay === dateKey) { setExpandedDay(null); return; }
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

  const sortedKeys = useMemo(() => [...historyKeys].sort((a, b) => b.localeCompare(a)), [historyKeys]);

  const totalDays = sortedKeys.length;
  const perfectDays = useMemo(() =>
    allStats.filter(s => s.completionRate === 100 && s.totalTasks > 0).length, [allStats]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>History</Text>

        {/* Summary pills */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{totalDays}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Days</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.summaryValue, { color: colors.completed }]}>{perfectDays}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Perfect</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.summaryValue, { color: colors.danger }]}>{totalDays - perfectDays}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Incomplete</Text>
          </View>
        </View>

        {sortedKeys.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={40} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No history yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Start planning days and your history will show here.
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
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  pageTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: 20 },

  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  summaryCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center' },
  summaryValue: { fontSize: 24, fontWeight: '800' },
  summaryLabel: { fontSize: 10, fontWeight: '600', marginTop: 4, letterSpacing: 0.5 },

  emptyState: { alignItems: 'center', paddingVertical: 50, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },

  timeline: { gap: 8 },
  dayCard: { borderRadius: 14, overflow: 'hidden' },
  dayRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  dayIndicator: { width: 4, height: 36, borderRadius: 2 },
  dayContent: { flex: 1 },
  dayLabel: { fontSize: 15, fontWeight: '600' },
  dayMeta: { fontSize: 12, marginTop: 2 },
  dayProgress: { width: 50, height: 4, borderRadius: 2, overflow: 'hidden' },
  dayProgressFill: { height: '100%', borderRadius: 2 },

  dayTasks: { borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 8 },
  noTasks: { fontSize: 13, textAlign: 'center', paddingVertical: 12 },
  historyTask: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8 },
  historyTaskInfo: { flex: 1 },
  historyTaskTitle: { fontSize: 14, fontWeight: '500' },
  historyTaskMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  historyMetaText: { fontSize: 11 },
});
