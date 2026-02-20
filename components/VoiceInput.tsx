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
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import { useThemeColors } from '@/hooks/useThemeColors';

const ASSEMBLYAI_API_KEY = process.env.EXPO_PUBLIC_ASSEMBLYAI_API_KEY!;
const ASSEMBLYAI_BASE = 'https://api.assemblyai.com/v2';

async function transcribeWithAssemblyAI(uri: string, mimeType: string): Promise<string> {
  // 1. Fetch audio as blob
  const audioRes = await fetch(uri);
  const audioBlob = await audioRes.blob();
  console.log('[AssemblyAI] Audio blob size:', audioBlob.size, 'type:', mimeType);

  // 2. Upload to AssemblyAI
  const uploadRes = await fetch(`${ASSEMBLYAI_BASE}/upload`, {
    method: 'POST',
    headers: {
      authorization: ASSEMBLYAI_API_KEY,
      'content-type': mimeType,
    },
    body: audioBlob,
  });
  const uploadData = await uploadRes.json();
  console.log('[AssemblyAI] Upload response:', JSON.stringify(uploadData));
  const { upload_url } = uploadData;
  if (!upload_url) throw new Error(`AssemblyAI upload failed: ${JSON.stringify(uploadData)}`);

  // 3. Request transcription
  const transcriptRes = await fetch(`${ASSEMBLYAI_BASE}/transcript`, {
    method: 'POST',
    headers: {
      authorization: ASSEMBLYAI_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ audio_url: upload_url, speech_models: ['universal-2'] }),
  });
  const transcriptData = await transcriptRes.json();
  console.log('[AssemblyAI] Transcript response:', JSON.stringify(transcriptData));
  const { id } = transcriptData;
  if (!id) throw new Error(`AssemblyAI transcript failed: ${JSON.stringify(transcriptData)}`);

  // 4. Poll until done
  while (true) {
    await new Promise(r => setTimeout(r, 1500));
    const pollRes = await fetch(`${ASSEMBLYAI_BASE}/transcript/${id}`, {
      headers: { authorization: ASSEMBLYAI_API_KEY },
    });
    const poll = await pollRes.json();
    console.log('[AssemblyAI] Poll status:', poll.status);
    if (poll.status === 'completed') return poll.text || '';
    if (poll.status === 'error') throw new Error(`AssemblyAI error: ${poll.error}`);
  }
}

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
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // ── expo-audio recorder (native) ────────────────────────────────────────
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  // ── web recording refs ───────────────────────────────────────────────────
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ── Pulse animation ──────────────────────────────────────────────────────
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
      return () => { pulse.stop(); glow.stop(); };
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }
  }, [isRecording, pulseAnim, glowAnim]);

  // ── Native recording (expo-audio) ────────────────────────────────────────
  const startRecordingNative = useCallback(async () => {
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        console.log('[VoiceInput] Permission denied');
        return;
      }

      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsRecording(true);
    } catch (err) {
      console.error('[VoiceInput] Failed to start recording:', err);
    }
  }, [recorder]);

  const stopRecordingNative = useCallback(async () => {
    try {
      setIsRecording(false);
      setIsTranscribing(true);

      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });

      const uri = recorder.uri;
      if (!uri) {
        console.error('[VoiceInput] No recording URI');
        return;
      }

      const ext = uri.split('.').pop() || 'm4a';
      const mimeType = ext === 'm4a' ? 'audio/mp4' : `audio/${ext}`;
      const text = await transcribeWithAssemblyAI(uri, mimeType);
      console.log('[VoiceInput] Transcription:', text);
      if (text) onTranscript(text);
    } catch (err) {
      console.error('[VoiceInput] Transcription error:', err);
    } finally {
      setIsTranscribing(false);
    }
  }, [recorder, onTranscript]);

  // ── Web recording ────────────────────────────────────────────────────────
  const startRecordingWeb = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('[VoiceInput] Web recording error:', err);
    }
  }, []);

  const stopRecordingWeb = useCallback(async () => {
    if (!mediaRecorderRef.current) return;
    try {
      setIsRecording(false);
      setIsTranscribing(true);

      const audioBlob: Blob = await new Promise((resolve) => {
        const chunks: Blob[] = [];
        if (!mediaRecorderRef.current) { resolve(new Blob()); return; }
        mediaRecorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
        mediaRecorderRef.current.onstop = () => resolve(new Blob(chunks, { type: 'audio/webm' }));
        mediaRecorderRef.current.stop();
      });

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }

      const uploadRes = await fetch(`${ASSEMBLYAI_BASE}/upload`, {
        method: 'POST',
        headers: { authorization: ASSEMBLYAI_API_KEY, 'content-type': 'audio/webm' },
        body: audioBlob,
      });
      const { upload_url } = await uploadRes.json();

      const transcriptRes = await fetch(`${ASSEMBLYAI_BASE}/transcript`, {
        method: 'POST',
        headers: { authorization: ASSEMBLYAI_API_KEY, 'content-type': 'application/json' },
        body: JSON.stringify({ audio_url: upload_url }),
      });
      const { id } = await transcriptRes.json();

      while (true) {
        await new Promise(r => setTimeout(r, 1500));
        const pollRes = await fetch(`${ASSEMBLYAI_BASE}/transcript/${id}`, {
          headers: { authorization: ASSEMBLYAI_API_KEY },
        });
        const poll = await pollRes.json();
        if (poll.status === 'completed') { if (poll.text) onTranscript(poll.text); break; }
        if (poll.status === 'error') throw new Error(poll.error);
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

  const isDisabled = isProcessing || isTranscribing;
  const glowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(57,255,20,0.1)', 'rgba(57,255,20,0.4)'],
  });

  if (showTextInput) {
    return (
      <View style={[styles.textInputContainer, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <TextInput
          style={[styles.textField, { color: colors.text }]}
          value={textInput}
          onChangeText={setTextInput}
          placeholder="Type your tasks for today..."
          placeholderTextColor={colors.textMuted}
          multiline
          autoFocus
        />
        <View style={styles.textActions}>
          <TouchableOpacity
            style={[styles.textActionBtn, { backgroundColor: colors.surfaceLight }]}
            onPress={() => setShowTextInput(false)}
          >
            <MicOff size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.textSendBtn, { backgroundColor: colors.toxic }]}
            onPress={handleTextSubmit}
            disabled={!textInput.trim()}
          >
            <Send size={18} color={colors.background} />
            <Text style={[styles.sendText, { color: colors.background }]}>Generate Plan</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.glowRing, { backgroundColor: glowColor }]} />

      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          style={[
            styles.micBtn,
            { backgroundColor: isRecording ? colors.danger : colors.toxic },
            isDisabled && styles.micBtnDisabled,
          ]}
          onPress={handleMicPress}
          disabled={isDisabled}
          activeOpacity={0.8}
        >
          {isTranscribing ? (
            <ActivityIndicator color={colors.background} size="small" />
          ) : isRecording ? (
            <MicOff size={28} color={colors.background} />
          ) : (
            <Mic size={28} color={colors.background} />
          )}
        </TouchableOpacity>
      </Animated.View>

      <Text style={[styles.hint, { color: colors.textMuted }]}>
        {isTranscribing
          ? 'Transcribing...'
          : isProcessing
            ? 'Generating plan...'
            : isRecording
              ? 'Tap to stop recording'
              : 'Tap to speak your plans'}
      </Text>

      {!isRecording && !isTranscribing && !isProcessing && (
        <TouchableOpacity
          style={[styles.keyboardBtn, { borderColor: colors.surfaceBorder }]}
          onPress={() => setShowTextInput(true)}
        >
          <Keyboard size={16} color={colors.textSecondary} />
          <Text style={[styles.keyboardText, { color: colors.textSecondary }]}>Type instead</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 20,
  },
  glowRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    top: 10,
  },
  micBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#39FF14',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  micBtnDisabled: {
    opacity: 0.6,
  },
  hint: {
    fontSize: 13,
    textAlign: 'center',
  },
  keyboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  keyboardText: {
    fontSize: 13,
  },
  textInputContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  textField: {
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  textActions: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  textActionBtn: {
    padding: 10,
    borderRadius: 10,
  },
  textSendBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  sendText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
