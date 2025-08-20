/**
 * LLM7.io API Service
 * Provides integration with llm7.io API using OpenAI-compatible format
 */

export interface LLM7Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLM7ChatRequest {
  model: string
  messages: LLM7Message[]
  stream?: boolean
  temperature?: number
  max_tokens?: number
  top_p?: number
}

export interface LLM7ChatResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string | null
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface LLM7StreamChunk {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    delta: {
      role?: string
      content?: string
    }
    finish_reason: string | null
  }>
}

export class LLM7Service {
  private baseUrl = 'https://api.llm7.io/v1'
  private apiKey: string

  constructor(apiKey: string = 'unused') {
    this.apiKey = apiKey
  }

  /**
   * Send a chat completion request to LLM7.io
   */
  async createChatCompletion(request: LLM7ChatRequest): Promise<LLM7ChatResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        ...request,
        stream: false
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`LLM7 API Error: ${response.status} - ${errorData.error?.message || response.statusText}`)
    }

    return response.json()
  }

  /**
   * Create a streaming chat completion
   */
  async createStreamingChatCompletion(
    request: LLM7ChatRequest,
    onChunk: (chunk: LLM7StreamChunk) => void,
    onError: (error: Error) => void,
    onComplete: () => void
  ): Promise<void> {
    try {
      const requestBody = {
        ...request,
        stream: true
      }

      console.log('LLM7 Request:', requestBody)

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`LLM7 API Error: ${response.status} - ${errorData.error?.message || response.statusText}`)
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      let buffer = ''

      const processStream = async (): Promise<void> => {
        const { done, value } = await reader.read()
        
        if (done) {
          onComplete()
          return
        }

        buffer += decoder.decode(value, { stream: true })
        
        // Process Server-Sent Events format
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmedLine = line.trim()
          
          if (trimmedLine === '') continue
          if (trimmedLine === 'data: [DONE]') {
            onComplete()
            return
          }
          
          if (trimmedLine.startsWith('data: ')) {
            try {
              const jsonStr = trimmedLine.slice(6) // Remove 'data: ' prefix
              const chunk = JSON.parse(jsonStr) as LLM7StreamChunk
              onChunk(chunk)
            } catch (error) {
              console.warn('Failed to parse SSE chunk:', error)
            }
          }
        }

        await processStream()
      }

      await processStream()
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Get available models from LLM7.io
   */
  async getModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      // Parse the response format from llm7.io API
      if (Array.isArray(data)) {
        const models = data.map((model: { id: string }) => model.id).filter(Boolean)
        console.log(`Loaded ${models.length} models from LLM7.io API`)
        return models
      }

      throw new Error('Invalid response format')
    } catch (error) {
      console.error('Error fetching models from LLM7.io:', error)
      throw error
    }
  }



  /**
   * Set API key for enhanced rate limits
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey
  }

  /**
   * Get current API key
   */
  getApiKey(): string {
    return this.apiKey
  }
}

// Export singleton instance
export const llm7Service = new LLM7Service()
