import { llm7Service, type LLM7Message } from './llm7Service'

/**
 * Generate a concise title for a chat session using AI
 */
export async function generateAITitle(
  messages: LLM7Message[],
  apiKey: string
): Promise<string> {
  try {
    // Get the first few messages for context
    const contextMessages = messages.slice(0, 4) // First 4 messages for context
    
    if (contextMessages.length === 0) {
      return 'New Chat'
    }

    // Create a prompt to generate a concise title
    const titlePrompt = `Based on the following conversation, generate a concise, descriptive title (maximum 6 words, no quotes or punctuation):

${contextMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Title:`

    const titleMessages: LLM7Message[] = [
      {
        role: 'user',
        content: titlePrompt
      }
    ]

    // Set API key
    llm7Service.setApiKey(apiKey)

    // Use a fast, cheap model for title generation
    const response = await llm7Service.createChatCompletion({
      messages: titleMessages,
      model: 'gpt-4o-mini', // Always use fast model for titles
      temperature: 0.3, // Low temperature for consistent results
      max_tokens: 20, // Very short response
      stream: false
    })

    if (response?.choices?.[0]?.message?.content) {
      const title = response.choices[0].message.content.trim()
        .replace(/^["']|["']$/g, '') // Remove quotes
        .replace(/[.!?]+$/, '') // Remove ending punctuation
        .substring(0, 60) // Limit length

      return title || getFallbackTitle(messages)
    }
  } catch (error) {
    console.warn('Failed to generate AI title:', error)
  }
  
  return getFallbackTitle(messages)
}

/**
 * Generate a fallback title from the first user message
 */
export function getFallbackTitle(messages: LLM7Message[]): string {
  const firstUserMessage = messages.find(msg => msg.role === 'user')
  if (firstUserMessage) {
    const content = firstUserMessage.content.trim()
    // Extract first sentence or first 50 characters
    const firstSentence = content.split(/[.!?]/)[0]
    const title = firstSentence.length > 50 ? content.substring(0, 50) + '...' : firstSentence
    return title || 'New Chat'
  }
  return 'New Chat'
}

/**
 * Debounced title generation to avoid too many API calls
 */
let titleGenerationTimeout: NodeJS.Timeout | null = null

export function generateTitleDebounced(
  messages: LLM7Message[],
  apiKey: string,
  onTitleGenerated: (title: string) => void,
  delay: number = 2000
) {
  if (titleGenerationTimeout) {
    clearTimeout(titleGenerationTimeout)
  }
  
  titleGenerationTimeout = setTimeout(async () => {
    const title = await generateAITitle(messages, apiKey)
    onTitleGenerated(title)
  }, delay)
}
