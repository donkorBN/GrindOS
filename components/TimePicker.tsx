import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ScrollView,
} from 'react-native';
import { Clock, Check } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';

interface TimePickerProps {
    value: string;
    onChange: (time: string) => void;
    placeholder?: string;
}

function parseTime(timeStr: string): { hour: number; minute: number; period: 'AM' | 'PM' } {
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
        return {
            hour: parseInt(match[1]),
            minute: parseInt(match[2]),
            period: match[3].toUpperCase() as 'AM' | 'PM',
        };
    }
    return { hour: 9, minute: 0, period: 'AM' };
}

function formatTime(hour: number, minute: number, period: 'AM' | 'PM'): string {
    return `${hour}:${String(minute).padStart(2, '0')} ${period}`;
}

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export default function TimePicker({ value, onChange, placeholder = 'Select time' }: TimePickerProps) {
    const colors = useThemeColors();
    const [showPicker, setShowPicker] = useState(false);

    const parsed = useMemo(() => parseTime(value), [value]);
    const [selectedHour, setSelectedHour] = useState(parsed.hour);
    const [selectedMinute, setSelectedMinute] = useState(parsed.minute);
    const [selectedPeriod, setSelectedPeriod] = useState(parsed.period);

    const handleOpen = useCallback(() => {
        const p = parseTime(value);
        setSelectedHour(p.hour);
        setSelectedMinute(p.minute);
        setSelectedPeriod(p.period);
        setShowPicker(true);
    }, [value]);

    const handleConfirm = useCallback(() => {
        onChange(formatTime(selectedHour, selectedMinute, selectedPeriod));
        setShowPicker(false);
    }, [selectedHour, selectedMinute, selectedPeriod, onChange]);

    const hasValue = value && value.trim().length > 0;

    return (
        <>
            <TouchableOpacity
                style={[styles.trigger, { backgroundColor: colors.surfaceLight, borderColor: colors.surfaceBorder }]}
                onPress={handleOpen}
                activeOpacity={0.7}
            >
                <Clock size={16} color={hasValue ? colors.textSecondary : colors.textMuted} />
                <Text style={[styles.triggerText, { color: hasValue ? colors.text : colors.textMuted }]}>
                    {hasValue ? value : placeholder}
                </Text>
            </TouchableOpacity>

            <Modal visible={showPicker} transparent animationType="fade">
                <View style={styles.overlay}>
                    <View style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
                        <Text style={[styles.pickerTitle, { color: colors.text }]}>Select Time</Text>

                        <View style={styles.pickerBody}>
                            {/* Hours */}
                            <View style={styles.column}>
                                <Text style={[styles.columnLabel, { color: colors.textMuted }]}>HOUR</Text>
                                <ScrollView
                                    style={styles.scrollCol}
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={styles.scrollContent}
                                >
                                    {HOURS.map(h => (
                                        <TouchableOpacity
                                            key={h}
                                            style={[
                                                styles.cell,
                                                { borderColor: 'transparent' },
                                                selectedHour === h && { backgroundColor: colors.toxic + '20', borderColor: colors.toxic, borderWidth: 1 },
                                            ]}
                                            onPress={() => setSelectedHour(h)}
                                        >
                                            <Text style={[
                                                styles.cellText,
                                                { color: colors.textSecondary },
                                                selectedHour === h && { color: colors.toxic, fontWeight: '700' as const },
                                            ]}>
                                                {h}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Minutes */}
                            <View style={styles.column}>
                                <Text style={[styles.columnLabel, { color: colors.textMuted }]}>MIN</Text>
                                <ScrollView
                                    style={styles.scrollCol}
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={styles.scrollContent}
                                >
                                    {MINUTES.map(m => (
                                        <TouchableOpacity
                                            key={m}
                                            style={[
                                                styles.cell,
                                                { borderColor: 'transparent' },
                                                selectedMinute === m && { backgroundColor: colors.toxic + '20', borderColor: colors.toxic, borderWidth: 1 },
                                            ]}
                                            onPress={() => setSelectedMinute(m)}
                                        >
                                            <Text style={[
                                                styles.cellText,
                                                { color: colors.textSecondary },
                                                selectedMinute === m && { color: colors.toxic, fontWeight: '700' as const },
                                            ]}>
                                                {String(m).padStart(2, '0')}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* AM/PM */}
                            <View style={styles.column}>
                                <Text style={[styles.columnLabel, { color: colors.textMuted }]}>  </Text>
                                <View style={styles.periodCol}>
                                    {(['AM', 'PM'] as const).map(p => (
                                        <TouchableOpacity
                                            key={p}
                                            style={[
                                                styles.periodCell,
                                                { backgroundColor: colors.surfaceLight, borderColor: colors.surfaceBorder },
                                                selectedPeriod === p && { backgroundColor: colors.toxic + '20', borderColor: colors.toxic },
                                            ]}
                                            onPress={() => setSelectedPeriod(p)}
                                        >
                                            <Text style={[
                                                styles.periodText,
                                                { color: colors.textSecondary },
                                                selectedPeriod === p && { color: colors.toxic, fontWeight: '700' as const },
                                            ]}>
                                                {p}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>

                        <Text style={[styles.preview, { color: colors.text }]}>
                            {formatTime(selectedHour, selectedMinute, selectedPeriod)}
                        </Text>

                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={[styles.cancelBtn, { borderColor: colors.surfaceBorder }]}
                                onPress={() => setShowPicker(false)}
                            >
                                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmBtn, { backgroundColor: colors.toxic }]}
                                onPress={handleConfirm}
                            >
                                <Check size={16} color={colors.background} />
                                <Text style={[styles.confirmText, { color: colors.background }]}>Set Time</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    trigger: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderRadius: 10,
        padding: 12,
        borderWidth: 1,
    },
    triggerText: {
        fontSize: 15,
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerContainer: {
        borderRadius: 20,
        padding: 24,
        margin: 20,
        width: 320,
        borderWidth: 1,
    },
    pickerTitle: {
        fontSize: 18,
        fontWeight: '700' as const,
        textAlign: 'center' as const,
        marginBottom: 16,
    },
    pickerBody: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    column: {
        flex: 1,
        alignItems: 'center',
    },
    columnLabel: {
        fontSize: 10,
        fontWeight: '700' as const,
        letterSpacing: 1,
        marginBottom: 8,
    },
    scrollCol: {
        maxHeight: 200,
    },
    scrollContent: {
        paddingVertical: 4,
    },
    cell: {
        width: 52,
        height: 40,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 2,
    },
    cellText: {
        fontSize: 16,
        fontWeight: '500' as const,
    },
    periodCol: {
        gap: 8,
        paddingTop: 4,
    },
    periodCell: {
        width: 60,
        height: 44,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    periodText: {
        fontSize: 15,
        fontWeight: '600' as const,
    },
    preview: {
        fontSize: 24,
        fontWeight: '800' as const,
        textAlign: 'center' as const,
        marginBottom: 16,
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 15,
        fontWeight: '600' as const,
    },
    confirmBtn: {
        flex: 2,
        flexDirection: 'row',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    confirmText: {
        fontSize: 15,
        fontWeight: '700' as const,
    },
});
