import { create } from 'zustand';

const useStore = create(
  (set, get) => ({
    // UI State
    isPanelExpanded: false,
    isSidebarOpen: true,
    voiceState: 'idle',
    isVoiceActive: false,

    // Chat State
    messages: [],
    isTyping: false,

    // Agent Tasks
    tasks: [],

    // Toasts
    toasts: [],

    // Settings state
    settings: {},
    preferences: {},

    // Actions
    togglePanel: () => set((state) => ({ isPanelExpanded: !state.isPanelExpanded })),
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    setVoiceState: (state) => set({ voiceState: state }),
    toggleVoice: () => set((state) => ({ isVoiceActive: !state.isVoiceActive })),

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

    // Settings actions
    setSettings: (settings) => set({ settings }),
    setPreferences: (preferences) => set({ preferences }),
    updateSetting: (key, value) => set((state) => ({
      settings: { ...state.settings, [key]: value }
    })),
    updatePreference: (key, value) => set((state) => ({
      preferences: { ...state.preferences, [key]: value }
    })),
  })
);

export default useStore;
