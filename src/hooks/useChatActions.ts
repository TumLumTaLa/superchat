import { useCallback } from 'react'
import { usePlaygroundStore } from '../store'
import { type LLM7Message } from '@/lib/llm7Service'

const useChatActions = () => {
  const { chatInputRef, setMessages } = usePlaygroundStore()

  const clearChat = useCallback(() => {
    setMessages([])
  }, [setMessages])

  const focusChatInput = useCallback(() => {
    setTimeout(() => {
      requestAnimationFrame(() => chatInputRef?.current?.focus())
    }, 0)
  }, [chatInputRef])

  const addMessage = useCallback(
    (message: LLM7Message) => {
      setMessages((prevMessages) => [...prevMessages, message])
    },
    [setMessages]
  )

  return {
    clearChat,
    addMessage,
    focusChatInput
  }
}

export default useChatActions
