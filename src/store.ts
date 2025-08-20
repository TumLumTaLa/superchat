import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'


import { type LLM7Message } from '@/lib/llm7Service'

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
}

const generateSessionTitle = (messages: LLM7Message[]): string => {
  const firstUserMessage = messages.find(msg => msg.role === 'user')
  if (firstUserMessage) {
    const content = firstUserMessage.content.trim()
    return content.length > 50 ? content.substring(0, 50) + '...' : content
  }
  return 'New Chat'
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

        return sessionId
      },
      saveCurrentSession: () => {
        const state = get()
        if (!state.currentSessionId || state.messages.length === 0) return

        const sessionIndex = state.chatSessions.findIndex(s => s.id === state.currentSessionId)
        if (sessionIndex >= 0) {
          const updatedSessions = [...state.chatSessions]
          updatedSessions[sessionIndex] = {
            ...updatedSessions[sessionIndex],
            messages: [...state.messages],
            title: generateSessionTitle(state.messages),
            updatedAt: Date.now(),
            model: state.selectedModel
          }
          set({ chatSessions: updatedSessions })
        }
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
