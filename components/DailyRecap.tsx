import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { Skull, Sparkles } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';


interface DailyRecapProps {
  recapText: string | null;
  isLoading: boolean;
  onGenerate: () => void;
  hasEnoughTasks: boolean;
}


export default function DailyRecap({ recapText, isLoading, onGenerate, hasEnoughTasks }: DailyRecapProps) {
  const colors = useThemeColors();
  const fadeAnim = useRef(new Animated.Value(0)).current;


  useEffect(() => {
    if (recapText) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [recapText, fadeAnim]);


  if (!hasEnoughTasks) return null;


  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      <View style={styles.headerRow}>
        <Skull size={18} color={colors.danger} />
        <Text style={[styles.title, { color: colors.text }]}>Daily Roast</Text>
      </View>


      {recapText ? (
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={[styles.recapText, { color: colors.textSecondary }]}>{recapText}</Text>
        </Animated.View>
      ) : (
        <TouchableOpacity
          style={[styles.generateBtn, { backgroundColor: colors.dangerDim, borderColor: colors.danger + '30' }]}
          onPress={onGenerate}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.danger} />
          ) : (
            <>
              <Sparkles size={16} color={colors.danger} />
              <Text style={[styles.generateText, { color: colors.danger }]}>Generate Roast</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  recapText: {
    fontSize: 13,
    lineHeight: 20,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  generateText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
});