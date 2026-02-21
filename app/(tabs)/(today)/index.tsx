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
import { Plus, Trash2, Zap } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTasks } from '@/providers/TaskProvider';
import { getGreeting } from '@/utils/dateUtils';
import {
  getRandomMessage,
  getTimeAwareMessage,
  WAKE_UP_MESSAGES,
  EMPTY_DAY_MESSAGES,
} from '@/constants/toxicMessages';
import { TaskCategory } from '@/types/task';
import VoiceInput from '@/components/VoiceInput';
import TaskCard from '@/components/TaskCard';
import ToxicBanner from '@/components/ToxicBanner';
import AddTaskModal from '@/components/AddTaskModal';
import EditTaskModal from '@/components/EditTaskModal';
import ProgressRing from '@/components/ProgressRing';
import CategoryFilter from '@/components/CategoryFilter';
import DailyRecap from '@/components/DailyRecap';
import DashboardWidgets from '@/components/DashboardWidgets';
import CardSwap from '@/components/CardSwap';
import { Task } from '@/types/task';

const TIP_CARDS = [
  { icon: '🎯', title: 'Speak Your Goals', body: 'Tap the mic and tell GrindOS what you need to get done today. AI will build your battle plan.' },
  { icon: '⚡', title: 'Subtask Mastery', body: 'Tap a task to expand it. Mark subtasks as you crush them one by one.' },
  { icon: '🔥', title: 'Streak Power', body: 'Complete tasks every day to build your streak. Break the chain and you start over.' },
  { icon: '🧠', title: 'Daily Recap', body: 'At the end of the day, get an AI-generated roast of your performance. No mercy.' },
];

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
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
    if (categoryFilter) {
      filtered = filtered.filter(t => t.category === categoryFilter);
    }
    return filtered.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return a.order - b.order;
    });
  }, [tasks, categoryFilter]);

  const handleTranscript = useCallback((text: string) => {
    console.log('[TodayScreen] Transcript received:', text);
    generatePlan(text);
  }, [generatePlan]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const pendingTasks = useMemo(() => sortedTasks.filter(t => !t.completed), [sortedTasks]);
  const completedTasks = useMemo(() => sortedTasks.filter(t => t.completed), [sortedTasks]);

  const handleGenerateRecap = useCallback(() => {
    generateRecap(tasks);
  }, [generateRecap, tasks]);

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
            tintColor={colors.toxic}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textMuted }]}>{greeting}</Text>
            <Text style={[styles.title, { color: colors.text }]}>Today's Battle Plan</Text>
          </View>
          {tasks.length > 0 && (
            <ProgressRing
              progress={todayStats.completionRate}
              size={60}
              strokeWidth={5}
            />
          )}
        </View>

        <ToxicBanner message={bannerMessage} />

        <VoiceInput
          onTranscript={handleTranscript}
          isProcessing={isGenerating}
        />

        {tasks.length === 0 && !isGenerating && (
          <CardSwap cards={TIP_CARDS} delay={4500} />
        )}

        {isGenerating && (
          <View style={[styles.generatingContainer, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <ActivityIndicator size="small" color={colors.toxic} />
            <Text style={[styles.generatingText, { color: colors.textSecondary }]}>
              Building your plan... No excuses incoming.
            </Text>
          </View>
        )}

        {tasks.length > 0 && (
          <>
            <DashboardWidgets
              tasks={tasks}
              todayStats={todayStats}
              streak={streak}
            />

            <CategoryFilter
              selected={categoryFilter}
              onSelect={setCategoryFilter}
              counts={categoryStats}
            />

            <View style={styles.sectionHeader}>
              <View style={styles.sectionLeft}>
                <Zap size={16} color={colors.toxic} fill={colors.toxic} />
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  {pendingTasks.length > 0 ? `${pendingTasks.length} TO CRUSH` : 'ALL CRUSHED'}
                </Text>
              </View>
              <View style={styles.sectionActions}>
                <TouchableOpacity
                  style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
                  onPress={() => setShowAddModal(true)}
                >
                  <Plus size={18} color={colors.toxic} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
                  onPress={clearDay}
                >
                  <Trash2 size={16} color={colors.textMuted} />
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
                <View style={styles.completedHeader}>
                  <View style={[styles.completedLine, { backgroundColor: colors.surfaceBorder }]} />
                  <Text style={[styles.completedLabel, { color: colors.textMuted }]}>
                    DONE ({completedTasks.length})
                  </Text>
                  <View style={[styles.completedLine, { backgroundColor: colors.surfaceBorder }]} />
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

        {tasks.length === 0 && !isGenerating && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💀</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Nothing planned.</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Hit the mic and tell me what you're doing today.{'\n'}Or type it. I don't care. Just do something.
            </Text>
            <TouchableOpacity
              style={[styles.manualAddBtn, { borderColor: colors.toxic }]}
              onPress={() => setShowAddModal(true)}
            >
              <Plus size={16} color={colors.toxic} />
              <Text style={[styles.manualAddText, { color: colors.toxic }]}>Add task manually</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {tasks.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { bottom: 20 + insets.bottom, backgroundColor: colors.toxic, shadowColor: colors.toxic }]}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.8}
        >
          <Plus size={24} color={colors.background} />
        </TouchableOpacity>
      )}

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
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    marginTop: 4,
    letterSpacing: -0.5,
  },
  generatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  generatingText: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 8,
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
  },
  sectionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    marginBottom: 12,
  },
  completedLine: {
    flex: 1,
    height: 1,
  },
  completedLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center' as const,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  manualAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed' as const,
  },
  manualAddText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  fab: {
    position: 'absolute' as const,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
});
