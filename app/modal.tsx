import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function ModalScreen() {
  const colors = useThemeColors();
  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={() => router.back()} />
      <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <Text style={[styles.title, { color: colors.text }]}>Info</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Speak your plans into the mic. The AI will structure your day.
          No excuses. Get it done.
        </Text>
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: colors.toxic }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.closeButtonText, { color: colors.background }]}>Got It</Text>
        </TouchableOpacity>
      </View>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    margin: 20,
    alignItems: 'center',
    minWidth: 300,
    borderWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  description: {
    textAlign: 'center' as const,
    marginBottom: 24,
    lineHeight: 22,
    fontSize: 14,
  },
  closeButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 100,
  },
  closeButtonText: {
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
});
