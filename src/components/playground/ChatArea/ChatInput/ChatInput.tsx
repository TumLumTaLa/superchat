'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { TextArea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { usePlaygroundStore } from '@/store'
import { useLLM7Chat } from '@/hooks/useLLM7Chat'
import { type LLM7Message } from '@/lib/llm7Service'
import Icon from '@/components/ui/icon'

const ChatInput = () => {
  const {
    chatInputRef,
    messages,
    setMessages,
    isStreaming,
    setIsStreaming,
    selectedModel,
    llm7ApiKey,
    temperature,
    systemPrompt,
    currentSessionId,
    createNewSession
  } = usePlaygroundStore()

  const { sendStreamingMessage } = useLLM7Chat()
  const [inputMessage, setInputMessage] = useState('')

  const handleSubmit = async () => {
    if (!inputMessage.trim() || isStreaming) return

    // Create new session if this is the first message
    if (messages.length === 0 && !currentSessionId) {
      createNewSession()
    }

    const userMessage: LLM7Message = {
      role: 'user',
      content: inputMessage.trim()
    }

    // Add user message to store
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInputMessage('')

    // Add placeholder assistant message
    const assistantMessage: LLM7Message = {
      role: 'assistant',
      content: ''
    }
    setMessages([...newMessages, assistantMessage])

    try {
      let assistantResponse = ''

      // Prepare messages with system prompt if provided
      const messagesToSend = systemPrompt.trim()
        ? [{ role: 'system' as const, content: systemPrompt.trim() }, ...newMessages]
        : newMessages

      await sendStreamingMessage(
        messagesToSend,
        {
          model: selectedModel,
          temperature,
          apiKey: llm7ApiKey || undefined
        },
        (chunk: string) => {
          assistantResponse += chunk
          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = {
              role: 'assistant',
              content: assistantResponse
            }
            return updated
          })
        }
      )
    } catch (error) {
      toast.error(
        `Error sending message: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
      // Remove the placeholder assistant message on error
      setMessages(newMessages)
    }
  }

  return (
    <div className="relative mx-auto mb-1 flex w-full max-w-2xl items-end justify-center gap-x-2 font-geist">
      <TextArea
        placeholder={'Ask anything'}
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        onKeyDown={(e) => {
          if (
            e.key === 'Enter' &&
            !e.nativeEvent.isComposing &&
            !e.shiftKey &&
            !isStreaming
          ) {
            e.preventDefault()
            handleSubmit()
          }
        }}
        className="w-full border border-accent bg-primaryAccent px-4 text-sm text-primary focus:border-accent"
        disabled={isStreaming}
        ref={chatInputRef}
      />
      <Button
        onClick={handleSubmit}
        disabled={!inputMessage.trim() || isStreaming}
        size="icon"
        className="rounded-xl bg-primary p-5 text-primaryAccent"
      >
        <Icon type="send" color="primaryAccent" />
      </Button>
    </div>
  )
}

export default ChatInput
