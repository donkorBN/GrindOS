import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Save, Plus, Trash2, CheckSquare, Square } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Task, TaskCategory, SubTask } from '@/types/task';
import { CATEGORIES, CATEGORY_KEYS } from '@/constants/categories';
import TimePicker from '@/components/TimePicker';


interface EditTaskModalProps {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
  onSave: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
}


export default function EditTaskModal({ visible, task, onClose, onSave, onDelete }: EditTaskModalProps) {
  const colors = useThemeColors();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [duration, setDuration] = useState('30');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [category, setCategory] = useState<TaskCategory>('work');
  const [notes, setNotes] = useState('');
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newSubtask, setNewSubtask] = useState('');

  const PRIORITIES: Array<{ label: string; value: Task['priority']; color: string }> = [
    { label: 'Low', value: 'low', color: colors.textMuted },
    { label: 'Med', value: 'medium', color: colors.warning },
    { label: 'High', value: 'high', color: '#FF8C42' },
    { label: 'Critical', value: 'critical', color: colors.danger },
  ];

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setTimeSlot(task.timeSlot);
      setDuration(String(task.duration));
      setPriority(task.priority);
      setCategory(task.category);
      setNotes(task.notes || '');
      setSubtasks(task.subtasks || []);
    }
  }, [task]);

  const handleSave = useCallback(() => {
    if (!task || !title.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSave(task.id, {
      title: title.trim(),
      description: description.trim(),
      timeSlot: timeSlot.trim() || 'Anytime',
      duration: parseInt(duration) || 30,
      priority,
      category,
      notes: notes.trim(),
      subtasks,
    });
    onClose();
  }, [task, title, description, timeSlot, duration, priority, category, notes, subtasks, onSave, onClose]);

  const handleDelete = useCallback(() => {
    if (!task) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onDelete(task.id);
    onClose();
  }, [task, onDelete, onClose]);

  const addSubtask = useCallback(() => {
    if (!newSubtask.trim()) return;
    setSubtasks(prev => [...prev, { id: Date.now().toString(), title: newSubtask.trim(), completed: false }]);
    setNewSubtask('');
  }, [newSubtask]);

  const toggleSubtask = useCallback((id: string) => {
    setSubtasks(prev => prev.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
  }, []);

  const removeSubtask = useCallback((id: string) => {
    setSubtasks(prev => prev.filter(s => s.id !== id));
  }, []);

  if (!task) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.modal, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Task</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Title</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceLight, color: colors.text, borderColor: colors.surfaceBorder }]}
              value={title}
              onChangeText={setTitle}
              placeholderTextColor={colors.textMuted}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Description</Text>
            <TextInput
              style={[styles.input, styles.inputMulti, { backgroundColor: colors.surfaceLight, color: colors.text, borderColor: colors.surfaceBorder }]}
              value={description}
              onChangeText={setDescription}
              multiline
              placeholderTextColor={colors.textMuted}
            />

            <View style={styles.row}>
              <View style={styles.halfCol}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Time</Text>
                <TimePicker
                  value={timeSlot}
                  onChange={setTimeSlot}
                />
              </View>
              <View style={styles.halfCol}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Duration (min)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceLight, color: colors.text, borderColor: colors.surfaceBorder }]}
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="numeric"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Priority</Text>
            <View style={styles.chipRow}>
              {PRIORITIES.map((p) => (
                <TouchableOpacity
                  key={p.value}
                  style={[styles.chip, { borderColor: colors.surfaceBorder }, priority === p.value && { backgroundColor: p.color + '20', borderColor: p.color }]}
                  onPress={() => setPriority(p.value)}
                >
                  <Text style={[styles.chipText, { color: colors.textSecondary }, priority === p.value && { color: p.color }]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
            <View style={styles.chipRow}>
              {CATEGORY_KEYS.map((key) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.chip, { borderColor: colors.surfaceBorder }, category === key && { backgroundColor: CATEGORIES[key].color + '20', borderColor: CATEGORIES[key].color }]}
                  onPress={() => setCategory(key)}
                >
                  <Text style={[styles.chipText, { color: colors.textSecondary }, category === key && { color: CATEGORIES[key].color }]}>
                    {CATEGORIES[key].emoji} {CATEGORIES[key].label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Notes</Text>
            <TextInput
              style={[styles.input, styles.inputMulti, { backgroundColor: colors.surfaceLight, color: colors.text, borderColor: colors.surfaceBorder }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any notes..."
              placeholderTextColor={colors.textMuted}
              multiline
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Subtasks</Text>
            {subtasks.map((sub) => (
              <View key={sub.id} style={styles.subtaskRow}>
                <TouchableOpacity onPress={() => toggleSubtask(sub.id)}>
                  {sub.completed ? <CheckSquare size={16} color={colors.toxic} /> : <Square size={16} color={colors.textMuted} />}
                </TouchableOpacity>
                <Text style={[styles.subtaskText, { color: colors.text }, sub.completed && { textDecorationLine: 'line-through' as const, color: colors.textMuted }]}>{sub.title}</Text>
                <TouchableOpacity onPress={() => removeSubtask(sub.id)}>
                  <Trash2 size={14} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.addSubRow}>
              <TextInput
                style={[styles.subInput, { backgroundColor: colors.surfaceLight, color: colors.text, borderColor: colors.surfaceBorder }]}
                value={newSubtask}
                onChangeText={setNewSubtask}
                placeholder="Add subtask..."
                placeholderTextColor={colors.textMuted}
                onSubmitEditing={addSubtask}
              />
              <TouchableOpacity style={[styles.addSubBtn, { backgroundColor: colors.toxic + '20' }]} onPress={addSubtask}>
                <Plus size={16} color={colors.toxic} />
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.footerBtns}>
            <TouchableOpacity style={[styles.deleteBtn, { backgroundColor: colors.dangerDim }]} onPress={handleDelete}>
              <Trash2 size={16} color={colors.danger} />
              <Text style={[styles.deleteBtnText, { color: colors.danger }]}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.toxic }, !title.trim() && { opacity: 0.4 }]}
              onPress={handleSave}
              disabled={!title.trim()}
            >
              <Save size={16} color={colors.background} />
              <Text style={[styles.saveBtnText, { color: colors.background }]}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
  },
  inputMulti: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfCol: {
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  subtaskText: {
    flex: 1,
    fontSize: 14,
  },
  addSubRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  subInput: {
    flex: 1,
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    borderWidth: 1,
  },
  addSubBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBtns: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
  },
  deleteBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
});