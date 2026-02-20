import React, { useState, useCallback } from 'react';
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
import { X, Plus } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Task, TaskCategory } from '@/types/task';
import { CATEGORIES, CATEGORY_KEYS } from '@/constants/categories';
import TimePicker from '@/components/TimePicker';


interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (task: Omit<Task, 'id' | 'createdAt' | 'order'>) => void;
}


export default function AddTaskModal({ visible, onClose, onAdd }: AddTaskModalProps) {
  const colors = useThemeColors();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [duration, setDuration] = useState('30');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [category, setCategory] = useState<TaskCategory>('work');

  const PRIORITIES: Array<{ label: string; value: Task['priority']; color: string }> = [
    { label: 'Low', value: 'low', color: colors.textMuted },
    { label: 'Med', value: 'medium', color: colors.warning },
    { label: 'High', value: 'high', color: '#FF6B35' },
    { label: 'Critical', value: 'critical', color: colors.danger },
  ];

  const handleAdd = useCallback(() => {
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      description: description.trim(),
      timeSlot: timeSlot.trim() || 'Anytime',
      duration: parseInt(duration) || 30,
      priority,
      category,
      completed: false,
      subtasks: [],
      notes: '',
    });
    setTitle('');
    setDescription('');
    setTimeSlot('');
    setDuration('30');
    setPriority('medium');
    setCategory('work');
    onClose();
  }, [title, description, timeSlot, duration, priority, category, onAdd, onClose]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.modal, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Task</Text>
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
              placeholder="What needs to be done?"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Description</Text>
            <TextInput
              style={[styles.input, styles.inputMulti, { backgroundColor: colors.surfaceLight, color: colors.text, borderColor: colors.surfaceBorder }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Optional details..."
              placeholderTextColor={colors.textMuted}
              multiline
            />

            <View style={styles.row}>
              <View style={styles.halfCol}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Time</Text>
                <TimePicker
                  value={timeSlot}
                  onChange={setTimeSlot}
                  placeholder="e.g. 9:00 AM"
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
          </ScrollView>

          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.toxic }, !title.trim() && { opacity: 0.4 }]}
            onPress={handleAdd}
            disabled={!title.trim()}
          >
            <Plus size={18} color={colors.background} />
            <Text style={[styles.addBtnText, { color: colors.background }]}>Add Task</Text>
          </TouchableOpacity>
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
    maxHeight: '85%',
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 16,
  },
  addBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
});