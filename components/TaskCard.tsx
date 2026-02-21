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
import { Check, Clock, Trash2, ChevronRight, ChevronDown, CheckSquare, Square } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Task } from '@/types/task';
import { CATEGORIES } from '@/constants/categories';

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

  const cat = CATEGORIES[task.category ?? 'other'];
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const completedSubtasks = hasSubtasks ? task.subtasks.filter(s => s.completed).length : 0;
  const totalSubtasks = hasSubtasks ? task.subtasks.length : 0;

  const handleToggle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
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

  return (
    <Animated.View style={[
      styles.card,
      { backgroundColor: colors.surface, transform: [{ scale: scaleAnim }] },
      task.completed && { opacity: 0.5 },
    ]}>
      {/* Left colored indicator */}
      <View style={[styles.indicator, { backgroundColor: cat?.color || colors.textMuted }]} />

      <View style={styles.cardBody}>
        {/* ── Main row ─────────────────────────────────── */}
        <View style={styles.mainRow}>
          {/* Category icon */}
          <View style={[styles.catIcon, { backgroundColor: cat?.color || colors.textMuted }]}>
            <Text style={styles.catEmoji}>{cat?.emoji || '📌'}</Text>
          </View>

          {/* Content */}
          <TouchableOpacity
            style={styles.content}
            onPress={hasSubtasks ? handleExpand : undefined}
            onLongPress={() => onEdit?.(task)}
            activeOpacity={hasSubtasks ? 0.7 : 1}
            disabled={!hasSubtasks && !onEdit}
          >
            <Text
              style={[
                styles.title,
                { color: colors.text },
                task.completed && { textDecorationLine: 'line-through', color: colors.textMuted },
              ]}
              numberOfLines={expanded ? undefined : 1}
            >
              {task.title}
            </Text>
            <View style={styles.meta}>
              <Clock size={10} color={colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.textMuted }]}>{task.timeSlot}</Text>
              <Text style={[styles.metaText, { color: colors.textMuted }]}>· {task.duration}min</Text>
            </View>
          </TouchableOpacity>

          {/* Right side — checkbox or chevron */}
          <TouchableOpacity onPress={handleToggle} style={styles.checkHit}>
            <View style={[
              styles.checkbox,
              task.completed
                ? { backgroundColor: colors.completed, borderColor: colors.completed }
                : { borderColor: colors.textMuted },
            ]}>
              {task.completed && <Check size={12} color="#FFF" strokeWidth={3} />}
            </View>
          </TouchableOpacity>

          {hasSubtasks && (
            <TouchableOpacity onPress={handleExpand} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              {expanded
                ? <ChevronDown size={18} color={colors.textMuted} />
                : <ChevronRight size={18} color={colors.textMuted} />
              }
            </TouchableOpacity>
          )}
        </View>

        {/* Subtask progress */}
        {hasSubtasks && !expanded && (
          <View style={styles.subtaskBar}>
            <View style={[styles.progressBg, { backgroundColor: colors.surfaceLight }]}>
              <View style={[
                styles.progressFill,
                { backgroundColor: cat?.color || colors.accent, width: `${(completedSubtasks / totalSubtasks) * 100}%` },
              ]} />
            </View>
            <Text style={[styles.subtaskCount, { color: colors.textMuted }]}>
              {completedSubtasks}/{totalSubtasks}
            </Text>
          </View>
        )}

        {/* ── Expanded subtasks ────────────────────────── */}
        {expanded && hasSubtasks && (
          <View style={[styles.subtaskList, { borderTopColor: colors.surfaceBorder }]}>
            {task.subtasks.map((sub, index) => (
              <TouchableOpacity
                key={sub.id}
                style={styles.subtaskRow}
                onPress={() => handleSubtaskToggle(sub.id)}
                activeOpacity={0.6}
              >
                {sub.completed
                  ? <CheckSquare size={16} color={colors.completed} />
                  : <Square size={16} color={colors.textMuted} />
                }
                <Text
                  style={[
                    styles.subtaskText,
                    { color: colors.text },
                    sub.completed && { textDecorationLine: 'line-through', color: colors.textMuted },
                  ]}
                >
                  {sub.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

export default React.memo(TaskCard);

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    marginBottom: 8,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  indicator: {
    width: 4,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  cardBody: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  catIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catEmoji: { fontSize: 16 },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  metaText: {
    fontSize: 11,
  },
  checkHit: {
    padding: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtaskBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    marginLeft: 46,
  },
  progressBg: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  subtaskCount: {
    fontSize: 10,
    fontWeight: '600',
  },
  subtaskList: {
    borderTopWidth: 1,
    marginTop: 10,
    marginLeft: 46,
    paddingTop: 4,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  subtaskText: {
    fontSize: 13,
    flex: 1,
  },
});