import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set, get) => ({
      // UI State
      isPanelExpanded: false,
      isSidebarOpen: true,
      voiceState: 'idle', // idle, listening, thinking, speaking
      isVoiceActive: false,

      // Chat State
      messages: [],
      isTyping: false,

      // Agent Tasks
      tasks: [],

      // Toasts
      toasts: [],

      // Settings (persisted)
      groqApiKey: '',
      groqModel: 'llama-3.3-70b-versatile',
      ollamaUrl: 'http://localhost:11434',
      ollamaModel: 'llama3.2',
      ollamaEnabled: true,
      systemPrompt: '',
      wakeWord: '',
      language: 'en',
      theme: 'dark',

      // Actions
      togglePanel: () => set((state) => ({ isPanelExpanded: !state.isPanelExpanded })),
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setVoiceState: (state) => set({ voiceState: state }),
      toggleVoice: () => set((state) => ({ isVoiceActive: !state.isVoiceActive })),

      // Settings actions
      setGroqApiKey: (key) => set({ groqApiKey: key }),
      setGroqModel: (model) => set({ groqModel: model }),
      setOllamaUrl: (url) => set({ ollamaUrl: url }),
      setOllamaModel: (model) => set({ ollamaModel: model }),
      setOllamaEnabled: (enabled) => set({ ollamaEnabled: enabled }),
      setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),
      setWakeWord: (word) => set({ wakeWord: word }),
      setLanguage: (lang) => set({ language: lang }),
      setTheme: (theme) => set({ theme }),

      addMessage: (message) => set((state) => ({
        messages: [...state.messages, message]
      })),

      setTyping: (isTyping) => set({ isTyping }),

      addTask: (task) => set((state) => ({
        tasks: [...state.tasks, task]
      })),

      updateTask: (index, updates) => set((state) => ({
        tasks: state.tasks.map((task, i) =>
          i === index ? { ...task, ...updates } : task
        )
      })),

      clearTasks: () => set({ tasks: [] }),

      addToast: (toast) => set((state) => ({
        toasts: [...state.toasts, { ...toast, id: Date.now() }]
      })),

      removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter((toast) => toast.id !== id)
      })),
    }),
    {
      name: 'airis-storage', // key in localStorage
      partialize: (state) => ({
        // Only persist settings, not UI/chat state
        groqApiKey: state.groqApiKey,
        groqModel: state.groqModel,
        ollamaUrl: state.ollamaUrl,
        ollamaModel: state.ollamaModel,
        ollamaEnabled: state.ollamaEnabled,
        systemPrompt: state.systemPrompt,
        wakeWord: state.wakeWord,
        language: state.language,
        theme: state.theme,
        isSidebarOpen: state.isSidebarOpen,
      }),
    }
  )
);

export default useStore;
