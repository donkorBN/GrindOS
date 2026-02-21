import createContextHook from '@nkzw/create-context-hook';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { generateObject, generateText } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';
import { Task, DayStats, AppSettings, DEFAULT_SETTINGS, TaskCategory, SubTask } from '@/types/task';
import { getTodayKey } from '@/utils/dateUtils';
import {
  getRandomMessage,
  ALL_DONE_MESSAGES,
  TASK_COMPLETE_MESSAGES,
  SLACKING_MESSAGES,
  EMPTY_DAY_MESSAGES,
  getTimeAwareMessage,
} from '@/constants/toxicMessages';
import {
  databases,
  DATABASE_ID,
  TASKS_COLLECTION_ID,
  SETTINGS_COLLECTION_ID,
  STATS_COLLECTION_ID,
  ID,
  Query,
} from '@/services/appwrite';

const taskSchema = z.object({
  tasks: z.array(z.object({
    title: z.string(),
    description: z.string(),
    timeSlot: z.string(),
    duration: z.number(),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    category: z.enum(['work', 'health', 'personal', 'learning', 'errands', 'social', 'creative', 'other']),
    subtasks: z.array(z.string()).optional(),
  })),
  toxicQuote: z.string(),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function docToTask(doc: any): Task {
  return {
    id: doc.$id,
    title: doc.title,
    description: doc.description || '',
    timeSlot: doc.timeSlot || '',
    duration: doc.duration ?? 30,
    completed: doc.completed ?? false,
    priority: doc.priority || 'medium',
    category: (doc.category || 'other') as TaskCategory,
    notes: doc.notes || '',
    createdAt: doc.createdAt || doc.$createdAt,
    completedAt: doc.completedAt || undefined,
    order: doc.order ?? 0,
    subtasks: doc.subtasksJson ? (JSON.parse(doc.subtasksJson) as SubTask[]) : [],
  };
}

function taskToDoc(task: Task, dateKey: string) {
  return {
    title: task.title,
    description: task.description || '',
    timeSlot: task.timeSlot || '',
    duration: Math.round(task.duration ?? 30),
    completed: task.completed ?? false,
    priority: task.priority || 'medium',
    category: task.category || 'other',
    notes: task.notes || '',
    createdAt: task.createdAt,
    completedAt: task.completedAt || '',
    order: task.order ?? 0,
    dateKey,
    subtasksJson: JSON.stringify(task.subtasks || []),
  };
}

function docToSettings(doc: any): AppSettings {
  return {
    toxicLevel: doc.toxicLevel || DEFAULT_SETTINGS.toxicLevel,
    showSubtasks: doc.showSubtasks ?? DEFAULT_SETTINGS.showSubtasks,
    hapticFeedback: doc.hapticFeedback ?? DEFAULT_SETTINGS.hapticFeedback,
    dailyRecapEnabled: doc.dailyRecapEnabled ?? DEFAULT_SETTINGS.dailyRecapEnabled,
    theme: doc.theme || DEFAULT_SETTINGS.theme,
  };
}

// A stable device ID so we consistently locate the single settings document
const SETTINGS_DOC_ID = 'global-settings';

// ─── Provider ─────────────────────────────────────────────────────────────────

function useTasksProvider() {
  const queryClient = useQueryClient();
  const todayKey = getTodayKey();

  // ── Settings ────────────────────────────────────────────────────────────
  const { data: settings = DEFAULT_SETTINGS } = useQuery({
    queryKey: ['settings'],
    queryFn: async (): Promise<AppSettings> => {
      try {
        const doc = await databases.getDocument(DATABASE_ID, SETTINGS_COLLECTION_ID, SETTINGS_DOC_ID);
        return docToSettings(doc);
      } catch {
        // Document doesn't exist yet — create it with defaults
        try {
          const doc = await databases.createDocument(
            DATABASE_ID,
            SETTINGS_COLLECTION_ID,
            SETTINGS_DOC_ID,
            {
              toxicLevel: DEFAULT_SETTINGS.toxicLevel,
              showSubtasks: DEFAULT_SETTINGS.showSubtasks,
              hapticFeedback: DEFAULT_SETTINGS.hapticFeedback,
              dailyRecapEnabled: DEFAULT_SETTINGS.dailyRecapEnabled,
              theme: DEFAULT_SETTINGS.theme,
              userId: '',
            }
          );
          return docToSettings(doc);
        } catch (e) {
          console.error('[TaskProvider] Failed to create settings:', e);
        }
      }
      return DEFAULT_SETTINGS;
    },
  });

  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    const newSettings = { ...settings, ...updates };
    try {
      await databases.updateDocument(DATABASE_ID, SETTINGS_COLLECTION_ID, SETTINGS_DOC_ID, {
        toxicLevel: newSettings.toxicLevel,
        showSubtasks: newSettings.showSubtasks,
        hapticFeedback: newSettings.hapticFeedback,
        dailyRecapEnabled: newSettings.dailyRecapEnabled,
        theme: newSettings.theme,
      });
    } catch {
      // If update fails try create
      try {
        await databases.createDocument(DATABASE_ID, SETTINGS_COLLECTION_ID, SETTINGS_DOC_ID, {
          ...newSettings,
          userId: '',
        });
      } catch (e) {
        console.error('[TaskProvider] Failed to save settings:', e);
      }
    }
    queryClient.setQueryData(['settings'], newSettings);
  }, [settings, queryClient]);

  // ── Tasks ───────────────────────────────────────────────────────────────
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', todayKey],
    queryFn: async (): Promise<Task[]> => {
      try {
        const res = await databases.listDocuments(DATABASE_ID, TASKS_COLLECTION_ID, [
          Query.equal('dateKey', todayKey),
          Query.orderAsc('order'),
          Query.limit(100),
        ]);
        return res.documents.map(docToTask);
      } catch (e) {
        console.error('[TaskProvider] Failed to load tasks:', e);
        return [];
      }
    },
  });

  const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'createdAt' | 'order'>) => {
    const newTask: Task = {
      ...taskData,
      id: ID.unique(),
      createdAt: new Date().toISOString(),
      order: tasks.length,
    };
    try {
      const doc = await databases.createDocument(
        DATABASE_ID,
        TASKS_COLLECTION_ID,
        newTask.id,
        taskToDoc(newTask, todayKey)
      );
      const saved = docToTask(doc);
      queryClient.setQueryData(['tasks', todayKey], [...tasks, saved]);
    } catch (e) {
      console.error('[TaskProvider] Failed to add task:', e);
    }
  }, [tasks, todayKey, queryClient]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const updated = { ...task, ...updates };
    try {
      await databases.updateDocument(DATABASE_ID, TASKS_COLLECTION_ID, taskId, taskToDoc(updated, todayKey));
      queryClient.setQueryData(['tasks', todayKey], tasks.map(t => t.id === taskId ? updated : t));
    } catch (e) {
      console.error('[TaskProvider] Failed to update task:', e);
    }
  }, [tasks, todayKey, queryClient]);

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      await databases.deleteDocument(DATABASE_ID, TASKS_COLLECTION_ID, taskId);
      queryClient.setQueryData(['tasks', todayKey], tasks.filter(t => t.id !== taskId));
    } catch (e) {
      console.error('[TaskProvider] Failed to delete task:', e);
    }
  }, [tasks, todayKey, queryClient]);

  const toggleTask = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const completed = !task.completed;
    await updateTask(taskId, { completed, completedAt: completed ? new Date().toISOString() : undefined });
    const updated = tasks.map(t => t.id === taskId ? { ...t, completed } : t);
    const allDone = updated.every(t => t.completed);
    if (completed) {
      if (allDone) setLastMessage(getRandomMessage(ALL_DONE_MESSAGES[settings.toxicLevel]));
      else setLastMessage(getRandomMessage(TASK_COMPLETE_MESSAGES[settings.toxicLevel]));
    }
  }, [tasks, settings.toxicLevel, updateTask]);

  const toggleSubtask = useCallback(async (taskId: string, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const subtasks = task.subtasks.map(s =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    await updateTask(taskId, { subtasks });
  }, [tasks, updateTask]);

  const clearDay = useCallback(async () => {
    try {
      await Promise.all(tasks.map(t => databases.deleteDocument(DATABASE_ID, TASKS_COLLECTION_ID, t.id)));
    } catch (e) {
      console.error('[TaskProvider] Failed to clear day:', e);
    }
    queryClient.setQueryData(['tasks', todayKey], []);
    setLastMessage(null);
    setRecapText(null);
  }, [tasks, todayKey, queryClient]);

  // ── History ─────────────────────────────────────────────────────────────
  const { data: historyKeys = [] } = useQuery({
    queryKey: ['historyKeys'],
    queryFn: async (): Promise<string[]> => {
      try {
        const res = await databases.listDocuments(DATABASE_ID, STATS_COLLECTION_ID, [
          Query.orderDesc('date'),
          Query.limit(100),
        ]);
        return res.documents.map(d => d.date as string);
      } catch (e) {
        console.error('[TaskProvider] Failed to load history keys:', e);
        return [];
      }
    },
  });

  const { data: allStats = [] } = useQuery({
    queryKey: ['allStats'],
    queryFn: async (): Promise<DayStats[]> => {
      try {
        const res = await databases.listDocuments(DATABASE_ID, STATS_COLLECTION_ID, [
          Query.orderDesc('date'),
          Query.limit(365),
        ]);
        return res.documents.map(d => ({
          date: d.date,
          totalTasks: d.totalTasks,
          completedTasks: d.completedTasks,
          completionRate: d.completionRate,
        }));
      } catch (e) {
        console.error('[TaskProvider] Failed to load stats:', e);
        return [];
      }
    },
  });

  // ── Today stats ─────────────────────────────────────────────────────────
  const todayStats: DayStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    return {
      date: todayKey,
      totalTasks: total,
      completedTasks: completed,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [tasks, todayKey]);

  // Persist today's stats whenever tasks change
  useEffect(() => {
    if (tasks.length === 0) return;
    const upsertStats = async () => {
      const body = {
        date: todayKey,
        totalTasks: todayStats.totalTasks,
        completedTasks: todayStats.completedTasks,
        completionRate: todayStats.completionRate,
      };
      try {
        await databases.updateDocument(DATABASE_ID, STATS_COLLECTION_ID, `stats-${todayKey}`, body);
      } catch {
        try {
          await databases.createDocument(DATABASE_ID, STATS_COLLECTION_ID, `stats-${todayKey}`, body);
        } catch (e) {
          console.error('[TaskProvider] Failed to upsert stats:', e);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['allStats'] });
      queryClient.invalidateQueries({ queryKey: ['historyKeys'] });
    };
    upsertStats();
  }, [todayStats, todayKey, tasks.length]);

  // ── Streak ───────────────────────────────────────────────────────────────
  const streak = useMemo(() => {
    let count = 0;
    const sortedStats = [...allStats].sort((a, b) => b.date.localeCompare(a.date));
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const stat = sortedStats.find(s => s.date === key);
      if (i === 0 && !stat) continue;
      if (stat && stat.totalTasks > 0 && stat.completionRate > 0) count++;
      else if (i > 0) break;
    }
    return count;
  }, [allStats]);

  // ── Category stats ───────────────────────────────────────────────────────
  const categoryStats = useMemo(() => {
    const stats: Record<string, { total: number; completed: number }> = {};
    tasks.forEach(task => {
      const cat = task.category || 'other';
      if (!stats[cat]) stats[cat] = { total: 0, completed: 0 };
      stats[cat].total++;
      if (task.completed) stats[cat].completed++;
    });
    return stats;
  }, [tasks]);

  // ── Messages / AI ────────────────────────────────────────────────────────
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecapping, setIsRecapping] = useState(false);
  const [recapText, setRecapText] = useState<string | null>(null);

  const generatePlan = useCallback(async (transcript: string) => {
    setIsGenerating(true);
    try {
      const result = await generateObject({
        messages: [
          {
            role: 'user' as const,
            content: `You are a toxic motivational AI task planner. Based on the user's voice input, create a structured daily plan. Be ${settings.toxicLevel} in your quote. User said: "${transcript}"`,
          },
        ],
        schema: taskSchema,
      });
      // generateObject returns the inferred value directly
      const parsed = result as { tasks: any[]; toxicQuote: string };
      if (parsed.tasks?.length) {
        const newTasks: Task[] = parsed.tasks.map((t: any, i: number) => ({
          id: ID.unique(),
          title: t.title,
          description: t.description,
          timeSlot: t.timeSlot,
          duration: Math.round(t.duration ?? 30),
          priority: t.priority,
          category: t.category as TaskCategory,
          completed: false,
          subtasks: (t.subtasks || []).map((s: string, si: number) => ({
            id: `sub_${si}_${Date.now()}`,
            title: s,
            completed: false,
          })),
          notes: '',
          createdAt: new Date().toISOString(),
          order: tasks.length + i,
        }));
        await Promise.all(
          newTasks.map(task =>
            databases.createDocument(DATABASE_ID, TASKS_COLLECTION_ID, task.id, taskToDoc(task, todayKey))
          )
        );
        queryClient.setQueryData(['tasks', todayKey], [...tasks, ...newTasks]);
        setLastMessage(parsed.toxicQuote);
      }
    } catch (err) {
      console.error('[TaskProvider] Generate plan error:', err);
      setLastMessage(getRandomMessage(SLACKING_MESSAGES[settings.toxicLevel]));
    } finally {
      setIsGenerating(false);
    }
  }, [tasks, settings.toxicLevel, todayKey, queryClient]);

  const generateRecap = useCallback(async (taskList: Task[]) => {
    setIsRecapping(true);
    try {
      const completed = taskList.filter(t => t.completed).length;
      const total = taskList.length;
      const taskSummary = taskList.map(t => `- ${t.title}: ${t.completed ? 'DONE' : 'NOT DONE'}`).join('\n');
      // generateText accepts a plain string prompt
      const text = await generateText(
        `You are a ${settings.toxicLevel} toxic motivational AI. Give a brief end-of-day roast based on performance. ${completed}/${total} tasks done.\n\nTasks:\n${taskSummary}\n\nBe concise (2-3 sentences). Be ${settings.toxicLevel}.`
      );
      if (text) setRecapText(text);
    } catch (err) {
      console.error('[TaskProvider] Recap error:', err);
      setRecapText("Couldn't generate recap. Just like you couldn't finish your tasks.");
    } finally {
      setIsRecapping(false);
    }
  }, [settings.toxicLevel]);

  // ── History loader ───────────────────────────────────────────────────────
  const loadHistoryTasks = useCallback(async (dateKey: string): Promise<Task[]> => {
    try {
      const res = await databases.listDocuments(DATABASE_ID, TASKS_COLLECTION_ID, [
        Query.equal('dateKey', dateKey),
        Query.orderAsc('order'),
        Query.limit(100),
      ]);
      return res.documents.map(docToTask);
    } catch (e) {
      console.error('[TaskProvider] Failed to load history tasks:', e);
      return [];
    }
  }, []);

  return {
    tasks,
    isLoading,
    isGenerating,
    lastMessage,
    todayStats,
    allStats,
    streak,
    settings,
    categoryStats,
    historyKeys,
    isRecapping,
    recapText,
    generatePlan,
    generateRecap,
    toggleTask,
    toggleSubtask,
    deleteTask,
    addTask,
    updateTask,
    updateSettings,
    clearDay,
    loadHistoryTasks,
  };
}

export const [TaskProvider, useTasks] = createContextHook(useTasksProvider);
