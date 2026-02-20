import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Mic, MicOff, Send, Keyboard } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { useThemeColors } from '@/hooks/useThemeColors';

const STT_URL = 'https://toolkit.rork.com/stt/transcribe/';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  isProcessing: boolean;
}

export default function VoiceInput({ onTranscript, isProcessing }: VoiceInputProps) {
  const colors = useThemeColors();
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [recordingObj, setRecordingObj] = useState<Audio.Recording | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0, duration: 800, useNativeDriver: false }),
        ])
      );
      pulse.start();
      glow.start();
      return () => {
        pulse.stop();
        glow.stop();
      };
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }
  }, [isRecording, pulseAnim, glowAnim]);

  const startRecordingNative = useCallback(async () => {
    try {
      console.log('[VoiceInput] Requesting permissions...');
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        console.log('[VoiceInput] Permission denied');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: 3,
          audioEncoder: 3,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          outputFormat: 6,
          audioQuality: 127,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {},
      });
      await recording.startAsync();
      setRecordingObj(recording);
      setIsRecording(true);
      console.log('[VoiceInput] Recording started (native)');
    } catch (err) {
      console.error('[VoiceInput] Failed to start recording:', err);
    }
  }, []);

  const stopRecordingNative = useCallback(async () => {
    if (!recordingObj) return;
    try {
      console.log('[VoiceInput] Stopping recording (native)...');
      setIsRecording(false);
      setIsTranscribing(true);

      await recordingObj.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recordingObj.getURI();
      setRecordingObj(null);

      if (!uri) {
        console.error('[VoiceInput] No recording URI');
        setIsTranscribing(false);
        return;
      }

      const uriParts = uri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      const audioFile = {
        uri,
        name: 'recording.' + fileType,
        type: 'audio/' + fileType,
      };

      const formData = new FormData();
      formData.append('audio', audioFile as unknown as Blob);

      const response = await fetch(STT_URL, { method: 'POST', body: formData });
      const result = await response.json();
      console.log('[VoiceInput] Transcription:', result.text);

      if (result.text) {
        onTranscript(result.text);
      }
    } catch (err) {
      console.error('[VoiceInput] Transcription error:', err);
    } finally {
      setIsTranscribing(false);
    }
  }, [recordingObj, onTranscript]);

  const startRecordingWeb = useCallback(async () => {
    try {
      console.log('[VoiceInput] Starting web recording...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      console.log('[VoiceInput] Web recording started');
    } catch (err) {
      console.error('[VoiceInput] Web recording error:', err);
    }
  }, []);

  const stopRecordingWeb = useCallback(async () => {
    if (!mediaRecorderRef.current) return;
    try {
      setIsRecording(false);
      setIsTranscribing(true);

      await new Promise<void>((resolve) => {
        if (!mediaRecorderRef.current) { resolve(); return; }
        mediaRecorderRef.current.onstop = () => resolve();
        mediaRecorderRef.current.stop();
      });

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch(STT_URL, { method: 'POST', body: formData });
      const result = await response.json();
      console.log('[VoiceInput] Web transcription:', result.text);

      if (result.text) {
        onTranscript(result.text);
      }
    } catch (err) {
      console.error('[VoiceInput] Web transcription error:', err);
    } finally {
      setIsTranscribing(false);
    }
  }, [onTranscript]);

  const handleMicPress = useCallback(() => {
    if (isRecording) {
      Platform.OS === 'web' ? stopRecordingWeb() : stopRecordingNative();
    } else {
      Platform.OS === 'web' ? startRecordingWeb() : startRecordingNative();
    }
  }, [isRecording, startRecordingNative, stopRecordingNative, startRecordingWeb, stopRecordingWeb]);

  const handleTextSubmit = useCallback(() => {
    if (textInput.trim()) {
      onTranscript(textInput.trim());
      setTextInput('');
      setShowTextInput(false);
    }
  }, [textInput, onTranscript]);

  const busy = isTranscribing || isProcessing;

  if (showTextInput) {
    return (
      <View style={[styles.textInputContainer, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <TextInput
          style={[styles.textInput, { color: colors.text }]}
          placeholder="Type your plans for today..."
          placeholderTextColor={colors.textMuted}
          value={textInput}
          onChangeText={setTextInput}
          multiline
          autoFocus
          testID="text-input"
        />
        <View style={styles.textInputActions}>
          <TouchableOpacity
            style={styles.textActionBtn}
            onPress={() => setShowTextInput(false)}
          >
            <Mic size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: colors.toxic }, !textInput.trim() && styles.sendBtnDisabled]}
            onPress={handleTextSubmit}
            disabled={!textInput.trim() || busy}
          >
            {busy ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Send size={18} color={colors.background} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.micRow}>
        <Animated.View
          style={[
            styles.micOuter,
            {
              transform: [{ scale: pulseAnim }],
              shadowColor: isRecording ? colors.toxic : 'transparent',
              shadowOpacity: isRecording ? 0.6 : 0,
              shadowRadius: isRecording ? 20 : 0,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.micButton,
              { backgroundColor: colors.surface, borderColor: colors.toxic },
              isRecording && { backgroundColor: colors.toxic, borderColor: colors.toxic },
              busy && { borderColor: colors.textMuted, opacity: 0.7 },
            ]}
            onPress={handleMicPress}
            disabled={busy}
            activeOpacity={0.7}
            testID="mic-button"
          >
            {busy ? (
              <ActivityIndicator size="large" color={colors.toxic} />
            ) : isRecording ? (
              <MicOff size={32} color={colors.background} />
            ) : (
              <Mic size={32} color={colors.toxic} />
            )}
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity
          style={[styles.keyboardBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
          onPress={() => setShowTextInput(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Keyboard size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.hint, { color: colors.textMuted }]}>
        {busy ? 'Processing...' : isRecording ? 'Listening... Tap to stop' : 'Tap to speak your plans'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  micRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  micOuter: {
    borderRadius: 50,
    elevation: 10,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    fontSize: 13,
    marginTop: 12,
    letterSpacing: 0.5,
  },
  textInputContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginHorizontal: 4,
  },
  textInput: {
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  textInputActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  textActionBtn: {
    padding: 8,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
