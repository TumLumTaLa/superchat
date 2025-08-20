import { useCallback, useState } from 'react'
import { llm7Service, type LLM7Message, type LLM7StreamChunk } from '@/lib/llm7Service'

export interface LLM7ChatOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  topP?: number
  apiKey?: string
}

export interface LLM7ChatState {
  isLoading: boolean
  error: string | null
  response: string
  isStreaming: boolean
}

export interface LLM7ChatHook {
  state: LLM7ChatState
  sendMessage: (messages: LLM7Message[], options?: LLM7ChatOptions) => Promise<void>
  sendStreamingMessage: (
    messages: LLM7Message[], 
    options?: LLM7ChatOptions,
    onChunk?: (content: string) => void
  ) => Promise<void>
  clearError: () => void
  reset: () => void
}

/**
 * Custom hook for LLM7.io chat integration
 * Provides both streaming and non-streaming chat capabilities
 */
export function useLLM7Chat(): LLM7ChatHook {
  const [state, setState] = useState<LLM7ChatState>({
    isLoading: false,
    error: null,
    response: '',
    isStreaming: false
  })

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      response: '',
      isStreaming: false
    })
  }, [])

  const sendMessage = useCallback(async (
    messages: LLM7Message[], 
    options: LLM7ChatOptions = {}
  ) => {
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null, 
      response: '',
      isStreaming: false 
    }))

    try {
      // Set API key if provided
      if (options.apiKey) {
        llm7Service.setApiKey(options.apiKey)
      }

      const response = await llm7Service.createChatCompletion({
        model: options.model || 'gpt-4',
        messages,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        top_p: options.topP,
        stream: false
      })

      const content = response.choices[0]?.message?.content || ''
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        response: content 
      }))
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }))
    }
  }, [])

  const sendStreamingMessage = useCallback(async (
    messages: LLM7Message[], 
    options: LLM7ChatOptions = {},
    onChunk?: (content: string) => void
  ) => {
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null, 
      response: '',
      isStreaming: true 
    }))

    let accumulatedResponse = ''

    try {
      // Set API key if provided
      if (options.apiKey) {
        llm7Service.setApiKey(options.apiKey)
      }

      await llm7Service.createStreamingChatCompletion(
        {
          model: options.model || 'gpt-4',
          messages,
          temperature: options.temperature,
          max_tokens: options.maxTokens,
          top_p: options.topP,
          stream: true
        },
        (chunk: LLM7StreamChunk) => {
          const content = chunk.choices[0]?.delta?.content || ''
          if (content) {
            accumulatedResponse += content
            setState(prev => ({ 
              ...prev, 
              response: accumulatedResponse 
            }))
            onChunk?.(content)
          }
        },
        (error: Error) => {
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            isStreaming: false,
            error: error.message 
          }))
        },
        () => {
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            isStreaming: false 
          }))
        }
      )
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        isStreaming: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }))
    }
  }, [])

  return {
    state,
    sendMessage,
    sendStreamingMessage,
    clearError,
    reset
  }
}

/**
 * Hook for getting available LLM7 models
 */
export function useLLM7Models() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchModels = useCallback(async (apiKey?: string) => {
    setIsLoading(true)
    setError(null)

    try {
      if (apiKey) {
        llm7Service.setApiKey(apiKey)
      }

      const availableModels = await llm7Service.getModels()
      return availableModels
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch models')
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    isLoading,
    error,
    fetchModels
  }
}
