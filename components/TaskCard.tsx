import React, { useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Check, Clock, Trash2, Flame, ChevronDown, ChevronUp, CheckSquare, Square } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Task } from '@/types/task';
import { CATEGORIES } from '@/constants/categories';


interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (task: Task) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
}


function TaskCard({ task, onToggle, onDelete, onEdit, onToggleSubtask }: TaskCardProps) {
  const colors = useThemeColors();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [showSubtasks, setShowSubtasks] = useState(false);

  const priorityColors: Record<string, string> = {
    low: colors.textMuted,
    medium: colors.warning,
    high: '#FF6B35',
    critical: colors.danger,
  };

  const handleToggle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onToggle(task.id);
  }, [task.id, onToggle, scaleAnim]);

  const cat = CATEGORIES[task.category ?? 'other'];
  const pColor = priorityColors[task.priority] ?? colors.textMuted;

  return (
    <Animated.View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, transform: [{ scale: scaleAnim }] }, task.completed && { opacity: 0.6 }]}>
      <TouchableOpacity style={styles.cardRow} onPress={handleToggle} onLongPress={() => onEdit?.(task)} activeOpacity={0.7}>
        <View style={[styles.checkbox, { borderColor: task.completed ? colors.toxic : pColor }, task.completed && { backgroundColor: colors.toxic }]}>
          {task.completed && <Check size={12} color={colors.background} strokeWidth={3} />}
        </View>
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: colors.text }, task.completed && { textDecorationLine: 'line-through' as const, color: colors.textMuted }]} numberOfLines={2}>
            {task.title}
          </Text>
          <View style={styles.cardMeta}>
            <Text style={[styles.cardCategory, { color: colors.textMuted }]}>{cat?.emoji} {cat?.label}</Text>
            <Clock size={10} color={colors.textMuted} />
            <Text style={[styles.cardTime, { color: colors.textMuted }]}>{task.timeSlot}</Text>
            <Text style={[styles.cardDuration, { color: colors.textMuted }]}>· {task.duration}min</Text>
          </View>
          {task.subtasks.length > 0 && (
            <TouchableOpacity onPress={() => setShowSubtasks(!showSubtasks)} style={styles.subtaskToggle}>
              <Text style={[styles.subtaskCount, { color: colors.textSecondary }]}>
                {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} subtasks
              </Text>
              {showSubtasks ? <ChevronUp size={12} color={colors.textMuted} /> : <ChevronDown size={12} color={colors.textMuted} />}
            </TouchableOpacity>
          )}
          {showSubtasks && task.subtasks.map(sub => (
            <TouchableOpacity key={sub.id} style={styles.subtaskRow} onPress={() => onToggleSubtask?.(task.id, sub.id)}>
              {sub.completed ? <CheckSquare size={14} color={colors.toxic} /> : <Square size={14} color={colors.textMuted} />}
              <Text style={[styles.subtaskText, { color: colors.textSecondary }, sub.completed && { textDecorationLine: 'line-through' as const, color: colors.textMuted }]}>{sub.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity onPress={() => onDelete(task.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Trash2 size={14} color={colors.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
      <View style={[styles.priorityStrip, { backgroundColor: pColor }]} />
    </Animated.View>
  );
}

export default React.memo(TaskCard);

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  cardCategory: {
    fontSize: 11,
  },
  cardTime: {
    fontSize: 11,
  },
  cardDuration: {
    fontSize: 11,
  },
  subtaskToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  subtaskCount: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    paddingLeft: 4,
  },
  subtaskText: {
    fontSize: 13,
  },
  priorityStrip: {
    height: 3,
  },
});