import React, { useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Check, Clock, Trash2, ChevronDown, ChevronUp, CheckSquare, Square } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Task } from '@/types/task';
import { CATEGORIES } from '@/constants/categories';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  const [expanded, setExpanded] = useState(false);

  const priorityColors: Record<string, string> = {
    low: colors.textMuted,
    medium: colors.warning,
    high: '#C07030',
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

  const handleExpand = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => !prev);
  }, []);

  const handleSubtaskToggle = useCallback((subtaskId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleSubtask?.(task.id, subtaskId);
  }, [task.id, onToggleSubtask]);

  const cat = CATEGORIES[task.category ?? 'other'];
  const pColor = priorityColors[task.priority] ?? colors.textMuted;
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const completedSubtasks = hasSubtasks ? task.subtasks.filter(s => s.completed).length : 0;
  const totalSubtasks = hasSubtasks ? task.subtasks.length : 0;

  return (
    <Animated.View style={[
      styles.card,
      { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, transform: [{ scale: scaleAnim }] },
      task.completed && { opacity: 0.6 },
    ]}>
      {/* ── Main row: checkbox + content + delete ─────────────────── */}
      <View style={styles.cardRow}>
        {/* Checkbox — only this toggles completion */}
        <TouchableOpacity onPress={handleToggle} style={styles.checkboxHit} activeOpacity={0.6}>
          <View style={[
            styles.checkbox,
            { borderColor: task.completed ? colors.toxic : pColor },
            task.completed && { backgroundColor: colors.toxic },
          ]}>
            {task.completed && <Check size={12} color={colors.background} strokeWidth={3} />}
          </View>
        </TouchableOpacity>

        {/* Content area — tapping expands subtasks */}
        <TouchableOpacity
          style={styles.cardContent}
          onPress={hasSubtasks ? handleExpand : undefined}
          onLongPress={() => onEdit?.(task)}
          activeOpacity={hasSubtasks ? 0.7 : 1}
          disabled={!hasSubtasks}
        >
          <Text
            style={[
              styles.cardTitle,
              { color: colors.text },
              task.completed && { textDecorationLine: 'line-through' as const, color: colors.textMuted },
            ]}
            numberOfLines={expanded ? undefined : 2}
          >
            {task.title}
          </Text>

          <View style={styles.cardMeta}>
            <Text style={[styles.cardCategory, { color: colors.textMuted }]}>{cat?.emoji} {cat?.label}</Text>
            <Clock size={10} color={colors.textMuted} />
            <Text style={[styles.cardTime, { color: colors.textMuted }]}>{task.timeSlot}</Text>
            <Text style={[styles.cardDuration, { color: colors.textMuted }]}>· {task.duration}min</Text>
          </View>

          {/* Subtask summary bar */}
          {hasSubtasks && (
            <View style={styles.subtaskSummary}>
              {/* Progress bar */}
              <View style={[styles.subtaskProgressBg, { backgroundColor: colors.surfaceLight }]}>
                <View style={[
                  styles.subtaskProgressFill,
                  { backgroundColor: colors.toxic, width: `${(completedSubtasks / totalSubtasks) * 100}%` },
                ]} />
              </View>
              <Text style={[styles.subtaskCount, { color: colors.textSecondary }]}>
                {completedSubtasks}/{totalSubtasks}
              </Text>
              {expanded
                ? <ChevronUp size={14} color={colors.textMuted} />
                : <ChevronDown size={14} color={colors.textMuted} />
              }
            </View>
          )}
        </TouchableOpacity>

        {/* Delete button */}
        <TouchableOpacity onPress={() => onDelete(task.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Trash2 size={14} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* ── Expanded subtask list ─────────────────────────────────── */}
      {expanded && hasSubtasks && (
        <View style={[styles.subtaskList, { borderTopColor: colors.surfaceBorder }]}>
          {task.subtasks.map((sub, index) => (
            <TouchableOpacity
              key={sub.id}
              style={[
                styles.subtaskRow,
                index < task.subtasks.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.surfaceBorder },
              ]}
              onPress={() => handleSubtaskToggle(sub.id)}
              activeOpacity={0.6}
            >
              {sub.completed
                ? <CheckSquare size={18} color={colors.toxic} />
                : <Square size={18} color={colors.textMuted} />
              }
              <Text
                style={[
                  styles.subtaskText,
                  { color: colors.text },
                  sub.completed && { textDecorationLine: 'line-through' as const, color: colors.textMuted },
                ]}
              >
                {sub.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Priority strip */}
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
  checkboxHit: {
    padding: 4,
    marginTop: -2,
    marginLeft: -4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
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
  subtaskSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  subtaskProgressBg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  subtaskProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  subtaskCount: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  subtaskList: {
    borderTopWidth: 1,
    marginHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 8,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  subtaskText: {
    fontSize: 14,
    flex: 1,
  },
  priorityStrip: {
    height: 3,
  },
});