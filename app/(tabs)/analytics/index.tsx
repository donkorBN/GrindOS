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
import { Flame, Target, TrendingUp, Award, Clock, Calendar, ChevronRight, CheckCircle2, XCircle } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTasks } from '@/providers/TaskProvider';
import { Task } from '@/types/task';
import { CATEGORIES } from '@/constants/categories';
import StreakCalendar from '@/components/StreakCalendar';

function StatCard({ icon, label, value, color, colors }: any) {
    return (
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
                {icon}
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
        </View>
    );
}

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
}: any) {
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
                        tasks.map((task: Task) => {
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

export default function AnalyticsScreen() {
    const insets = useSafeAreaInsets();
    const colors = useThemeColors();
    const { streak, todayStats, allStats, categoryStats, historyKeys, loadHistoryTasks } = useTasks();

    const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

    // History State
    const [expandedDay, setExpandedDay] = useState<string | null>(null);
    const [loadedTasks, setLoadedTasks] = useState<Record<string, Task[]>>({});
    const [loadingDay, setLoadingDay] = useState<string | null>(null);

    // Overview calculations
    const totalCompletedEver = useMemo(() => allStats.reduce((sum, s) => sum + s.completedTasks, 0), [allStats]);
    const activeDays = allStats.length;
    const avgCompletion = useMemo(() => {
        if (activeDays === 0) return 0;
        const sum = allStats.reduce((acc, s) => acc + s.completionRate, 0);
        return Math.round(sum / activeDays);
    }, [allStats, activeDays]);

    const totalMinutesToday = useMemo(() => todayStats.completedTasks * 30, [todayStats]);

    const weekDays = useMemo(() => {
        const res = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const isToday = i === 0;
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const stat = allStats.find((s) => s.date === key);
            res.push({
                day: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
                pct: stat ? stat.completionRate : 0,
                isToday,
            });
        }
        return res;
    }, [allStats]);

    const categoryBreakdown = useMemo(() =>
        Object.entries(categoryStats)
            .filter(([_, v]) => v.total > 0)
            .sort((a, b) => b[1].total - a[1].total),
        [categoryStats]);

    // History calculations
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

    return (
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.pageTitle, { color: colors.text }]}>Analytics</Text>
                <View style={[styles.segmentedControl, { backgroundColor: colors.surface }]}>
                    <TouchableOpacity
                        style={[styles.segmentBtn, activeTab === 'overview' && { backgroundColor: colors.surfaceLight }]}
                        onPress={() => setActiveTab('overview')}
                    >
                        <Text style={[styles.segmentText, { color: activeTab === 'overview' ? colors.text : colors.textMuted }]}>Overview</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.segmentBtn, activeTab === 'history' && { backgroundColor: colors.surfaceLight }]}
                        onPress={() => setActiveTab('history')}
                    >
                        <Text style={[styles.segmentText, { color: activeTab === 'history' ? colors.text : colors.textMuted }]}>History</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {activeTab === 'overview' ? (
                    <>
                        <View style={[styles.progressCard, { backgroundColor: colors.surface }]}>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>Execution Score</Text>
                            <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                                {(todayStats as any).executionTier || 'Slacking'} • {todayStats.completedTasks}/{todayStats.totalTasks} tasks
                            </Text>
                            <Text style={[styles.bigPercent, { color: colors.text }]}>
                                {(todayStats as any).executionScore || Math.round(todayStats.completionRate)}%
                            </Text>
                            <View style={[styles.barBg, { backgroundColor: colors.surfaceLight }]}>
                                <View style={[styles.barFill, { backgroundColor: colors.completed, width: `${Math.min((todayStats as any).executionScore || todayStats.completionRate, 100)}%` }]} />
                            </View>
                        </View>

                        <View style={styles.statGrid}>
                            <StatCard icon={<Flame size={18} color={colors.danger} />} label="Streak" value={`${streak} days`} color={colors.danger} colors={colors} />
                            <StatCard icon={<Target size={18} color={colors.accent} />} label="Done Today" value={String(todayStats.completedTasks)} color={colors.accent} colors={colors} />
                            <StatCard icon={<TrendingUp size={18} color={colors.warning} />} label="Avg Rate" value={`${avgCompletion}%`} color={colors.warning} colors={colors} />
                            <StatCard icon={<Award size={18} color="#A855F7" />} label="All Time" value={String(totalCompletedEver)} color="#A855F7" colors={colors} />
                            <StatCard icon={<Clock size={18} color="#06B6D4" />} label="Focus" value={`${totalMinutesToday}m`} color="#06B6D4" colors={colors} />
                            <StatCard icon={<Calendar size={18} color="#EC4899" />} label="Active Days" value={String(activeDays)} color="#EC4899" colors={colors} />
                        </View>

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

                        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ACTIVITY</Text>
                        <StreakCalendar stats={allStats} weeks={12} />

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
                    </>
                ) : (
                    <View style={styles.timeline}>
                        {sortedKeys.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Calendar size={40} color={colors.textMuted} />
                                <Text style={[styles.emptyTitle, { color: colors.text }]}>No history yet</Text>
                                <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                                    Start planning days and your history will show here.
                                </Text>
                            </View>
                        ) : sortedKeys.map((dateKey) => (
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
    header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    pageTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
    segmentedControl: { flexDirection: 'row', borderRadius: 8, padding: 4, overflow: 'hidden' },
    segmentBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
    segmentText: { fontSize: 13, fontWeight: '600' },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 10 },

    progressCard: { borderRadius: 16, padding: 18, marginBottom: 16 },
    cardTitle: { fontSize: 17, fontWeight: '700' },
    cardSub: { fontSize: 12, marginTop: 3 },
    bigPercent: { fontSize: 36, fontWeight: '800', marginTop: 8, marginBottom: 8 },
    barBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 3 },

    statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
    statCard: { borderRadius: 14, padding: 14, flexGrow: 1, flexBasis: '30%', minWidth: '30%' },
    statIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    statValue: { fontSize: 20, fontWeight: '800' },
    statLabel: { fontSize: 10, fontWeight: '600', marginTop: 2, letterSpacing: 0.5 },

    weekCard: { borderRadius: 16, padding: 18, marginBottom: 16 },
    weekChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 90, marginTop: 14 },
    weekCol: { alignItems: 'center', flex: 1, gap: 6 },
    weekBar: { width: 18, height: 70, borderRadius: 6, overflow: 'hidden', justifyContent: 'flex-end' },
    weekBarFill: { width: '100%', borderRadius: 6 },
    weekLabel: { fontSize: 10, fontWeight: '600' },

    sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },

    catCard: { borderRadius: 16, padding: 16, gap: 12 },
    catRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    catEmoji: { fontSize: 16 },
    catName: { fontSize: 13, fontWeight: '600', width: 65 },
    catBar: { flex: 1, height: 5, borderRadius: 3, overflow: 'hidden' },
    catBarFill: { height: '100%', borderRadius: 3 },
    catPct: { fontSize: 12, fontWeight: '700', width: 35, textAlign: 'right' },

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

    emptyState: { alignItems: 'center', paddingVertical: 50, gap: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '700' },
    emptySubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
});
