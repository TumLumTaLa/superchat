import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'


import { type LLM7Message } from '@/lib/llm7Service'
import { generateTitleDebounced, getFallbackTitle } from '@/lib/titleGenerator'

// Constants for optimization
const MAX_CHAT_SESSIONS = 50 // Maximum number of sessions to keep
const AUTO_SAVE_DELAY = 1000 // Debounce delay for auto-save (ms)
const TITLE_GENERATION_DELAY = 3000 // Delay before generating AI title (ms)

export interface ChatSession {
  id: string
  title: string
  messages: LLM7Message[]
  createdAt: number
  updatedAt: number
  model: string
}



export interface Team {
  value: string
  label: string
  model: {
    provider: string
  }
  storage?: boolean
}

interface PlaygroundStore {
  hydrated: boolean
  setHydrated: () => void
  streamingErrorMessage: string
  setStreamingErrorMessage: (streamingErrorMessage: string) => void
  isStreaming: boolean
  setIsStreaming: (isStreaming: boolean) => void
  messages: LLM7Message[]
  setMessages: (
    messages:
      | LLM7Message[]
      | ((prevMessages: LLM7Message[]) => LLM7Message[])
  ) => void
  chatInputRef: React.RefObject<HTMLTextAreaElement | null>
  selectedModel: string
  setSelectedModel: (model: string) => void
  llm7ApiKey: string
  setLLM7ApiKey: (apiKey: string) => void
  temperature: number
  setTemperature: (temperature: number) => void
  availableModels: string[]
  setAvailableModels: (models: string[]) => void
  systemPrompt: string
  setSystemPrompt: (prompt: string) => void
  // Chat History
  chatSessions: ChatSession[]
  setChatSessions: (sessions: ChatSession[]) => void
  currentSessionId: string | null
  setCurrentSessionId: (sessionId: string | null) => void
  createNewSession: () => string
  saveCurrentSession: () => void
  loadSession: (sessionId: string) => void
  deleteSession: (sessionId: string) => void
  generateSessionTitle: (sessionId: string) => Promise<void>
  cleanupOldSessions: () => void
}

// Debounce timers
let autoSaveTimeout: NodeJS.Timeout | null = null

const generateSessionTitle = (messages: LLM7Message[]): string => {
  return getFallbackTitle(messages)
}

export const usePlaygroundStore = create<PlaygroundStore>()(
  persist(
    (set, get) => ({
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      streamingErrorMessage: '',
      setStreamingErrorMessage: (streamingErrorMessage) =>
        set(() => ({ streamingErrorMessage })),
      isStreaming: false,
      setIsStreaming: (isStreaming) => set(() => ({ isStreaming })),
      messages: [],
      setMessages: (messages) =>
        set((state) => ({
          messages:
            typeof messages === 'function' ? messages(state.messages) : messages
        })),
      chatInputRef: { current: null },
      selectedModel: 'deepseek-r1-0528',
      setSelectedModel: (selectedModel) => set(() => ({ selectedModel })),
      llm7ApiKey: '',
      setLLM7ApiKey: (apiKey) => set(() => ({ llm7ApiKey: apiKey })),
      temperature: 0.7,
      setTemperature: (temperature) => set(() => ({ temperature })),
      availableModels: [], // Will be loaded from API
      setAvailableModels: (models) => set(() => ({ availableModels: models })),
      systemPrompt: '',
      setSystemPrompt: (prompt) => set(() => ({ systemPrompt: prompt })),
      // Chat History
      chatSessions: [],
      setChatSessions: (sessions) => set(() => ({ chatSessions: sessions })),
      currentSessionId: null,
      setCurrentSessionId: (sessionId) => set(() => ({ currentSessionId: sessionId })),
      createNewSession: () => {
        const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
        const newSession: ChatSession = {
          id: sessionId,
          title: 'New Chat',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          model: get().selectedModel
        }

        set((state) => ({
          chatSessions: [newSession, ...state.chatSessions],
          currentSessionId: sessionId,
          messages: []
        }))

        // Cleanup old sessions if needed
        setTimeout(() => get().cleanupOldSessions(), 100)

        return sessionId
      },
      saveCurrentSession: () => {
        // Clear existing timeout
        if (autoSaveTimeout) {
          clearTimeout(autoSaveTimeout)
        }

        // Debounce auto-save
        autoSaveTimeout = setTimeout(() => {
          const state = get()
          if (!state.currentSessionId || state.messages.length === 0) return

          const sessionIndex = state.chatSessions.findIndex(s => s.id === state.currentSessionId)
          if (sessionIndex >= 0) {
            const updatedSessions = [...state.chatSessions]
            const currentSession = updatedSessions[sessionIndex]

            updatedSessions[sessionIndex] = {
              ...currentSession,
              messages: [...state.messages],
              title: currentSession.title === 'New Chat' ? generateSessionTitle(state.messages) : currentSession.title,
              updatedAt: Date.now(),
              model: state.selectedModel
            }

            set({ chatSessions: updatedSessions })

            // Generate AI title if still using default title and has enough messages
            if (currentSession.title === 'New Chat' && state.messages.length >= 2 && state.llm7ApiKey) {
              get().generateSessionTitle(state.currentSessionId)
            }
          }
        }, AUTO_SAVE_DELAY)
      },
      loadSession: (sessionId) => {
        const state = get()
        const session = state.chatSessions.find(s => s.id === sessionId)
        if (session) {
          set({
            currentSessionId: sessionId,
            messages: [...session.messages],
            selectedModel: session.model
          })
        }
      },
      deleteSession: (sessionId) => {
        const state = get()
        const updatedSessions = state.chatSessions.filter(s => s.id !== sessionId)
        const newCurrentSessionId = state.currentSessionId === sessionId ? null : state.currentSessionId

        set({
          chatSessions: updatedSessions,
          currentSessionId: newCurrentSessionId,
          messages: newCurrentSessionId ? state.messages : []
        })
      },
      generateSessionTitle: async (sessionId: string) => {
        const state = get()
        const session = state.chatSessions.find(s => s.id === sessionId)

        if (!session || !state.llm7ApiKey || session.messages.length < 2) return

        try {
          generateTitleDebounced(
            session.messages,
            state.llm7ApiKey,
            (newTitle: string) => {
              const currentState = get()
              const sessionIndex = currentState.chatSessions.findIndex(s => s.id === sessionId)

              if (sessionIndex >= 0) {
                const updatedSessions = [...currentState.chatSessions]
                updatedSessions[sessionIndex] = {
                  ...updatedSessions[sessionIndex],
                  title: newTitle
                }
                set({ chatSessions: updatedSessions })
              }
            },
            TITLE_GENERATION_DELAY
          )
        } catch (error) {
          console.warn('Failed to generate session title:', error)
        }
      },
      cleanupOldSessions: () => {
        const state = get()
        if (state.chatSessions.length > MAX_CHAT_SESSIONS) {
          // Keep the most recent sessions
          const sortedSessions = [...state.chatSessions].sort((a, b) => b.updatedAt - a.updatedAt)
          const sessionsToKeep = sortedSessions.slice(0, MAX_CHAT_SESSIONS)

          set({ chatSessions: sessionsToKeep })
        }
      }
    }),
    {
      name: 'llm7-chat-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedModel: state.selectedModel,
        llm7ApiKey: state.llm7ApiKey,
        temperature: state.temperature,
        systemPrompt: state.systemPrompt,
        chatSessions: state.chatSessions,
        currentSessionId: state.currentSessionId
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated?.()
      }
    }
  )
)
