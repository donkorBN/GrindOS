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
import { Mic, MicOff, Send, Keyboard, RotateCcw, CheckCircle2 } from 'lucide-react-native';
import GlowingCard from '@/components/GlowingCard';
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
  const audioRes = await fetch(uri);
  const audioBlob = await audioRes.blob();
  console.log('[AssemblyAI] Audio blob size:', audioBlob.size, 'type:', mimeType);

  const uploadRes = await fetch(`${ASSEMBLYAI_BASE}/upload`, {
    method: 'POST',
    headers: { authorization: ASSEMBLYAI_API_KEY, 'content-type': mimeType },
    body: audioBlob,
  });
  const uploadData = await uploadRes.json();
  console.log('[AssemblyAI] Upload response:', JSON.stringify(uploadData));
  const { upload_url } = uploadData;
  if (!upload_url) throw new Error(`AssemblyAI upload failed: ${JSON.stringify(uploadData)}`);

  const transcriptRes = await fetch(`${ASSEMBLYAI_BASE}/transcript`, {
    method: 'POST',
    headers: { authorization: ASSEMBLYAI_API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ audio_url: upload_url, speech_models: ['universal-2'] }),
  });
  const transcriptData = await transcriptRes.json();
  console.log('[AssemblyAI] Transcript response:', JSON.stringify(transcriptData));
  const { id } = transcriptData;
  if (!id) throw new Error(`AssemblyAI transcript failed: ${JSON.stringify(transcriptData)}`);

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

// States: idle -> recording -> pendingConfirm -> transcribing -> idle
type VoiceState = 'idle' | 'recording' | 'pendingConfirm' | 'transcribing';

export default function VoiceInput({ onTranscript, isProcessing }: VoiceInputProps) {
  const colors = useThemeColors();
  const [state, setState] = useState<VoiceState>('idle');
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Stored recording info for confirmation step
  const pendingAudioRef = useRef<{ uri: string; mimeType: string } | null>(null);
  const pendingWebBlobRef = useRef<Blob | null>(null);

  // ── expo-audio recorder (native) ──────────────────────────────────────
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  // ── web recording refs ────────────────────────────────────────────────
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ── Pulse animation while recording ──────────────────────────────────
  useEffect(() => {
    if (state === 'recording') {
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
  }, [state, pulseAnim, glowAnim]);

  // ── Native recording ─────────────────────────────────────────────────
  const startRecordingNative = useCallback(async () => {
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) return;
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setState('recording');
    } catch (err) {
      console.error('[VoiceInput] Failed to start recording:', err);
    }
  }, [recorder]);

  const stopRecordingNative = useCallback(async () => {
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
      const uri = recorder.uri;
      if (!uri) { setState('idle'); return; }
      const ext = uri.split('.').pop() || 'm4a';
      const mimeType = ext === 'm4a' ? 'audio/mp4' : `audio/${ext}`;
      pendingAudioRef.current = { uri, mimeType };
      setState('pendingConfirm');
    } catch (err) {
      console.error('[VoiceInput] Stop error:', err);
      setState('idle');
    }
  }, [recorder]);

  // ── Web recording ────────────────────────────────────────────────────
  const startRecordingWeb = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setState('recording');
    } catch (err) {
      console.error('[VoiceInput] Web recording error:', err);
    }
  }, []);

  const stopRecordingWeb = useCallback(async () => {
    if (!mediaRecorderRef.current) return;
    try {
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

      pendingWebBlobRef.current = audioBlob;
      setState('pendingConfirm');
    } catch (err) {
      console.error('[VoiceInput] Web stop error:', err);
      setState('idle');
    }
  }, []);

  // ── Confirm => transcribe ────────────────────────────────────────────
  const confirmTranscription = useCallback(async () => {
    setState('transcribing');
    try {
      if (Platform.OS === 'web') {
        const blob = pendingWebBlobRef.current;
        if (!blob) { setState('idle'); return; }

        const uploadRes = await fetch(`${ASSEMBLYAI_BASE}/upload`, {
          method: 'POST',
          headers: { authorization: ASSEMBLYAI_API_KEY, 'content-type': 'audio/webm' },
          body: blob,
        });
        const { upload_url } = await uploadRes.json();
        const transcriptRes = await fetch(`${ASSEMBLYAI_BASE}/transcript`, {
          method: 'POST',
          headers: { authorization: ASSEMBLYAI_API_KEY, 'content-type': 'application/json' },
          body: JSON.stringify({ audio_url: upload_url, speech_models: ['universal-2'] }),
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
      } else {
        const audio = pendingAudioRef.current;
        if (!audio) { setState('idle'); return; }
        const text = await transcribeWithAssemblyAI(audio.uri, audio.mimeType);
        if (text) onTranscript(text);
      }
    } catch (err) {
      console.error('[VoiceInput] Transcription error:', err);
    } finally {
      pendingAudioRef.current = null;
      pendingWebBlobRef.current = null;
      setState('idle');
    }
  }, [onTranscript]);

  // ── Discard => go back to idle ───────────────────────────────────────
  const discardRecording = useCallback(() => {
    pendingAudioRef.current = null;
    pendingWebBlobRef.current = null;
    setState('idle');
  }, []);

  // ── Re-record => start fresh ─────────────────────────────────────────
  const reRecord = useCallback(() => {
    pendingAudioRef.current = null;
    pendingWebBlobRef.current = null;
    Platform.OS === 'web' ? startRecordingWeb() : startRecordingNative();
  }, [startRecordingNative, startRecordingWeb]);

  // ── Mic button handler ───────────────────────────────────────────────
  const handleMicPress = useCallback(() => {
    if (state === 'recording') {
      Platform.OS === 'web' ? stopRecordingWeb() : stopRecordingNative();
    } else if (state === 'idle') {
      Platform.OS === 'web' ? startRecordingWeb() : startRecordingNative();
    }
  }, [state, startRecordingNative, stopRecordingNative, startRecordingWeb, stopRecordingWeb]);

  const handleTextSubmit = useCallback(() => {
    if (textInput.trim()) {
      onTranscript(textInput.trim());
      setTextInput('');
      setShowTextInput(false);
    }
  }, [textInput, onTranscript]);

  const isDisabled = isProcessing || state === 'transcribing';
  const glowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0,229,160,0.06)', 'rgba(0,229,160,0.25)'],
  });

  // ── Text input mode ──────────────────────────────────────────────────
  if (showTextInput) {
    return (
      <GlowingCard active={true}>
        <View style={[styles.textInputInner, { backgroundColor: colors.surface }]}>
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
      </GlowingCard>
    );
  }

  // ── Pending confirmation UI ──────────────────────────────────────────
  if (state === 'pendingConfirm') {
    return (
      <View style={styles.container}>
        <View style={[styles.confirmCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.confirmTitle, { color: colors.text }]}>Recording complete</Text>
          <Text style={[styles.confirmSubtitle, { color: colors.textMuted }]}>
            Send this recording for transcription?
          </Text>

          <View style={styles.confirmActions}>
            <TouchableOpacity
              style={[styles.confirmBtn, styles.discardBtn, { borderColor: colors.surfaceBorder }]}
              onPress={discardRecording}
            >
              <MicOff size={18} color={colors.textMuted} />
              <Text style={[styles.confirmBtnText, { color: colors.textMuted }]}>Discard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmBtn, styles.reRecordBtn, { borderColor: colors.warning, backgroundColor: colors.surfaceLight }]}
              onPress={reRecord}
            >
              <RotateCcw size={18} color={colors.warning} />
              <Text style={[styles.confirmBtnText, { color: colors.warning }]}>Re-record</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmBtn, styles.sendBtn, { backgroundColor: colors.toxic }]}
              onPress={confirmTranscription}
            >
              <CheckCircle2 size={18} color={colors.background} />
              <Text style={[styles.confirmBtnText, { color: colors.background }]}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ── Main recording UI ────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <Animated.View style={[styles.glowRing, { backgroundColor: glowColor }]} />

      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          style={[
            styles.micBtn,
            { backgroundColor: state === 'recording' ? colors.danger : colors.toxic },
            isDisabled && styles.micBtnDisabled,
          ]}
          onPress={handleMicPress}
          disabled={isDisabled}
          activeOpacity={0.8}
        >
          {state === 'transcribing' ? (
            <ActivityIndicator color={colors.background} size="small" />
          ) : state === 'recording' ? (
            <MicOff size={28} color={colors.background} />
          ) : (
            <Mic size={28} color={colors.background} />
          )}
        </TouchableOpacity>
      </Animated.View>

      <Text style={[styles.hint, { color: colors.textMuted }]}>
        {state === 'transcribing'
          ? 'Transcribing...'
          : isProcessing
            ? 'Generating plan...'
            : state === 'recording'
              ? 'Tap to stop recording'
              : 'Tap to speak your plans'}
      </Text>

      {state === 'idle' && !isProcessing && (
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
    shadowColor: '#00E5A0',
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
  textInputInner: {
    borderRadius: 14,
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
  // ── Confirmation card ──────────────────────────────────────
  confirmCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  confirmTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  confirmSubtitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  discardBtn: {
    borderWidth: 1,
  },
  reRecordBtn: {
    borderWidth: 1,
  },
  sendBtn: {},
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
