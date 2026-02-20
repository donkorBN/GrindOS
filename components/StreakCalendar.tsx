import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { DayStats } from '@/types/task';


interface StreakCalendarProps {
  stats: DayStats[];
  weeks?: number;
}


export default function StreakCalendar({ stats, weeks = 12 }: StreakCalendarProps) {
  const colors = useThemeColors();

  const calendarData = useMemo(() => {
    const today = new Date();
    const totalDays = weeks * 7;
    const days: Array<{ date: string; rate: number; isToday: boolean }> = [];


    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const stat = stats.find(s => s.date === key);
      days.push({
        date: key,
        rate: stat?.completionRate ?? -1,
        isToday: i === 0,
      });
    }
    return days;
  }, [stats, weeks]);


  const weekColumns = useMemo(() => {
    const cols: Array<typeof calendarData> = [];
    for (let i = 0; i < calendarData.length; i += 7) {
      cols.push(calendarData.slice(i, i + 7));
    }
    return cols;
  }, [calendarData]);


  const getCellColor = (rate: number, isToday: boolean) => {
    if (rate < 0) return colors.surfaceBorder;
    if (rate >= 100) return colors.toxic;
    if (rate >= 75) return colors.toxic + '99';
    if (rate >= 50) return colors.warning;
    if (rate >= 25) return colors.warning + '80';
    if (rate > 0) return colors.danger + '80';
    return colors.surfaceBorder;
  };


  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      <View style={styles.grid}>
        {weekColumns.map((week, wi) => (
          <View key={wi} style={styles.weekCol}>
            {week.map((day) => (
              <View
                key={day.date}
                style={[
                  styles.cell,
                  { backgroundColor: getCellColor(day.rate, day.isToday) },
                  day.isToday && { borderWidth: 1, borderColor: colors.text },
                ]}
              />
            ))}
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        <Text style={[styles.legendText, { color: colors.textMuted }]}>Less</Text>
        <View style={[styles.legendCell, { backgroundColor: colors.surfaceBorder }]} />
        <View style={[styles.legendCell, { backgroundColor: colors.danger + '80' }]} />
        <View style={[styles.legendCell, { backgroundColor: colors.warning }]} />
        <View style={[styles.legendCell, { backgroundColor: colors.toxic + '99' }]} />
        <View style={[styles.legendCell, { backgroundColor: colors.toxic }]} />
        <Text style={[styles.legendText, { color: colors.textMuted }]}>More</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  grid: {
    flexDirection: 'row',
    gap: 3,
    justifyContent: 'center',
  },
  weekCol: {
    gap: 3,
  },
  cell: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 10,
  },
  legendCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 9,
    fontWeight: '500' as const,
  },
});