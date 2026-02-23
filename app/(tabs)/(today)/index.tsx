import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Trash2, ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuth } from '@/providers/AuthProvider';
import { useTasks } from '@/providers/TaskProvider';
import { getGreeting } from '@/utils/dateUtils';
import {
  getRandomMessage,
  WAKE_UP_MESSAGES,
  EMPTY_DAY_MESSAGES,
} from '@/constants/toxicMessages';
import { TaskCategory } from '@/types/task';
import { CATEGORIES, CATEGORY_KEYS } from '@/constants/categories';
import VoiceInput from '@/components/VoiceInput';
import TaskCard from '@/components/TaskCard';
import ToxicBanner from '@/components/ToxicBanner';
import AddTaskModal from '@/components/AddTaskModal';
import EditTaskModal from '@/components/EditTaskModal';
import DailyRecap from '@/components/DailyRecap';
import CardSwap from '@/components/CardSwap';
import { Task } from '@/types/task';

const TIP_CARDS = [
  { icon: '🎯', title: 'Speak Your Goals', body: 'Tap the mic and tell GrindOS what you need to get done today.' },
  { icon: '⚡', title: 'Subtask Mastery', body: 'Tap a task to expand it. Mark subtasks as you crush them.' },
  { icon: '🔥', title: 'Streak Power', body: 'Complete tasks daily to build your streak.' },
  { icon: '🧠', title: 'Daily Recap', body: 'Get an AI-generated review of your performance.' },
];

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { user } = useAuth();
  const {
    tasks,
    lastMessage,
    isLoading,
    isGenerating,
    todayStats,
    streak,
    settings,
    categoryStats,
    isRecapping,
    recapText,
    generatePlan,
    generateRecap,
    toggleTask,
    toggleSubtask,
    deleteTask,
    addTask,
    updateTask,
    clearDay,
  } = useTasks();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | null>(null);

  const greeting = useMemo(() => getGreeting(), []);
  const bannerMessage = useMemo(() => {
    if (lastMessage) return lastMessage;
    if (tasks.length === 0) return getRandomMessage(EMPTY_DAY_MESSAGES[settings.toxicLevel]);
    return getRandomMessage(WAKE_UP_MESSAGES[settings.toxicLevel]);
  }, [lastMessage, tasks.length, settings.toxicLevel]);

  const sortedTasks = useMemo(() => {
    let filtered = [...tasks];
    if (categoryFilter) filtered = filtered.filter(t => t.category === categoryFilter);
    return filtered.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return a.order - b.order;
    });
  }, [tasks, categoryFilter]);

  const handleTranscript = useCallback((text: string) => {
    generatePlan(text);
  }, [generatePlan]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const pendingTasks = useMemo(() => sortedTasks.filter(t => !t.completed), [sortedTasks]);
  const completedTasks = useMemo(() => sortedTasks.filter(t => t.completed), [sortedTasks]);
  const userName = user?.name?.split(' ')[0] || 'Warrior';

  const handleGenerateRecap = useCallback(() => {
    generateRecap(tasks);
  }, [generateRecap, tasks]);

  // Active categories for grid
  const activeCategories = useMemo(() =>
    CATEGORY_KEYS.filter(key => categoryStats[key]?.total > 0), [categoryStats]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* ── Header ──────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerToday, { color: colors.textSecondary }]}>Today,</Text>
            <Text style={[styles.headerGrind, { color: colors.text }]}>Your grind</Text>
          </View>
          <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
            <Text style={styles.avatarText}>{userName[0]?.toUpperCase()}</Text>
          </View>
        </View>

        {/* ── Weekly day row ──────────────────────────────── */}
        <View style={styles.weekRow}>
          {(() => {
            const today = new Date();
            const dayOfWeek = today.getDay(); // 0=Sun
            const monday = new Date(today);
            monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
            const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
            return days.map((d, i) => {
              const date = new Date(monday);
              date.setDate(monday.getDate() + i);
              const isToday = date.toDateString() === today.toDateString();
              return (
                <View key={i} style={styles.weekDay}>
                  <Text style={[styles.weekDayLabel, { color: colors.textMuted }]}>{d}</Text>
                  <View style={[
                    styles.weekDayCircle,
                    isToday && { backgroundColor: colors.accent },
                    !isToday && { backgroundColor: colors.surface },
                  ]}>
                    <Text style={[
                      styles.weekDayNum,
                      isToday ? { color: '#FFF' } : { color: colors.textSecondary },
                    ]}>{date.getDate()}</Text>
                  </View>
                </View>
              );
            });
          })()}
        </View>

        {/* ── Voice / text input ────────────────────────────── */}
        <VoiceInput
          onTranscript={handleTranscript}
          isProcessing={isGenerating}
        />

        {tasks.length === 0 && !isGenerating && !isLoading && (
          <CardSwap cards={TIP_CARDS} delay={4500} />
        )}

        {isGenerating && (
          <View style={[styles.generatingCard, { backgroundColor: colors.surface }]}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={[styles.generatingText, { color: colors.textSecondary }]}>
              Building your plan...
            </Text>
          </View>
        )}

        {/* ── Execution Score card ──────────────────────────── */}
        {tasks.length > 0 && (
          <View style={[styles.progressCard, { backgroundColor: colors.surface }]}>
            <View style={styles.progressHeader}>
              <View>
                <Text style={[styles.progressTitle, { color: colors.text }]}>Execution Score</Text>
                <Text style={[styles.progressSub, { color: colors.textSecondary }]}>
                  {todayStats.executionTier} • {todayStats.completedTasks}/{todayStats.totalTasks} tasks
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {settings.momentumMultiplier > 1.0 && (
                  <View style={[styles.streakBadge, { backgroundColor: '#A855F720' }]}>
                    <Text style={[styles.streakText, { color: '#A855F7' }]}>⚡ {settings.momentumMultiplier}x</Text>
                  </View>
                )}
                {streak > 0 && (
                  <View style={[styles.streakBadge, { backgroundColor: colors.accent + '20' }]}>
                    <Text style={[styles.streakText, { color: colors.accent }]}>🔥 {streak}</Text>
                  </View>
                )}
              </View>
            </View>
            <Text style={[styles.progressPercent, { color: colors.text }]}>
              {todayStats.executionScore}%
            </Text>
            <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceLight }]}>
              <View style={[
                styles.progressBarFill,
                { backgroundColor: colors.completed, width: `${Math.min(todayStats.executionScore, 100)}%` },
              ]} />
            </View>
          </View>
        )}

        {/* ── Identity XP ──────────────────────────────────── */}
        {settings.identities?.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>Identities</Text>
            {settings.identities.map((identity) => (
              <View key={identity.id} style={[styles.categoryCard, { backgroundColor: colors.surface, marginTop: 8 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={[styles.catLabel, { color: colors.text }]}>{identity.name} Lv.{identity.level}</Text>
                  <Text style={[styles.catRatio, { color: colors.textMuted }]}>{identity.xp} XP</Text>
                </View>
                <View style={[styles.catProgressBg, { backgroundColor: colors.surfaceLight }]}>
                  <View style={[
                    styles.catProgressFill,
                    { backgroundColor: '#A855F7', width: `${Math.min((identity.xp % 100), 100)}%` },
                  ]} />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Toxic banner ─────────────────────────────────── */}
        <ToxicBanner message={bannerMessage} />

        {/* ── Category grid ────────────────────────────────── */}
        {activeCategories.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>Categories</Text>
            <View style={styles.categoryGrid}>
              {activeCategories.slice(0, 4).map((key) => {
                const cat = CATEGORIES[key];
                const stats = categoryStats[key] || { total: 0, completed: 0 };
                const isSelected = categoryFilter === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.categoryCard,
                      { backgroundColor: colors.surface },
                      isSelected && { borderColor: cat.color, borderWidth: 1 },
                    ]}
                    onPress={() => setCategoryFilter(isSelected ? null : key)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.catIcon, { backgroundColor: cat.color }]}>
                      <Text style={styles.catIconText}>{cat.emoji}</Text>
                    </View>
                    <Text style={[styles.catCount, { color: colors.textSecondary }]}>
                      {stats.total - stats.completed} active
                    </Text>
                    <Text style={[styles.catLabel, { color: colors.text }]}>{cat.label}</Text>
                    <View style={[styles.catProgressBg, { backgroundColor: colors.surfaceLight }]}>
                      <View style={[
                        styles.catProgressFill,
                        {
                          backgroundColor: cat.color,
                          width: stats.total > 0 ? `${(stats.completed / stats.total) * 100}%` : '0%',
                        },
                      ]} />
                    </View>
                    <Text style={[styles.catRatio, { color: colors.textMuted }]}>
                      {stats.completed}/{stats.total}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* ── Task list ────────────────────────────────────── */}
        {tasks.length > 0 && (
          <>
            <View style={styles.taskHeader}>
              <Text style={[styles.sectionLabel, { color: colors.text }]}>Tasks</Text>
              <View style={styles.taskActions}>
                <TouchableOpacity
                  style={[styles.addBtn, { backgroundColor: colors.accent }]}
                  onPress={() => setShowAddModal(true)}
                >
                  <Plus size={16} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.clearBtn, { backgroundColor: colors.surface }]}
                  onPress={clearDay}
                >
                  <Trash2 size={14} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {pendingTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={toggleTask}
                onDelete={deleteTask}
                onEdit={setEditingTask}
                onToggleSubtask={toggleSubtask}
              />
            ))}

            {completedTasks.length > 0 && (
              <>
                <View style={styles.completedDivider}>
                  <View style={[styles.dividerLine, { backgroundColor: colors.surfaceBorder }]} />
                  <Text style={[styles.dividerLabel, { color: colors.textMuted }]}>
                    DONE ({completedTasks.length})
                  </Text>
                  <View style={[styles.dividerLine, { backgroundColor: colors.surfaceBorder }]} />
                </View>
                {completedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={toggleTask}
                    onDelete={deleteTask}
                    onEdit={setEditingTask}
                    onToggleSubtask={toggleSubtask}
                  />
                ))}
              </>
            )}

            {settings.dailyRecapEnabled && tasks.length >= 2 && (
              <DailyRecap
                recapText={recapText}
                isLoading={isRecapping}
                onGenerate={handleGenerateRecap}
                hasEnoughTasks={tasks.length >= 2}
              />
            )}
          </>
        )}

        {/* ── Empty state ──────────────────────────────────── */}
        {tasks.length === 0 && !isGenerating && !isLoading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💀</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Nothing planned.</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Hit the mic or type your tasks to get started.
            </Text>
            <TouchableOpacity
              style={[styles.manualAddBtn, { borderColor: colors.accent }]}
              onPress={() => setShowAddModal(true)}
            >
              <Plus size={16} color={colors.accent} />
              <Text style={[styles.manualAddText, { color: colors.accent }]}>Add task manually</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      <AddTaskModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addTask}
      />

      <EditTaskModal
        visible={!!editingTask}
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onSave={updateTask}
        onDelete={deleteTask}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  headerLeft: {},
  headerToday: { fontSize: 22, fontWeight: '500', marginBottom: 2 },
  headerGrind: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontSize: 18, fontWeight: '800' },

  // Weekly day row
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 4 },
  weekDay: { alignItems: 'center', gap: 6 },
  weekDayLabel: { fontSize: 12, fontWeight: '600' },
  weekDayCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  weekDayNum: { fontSize: 14, fontWeight: '700' },

  // Progress card
  progressCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  progressTitle: { fontSize: 17, fontWeight: '700' },
  progressSub: { fontSize: 12, marginTop: 3 },
  streakBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  streakText: { fontSize: 12, fontWeight: '700' },
  progressPercent: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  progressBarBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },

  // Generating
  generatingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 14,
  },
  generatingText: { fontSize: 13, fontWeight: '500' },

  // Section labels
  sectionLabel: { fontSize: 20, fontWeight: '700', marginBottom: 14, marginTop: 6 },

  // Category grid (2x2)
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  categoryCard: {
    width: '48%' as any,
    borderRadius: 16,
    padding: 14,
    flexGrow: 1,
    flexBasis: '46%',
  },
  catIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  catIconText: { fontSize: 18 },
  catCount: { fontSize: 11, marginBottom: 2 },
  catLabel: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  catProgressBg: { height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  catProgressFill: { height: '100%', borderRadius: 2 },
  catRatio: { fontSize: 11, fontWeight: '600', alignSelf: 'flex-end' },

  // Task list header
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskActions: { flexDirection: 'row', gap: 8 },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Completed divider
  completedDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    marginBottom: 12,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 1 },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 30 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
  manualAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  manualAddText: { fontSize: 13, fontWeight: '600' },
});
