import { TaskCategory } from '@/types/task';

interface CategoryConfig {
  label: string;
  emoji: string;
  color: string;
}

export const CATEGORIES: Record<TaskCategory, CategoryConfig> = {
  work: { label: 'Work', emoji: '💼', color: '#3B82F6' },
  health: { label: 'Health', emoji: '💪', color: '#10B981' },
  personal: { label: 'Personal', emoji: '🏠', color: '#F59E0B' },
  learning: { label: 'Learning', emoji: '📚', color: '#8B5CF6' },
  errands: { label: 'Errands', emoji: '🏃', color: '#EF4444' },
  social: { label: 'Social', emoji: '👥', color: '#EC4899' },
  creative: { label: 'Creative', emoji: '🎨', color: '#06B6D4' },
  other: { label: 'Other', emoji: '📌', color: '#6B7280' },
};

export const CATEGORY_KEYS: TaskCategory[] = Object.keys(CATEGORIES) as TaskCategory[];
