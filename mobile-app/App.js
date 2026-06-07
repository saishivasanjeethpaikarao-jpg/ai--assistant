import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
  SafeAreaView, StatusBar as RNStatusBar, Alert, Switch
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Speech from 'expo-speech';
import Voice from '@react-native-voice/voice';
import axios from 'axios';

// Backend URL — set via EXPO_PUBLIC_API_URL in .env, or override here
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000';
// Set to false in .env to hide voice features entirely
const ENABLE_VOICE = (process.env.EXPO_PUBLIC_ENABLE_VOICE ?? 'true') !== 'false';

const COLORS = {
  bg: '#0C0C0C',
  surface: '#171717',
  border: 'rgba(255,255,255,0.08)',
  blue: '#437DFD',
  coral: '#FD5B5D',
  text: '#EFEFEF',
  muted: '#777',
  userBubble: '#437DFD',
  aiBubble: '#1E1E1E',
};

function Orb({ speaking, listening }) {
  return (
    <View style={[orbStyles.container, (speaking || listening) && orbStyles.active]}>
      <View style={orbStyles.inner}>
        <Text style={{ fontSize: 22 }}>✦</Text>
      </View>
    </View>
  );
}

const orbStyles = StyleSheet.create({
  container: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(67,125,253,0.12)',
    borderWidth: 1, borderColor: 'rgba(67,125,253,0.25)',
  },
  active: {
    backgroundColor: 'rgba(67,125,253,0.22)',
    borderColor: '#437DFD',
  },
  inner: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#437DFD',
  },
});

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connected, setConnected] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const scrollRef = useRef(null);

  // Wire up voice recognition lifecycle once on mount
  useEffect(() => {
    if (!ENABLE_VOICE) {
      setVoiceAvailable(false);
      return;
    }
    setVoiceAvailable(true);

    const onSpeechStart = () => setIsListening(true);
    const onSpeechEnd = () => setIsListening(false);
    const onSpeechResults = (e) => {
      const text = e.value?.[0];
      if (text) setInput(text);
    };
    const onSpeechError = (e) => {
      setIsListening(false);
      const code = e?.error?.code ?? 'unknown';
      if (code !== 'recognition_fail' && code !== '7') {
        // 7 / recognition_fail = no speech detected — keep quiet
        console.warn('Voice error:', code, e?.error?.message);
      }
    };

    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;

    // Clean up on unmount
    return () => {
      try {
        Voice.removeAllListeners();
        Voice.destroy().then(Voice.removeAllListeners);
      } catch (_) {}
      Speech.stop();
    };
  }, []);

  useEffect(() => {
    checkConnection();
    setMessages([{
      role: 'assistant',
      content: "Hi, I'm AIRIS. Your personal AI assistant. How can I help you today?",
      ts: Date.now(),
    }]);
  }, []);

  const checkConnection = useCallback(async () => {
    try {
      // /mobile/status is the canonical mobile health endpoint
      await axios.get(`${API_URL}/mobile/status`, { timeout: 5000 });
      setConnected(true);
    } catch {
      setConnected(false);
    }
  }, []);

  const speak = useCallback((text) => {
    if (!voiceOutputEnabled || !text) return;
    setIsSpeaking(true);
    Speech.stop();
    Speech.speak(text, {
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }, [voiceOutputEnabled]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');

    const userMsg = { role: 'user', content: text, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await axios.post(
        `${API_URL}/mobile/chat`,
        { text },
        { timeout: 30000 }
      );
      // Tolerate both response shapes: {reply} (dashboard_api) and {response} (api_server)
      const reply = res.data?.reply || res.data?.response || 'No response.';
      const aiMsg = { role: 'assistant', content: reply, ts: Date.now() };
      setMessages(prev => [...prev, aiMsg]);
      speak(reply);
    } catch (err) {
      const errMsg = err.response?.data?.error
        || err.response?.data?.detail
        || 'Could not reach AIRIS backend. Make sure it is running.';
      setMessages(prev => [...prev, { role: 'system', content: errMsg, ts: Date.now() }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [input, isLoading, speak]);

  const startListening = useCallback(async () => {
    if (!voiceAvailable || isListening) return;
    try {
      await Voice.start('en-US');
    } catch (e) {
      Alert.alert('Voice input unavailable', e?.message || 'Could not start speech recognition.');
    }
  }, [voiceAvailable, isListening]);

  const stopListening = useCallback(async () => {
    if (!isListening) return;
    try {
      await Voice.stop();
    } catch (_) {}
  }, [isListening]);

  const stopSpeaking = useCallback(() => {
    Speech.stop();
    setIsSpeaking(false);
  }, []);

  const clearChat = useCallback(() => {
    Speech.stop();
    setIsSpeaking(false);
    setMessages([{
      role: 'assistant',
      content: "Chat cleared. How can I help you?",
      ts: Date.now(),
    }]);
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Orb speaking={isLoading || isSpeaking} listening={isListening} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.headerTitle}>AIRIS</Text>
            <View style={styles.statusRow}>
              <View style={[styles.dot, {
                backgroundColor: connected === null ? '#777' : connected ? '#00C48C' : '#FD5B5D'
              }]} />
              <Text style={styles.statusText}>
                {connected === null ? 'Connecting…' : connected ? 'Connected' : 'Offline'}
              </Text>
              {isListening && <Text style={[styles.statusText, { color: COLORS.coral }]}>• Listening</Text>}
              {isSpeaking && <Text style={[styles.statusText, { color: COLORS.blue }]}>• Speaking</Text>}
            </View>
          </View>
        </View>
        <View style={styles.headerRight}>
          {ENABLE_VOICE && (
            <View style={styles.ttsRow}>
              <Text style={styles.ttsLabel}>TTS</Text>
              <Switch
                value={voiceOutputEnabled}
                onValueChange={setVoiceOutputEnabled}
                trackColor={{ false: '#333', true: COLORS.blue }}
                thumbColor="#fff"
              />
            </View>
          )}
          <TouchableOpacity onPress={clearChat} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.chat}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg, i) => (
          <View
            key={i}
            style={[
              styles.bubble,
              msg.role === 'user' && styles.userBubble,
              msg.role === 'assistant' && styles.aiBubble,
              msg.role === 'system' && styles.sysBubble,
            ]}
          >
            {msg.role === 'assistant' && (
              <View style={styles.aiHeader}>
                <Text style={styles.bubbleLabel}>AIRIS</Text>
                {voiceOutputEnabled && msg.content && (
                  <TouchableOpacity
                    onPress={isSpeaking ? stopSpeaking : () => speak(msg.content)}
                    style={styles.bubbleSpeakBtn}
                    accessibilityLabel={isSpeaking ? 'Stop speaking' : 'Read aloud'}
                  >
                    <Text style={styles.bubbleSpeakIcon}>{isSpeaking ? '■' : '▶'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            <Text style={[
              styles.bubbleText,
              msg.role === 'user' && { color: '#fff' },
              msg.role === 'system' && { color: '#FD5B5D' },
            ]}>
              {msg.content}
            </Text>
          </View>
        ))}
        {isLoading && (
          <View style={styles.aiBubble}>
            <Text style={styles.bubbleLabel}>AIRIS</Text>
            <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center', paddingVertical: 2 }}>
              <ActivityIndicator size="small" color={COLORS.blue} />
              <Text style={[styles.bubbleText, { marginLeft: 8, color: COLORS.muted }]}>Thinking…</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Message AIRIS…"
            placeholderTextColor={COLORS.muted}
            multiline
            maxLength={2000}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
          />
          {ENABLE_VOICE && voiceAvailable && (
            <TouchableOpacity
              onPress={isListening ? stopListening : startListening}
              style={[styles.voiceBtn, isListening && styles.voiceBtnActive]}
              accessibilityLabel={isListening ? 'Stop listening' : 'Start voice input'}
            >
              <Text style={styles.voiceBtnIcon}>{isListening ? '■' : '🎙'}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={sendMessage}
            style={[styles.sendBtn, (!input.trim() || isLoading) && styles.sendBtnDisabled]}
            disabled={!input.trim() || isLoading}
            accessibilityLabel="Send message"
          >
            <Text style={styles.sendBtnText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    color: COLORS.muted,
  },
  ttsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ttsLabel: {
    fontSize: 10,
    color: COLORS.muted,
    fontWeight: '600',
  },
  clearBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clearBtnText: {
    fontSize: 13,
    color: COLORS.muted,
  },
  chat: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    gap: 10,
  },
  bubble: {
    maxWidth: '82%',
    padding: 13,
    borderRadius: 16,
    marginBottom: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.userBubble,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.aiBubble,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomLeftRadius: 4,
  },
  sysBubble: {
    alignSelf: 'center',
    backgroundColor: 'rgba(253,91,93,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(253,91,93,0.25)',
    maxWidth: '90%',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  bubbleLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.blue,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  bubbleSpeakBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  bubbleSpeakIcon: {
    fontSize: 12,
    color: COLORS.muted,
  },
  bubbleText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 21,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: COLORS.text,
    fontSize: 15,
    padding: 12,
    paddingTop: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: 120,
  },
  voiceBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceBtnActive: {
    backgroundColor: COLORS.coral,
    borderColor: COLORS.coral,
  },
  voiceBtnIcon: {
    fontSize: 18,
    color: COLORS.text,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: 'rgba(67,125,253,0.3)',
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
  },
});
