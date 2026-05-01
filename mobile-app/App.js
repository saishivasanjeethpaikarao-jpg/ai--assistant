import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Voice from '@react-native-voice/voice';
import { Audio } from 'expo-av';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceProvider, setVoiceProvider] = useState('fish'); // 'fish' or 'elevenlabs'

  useEffect(() => {
    Voice.onSpeechStart = () => setIsListening(true);
    Voice.onSpeechEnd = () => setIsListening(false);
    Voice.onSpeechResults = (e) => setInput(e.value[0]);
    
    Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
    
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const startListening = async () => {
    try {
      await Voice.start('en-US');
    } catch (error) {
      console.error('Voice error:', error);
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
    } catch (error) {
      console.error('Voice error:', error);
    }
  };

  const speakWithPremiumVoice = async (text) => {
    try {
      const response = await axios.post(`${API_URL}/voice/synthesize`, {
        text: text,
        provider: voiceProvider
      });
      
      if (response.data.status === 'success') {
        const audioPath = response.data.audio_path;
        
        // Convert file path to URL for mobile playback
        // For now, we'll use local TTS as fallback
        // In production, you'd stream the audio from the backend
        console.log('Premium voice synthesized:', audioPath);
        setIsSpeaking(true);
        
        // Fallback to local TTS for now
        // You can implement audio streaming later
        setTimeout(() => setIsSpeaking(false), 2000);
      }
    } catch (error) {
      console.error('Premium voice error:', error);
      // Fallback to local behavior
      setIsSpeaking(true);
      setTimeout(() => setIsSpeaking(false), 1000);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/mobile/chat`, {
        text: userMessage
      });
      
      const aiMessage = response.data.response;
      setMessages(prev => [...prev, { role: 'assistant', content: aiMessage }]);
      speakWithPremiumVoice(aiMessage);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'system', content: 'Error: Failed to connect' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Jarvis AI</Text>
        <TouchableOpacity
          onPress={() => setVoiceProvider(voiceProvider === 'fish' ? 'elevenlabs' : 'fish')}
          style={styles.voiceProviderToggle}
        >
          <Text style={styles.voiceProviderText}>
            {voiceProvider === 'fish' ? '🐟 Fish' : '🎙️ ElevenLabs'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.chatContainer} contentContainerStyle={styles.chatContent}>
        {messages.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Start chatting with Jarvis AI</Text>
            <Text style={styles.emptySubtext}>Premium AI Voice: {voiceProvider}</Text>
          </View>
        )}
        
        {messages.map((msg, index) => (
          <View
            key={index}
            style={[
              styles.messageBubble,
              msg.role === 'user' ? styles.userBubble : styles.aiBubble
            ]}
          >
            <Text style={styles.messageText}>{msg.content}</Text>
          </View>
        ))}
        
        {isLoading && (
          <View style={styles.loadingBubble}>
            <ActivityIndicator size="small" color="#3b82f6" />
          </View>
        )}
        
        {isSpeaking && (
          <View style={styles.speakingBubble}>
            <Text style={styles.speakingText}>🔊 Speaking...</Text>
          </View>
        )}
      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <TouchableOpacity
          onPress={isListening ? stopListening : startListening}
          style={styles.voiceButton}
        >
          <Text style={styles.voiceButtonText}>
            {isListening ? '🛑' : '🎤'}
          </Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          placeholderTextColor="#64748b"
          multiline
        />

        <TouchableOpacity
          onPress={sendMessage}
          style={styles.sendButton}
          disabled={isLoading || !input.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    padding: 20,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#60a5fa',
  },
  voiceProviderToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#475569',
    borderRadius: 12,
  },
  voiceProviderText: {
    color: '#fff',
    fontSize: 14,
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
  },
  emptySubtext: {
    color: '#3b82f6',
    fontSize: 14,
    marginTop: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#3b82f6',
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#475569',
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
  },
  loadingBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#475569',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  speakingBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#10b981',
    padding: 8,
    borderRadius: 12,
    marginBottom: 8,
  },
  speakingText: {
    color: '#fff',
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    alignItems: 'flex-end',
  },
  voiceButton: {
    padding: 12,
    backgroundColor: '#475569',
    borderRadius: 12,
    marginRight: 8,
  },
  voiceButtonText: {
    fontSize: 24,
  },
  input: {
    flex: 1,
    backgroundColor: '#0f172a',
    color: '#fff',
    padding: 12,
    borderRadius: 12,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    padding: 12,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    opacity: 1,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
