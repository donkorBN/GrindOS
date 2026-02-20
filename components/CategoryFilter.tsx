import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { TaskCategory } from '@/types/task';
import { CATEGORIES, CATEGORY_KEYS } from '@/constants/categories';


interface CategoryFilterProps {
  selected: TaskCategory | null;
  onSelect: (category: TaskCategory | null) => void;
  counts: Record<string, { total: number; completed: number }>;
}


export default function CategoryFilter({ selected, onSelect, counts }: CategoryFilterProps) {
  const colors = useThemeColors();
  const totalAll = Object.values(counts).reduce((sum, c) => sum + c.total, 0);


  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      <TouchableOpacity
        style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }, !selected && { backgroundColor: colors.toxic + '20', borderColor: colors.toxic }]}
        onPress={() => onSelect(null)}
      >
        <Text style={[styles.chipText, { color: colors.textSecondary }, !selected && { color: colors.toxic }]}>
          All ({totalAll})
        </Text>
      </TouchableOpacity>
      {CATEGORY_KEYS.filter(key => counts[key]?.total > 0).map((key) => (
        <TouchableOpacity
          key={key}
          style={[
            styles.chip,
            { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
            selected === key && {
              backgroundColor: CATEGORIES[key].color + '25',
              borderColor: CATEGORIES[key].color,
            },
          ]}
          onPress={() => onSelect(selected === key ? null : key)}
        >
          <Text style={[styles.chipText, { color: colors.textSecondary }, selected === key && { color: CATEGORIES[key].color }]}>
            {CATEGORIES[key].emoji} {CATEGORIES[key].label} ({counts[key]?.total ?? 0})
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    gap: 8,
  },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
});