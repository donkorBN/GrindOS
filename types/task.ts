export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  timeSlot: string;
  duration: number;
  completed: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: TaskCategory;
  subtasks: SubTask[];
  notes: string;
  createdAt: string;
  completedAt?: string;
  order: number;
}

export type TaskCategory = 'work' | 'health' | 'personal' | 'learning' | 'errands' | 'social' | 'creative' | 'other';

export interface DayPlan {
  date: string;
  tasks: Task[];
  rawInput: string;
  toxicQuote: string;
}

export interface DayStats {
  date: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
}

export type ToxicLevel = 'mild' | 'spicy' | 'brutal';

export interface AppSettings {
  toxicLevel: ToxicLevel;
  showSubtasks: boolean;
  hapticFeedback: boolean;
  dailyRecapEnabled: boolean;
  theme: 'dark' | 'light';
}

export const DEFAULT_SETTINGS: AppSettings = {
  toxicLevel: 'spicy',
  showSubtasks: true,
  hapticFeedback: true,
  dailyRecapEnabled: true,
  theme: 'dark',
};
