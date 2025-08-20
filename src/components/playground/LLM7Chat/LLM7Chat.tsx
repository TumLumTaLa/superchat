'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { TextArea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Send, Settings } from 'lucide-react'
import { useLLM7Chat, useLLM7Models, type LLM7Message } from '@/hooks/useLLM7Chat'
import { toast } from 'sonner'

export function LLM7Chat() {
  const [message, setMessage] = useState('')
  const [conversation, setConversation] = useState<LLM7Message[]>([])
  const [selectedModel, setSelectedModel] = useState('gpt-4')
  const [apiKey, setApiKey] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [temperature, setTemperature] = useState(0.7)
  
  const { state, sendStreamingMessage, clearError, reset } = useLLM7Chat()
  const { models, fetchModels } = useLLM7Models()

  const handleSendMessage = async () => {
    if (!message.trim()) return

    const userMessage: LLM7Message = {
      role: 'user',
      content: message.trim()
    }

    const newConversation = [...conversation, userMessage]
    setConversation(newConversation)
    setMessage('')

    // Add assistant message placeholder
    const assistantMessage: LLM7Message = {
      role: 'assistant',
      content: ''
    }
    setConversation([...newConversation, assistantMessage])

    try {
      let assistantResponse = ''
      
      await sendStreamingMessage(
        newConversation,
        {
          model: selectedModel,
          temperature,
          apiKey: apiKey || undefined
        },
        (chunk: string) => {
          assistantResponse += chunk
          setConversation(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = {
              role: 'assistant',
              content: assistantResponse
            }
            return updated
          })
        }
      )

      if (state.error) {
        toast.error(state.error)
      }
    } catch (error) {
      toast.error('Failed to send message')
      // Remove the placeholder assistant message on error
      setConversation(newConversation)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleClearChat = () => {
    setConversation([])
    reset()
  }

  const loadModels = async () => {
    await fetchModels(apiKey || undefined)
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Super Chat</h1>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearChat}
          >
            Clear Chat
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="apiKey">API Key (Optional)</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Enter your LLM7 token"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Get free tokens at <a href="https://token.llm7.io" target="_blank" rel="noopener noreferrer" className="underline">token.llm7.io</a>
                </p>
              </div>
              
              <div>
                <Label htmlFor="model">Model</Label>
                <div className="flex space-x-2">
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {models.length > 0 ? (
                        models.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="gpt-4">GPT-4</SelectItem>
                          <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                          <SelectItem value="deepseek-chat">DeepSeek Chat</SelectItem>
                          <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={loadModels}>
                    Refresh
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="temperature">Temperature: {temperature}</Label>
                <Input
                  id="temperature"
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Messages */}
      <Card className="flex-1 flex flex-col">
        <CardContent className="flex-1 p-4 overflow-y-auto space-y-4">
          {conversation.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>Start a conversation with Super Chat!</p>
              <p className="text-sm mt-2">
                Free access to GPT-4, DeepSeek, Claude, and more.
              </p>
            </div>
          ) : (
            conversation.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div className="text-xs font-medium mb-1 opacity-70">
                    {msg.role === 'user' ? 'You' : selectedModel}
                  </div>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  {msg.role === 'assistant' && state.isStreaming && index === conversation.length - 1 && (
                    <div className="flex items-center mt-2">
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      <span className="text-xs opacity-70">Typing...</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Input Area */}
      <Card>
        <CardContent className="p-4">
          <div className="flex space-x-2">
            <TextArea
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 min-h-[60px] resize-none"
              disabled={state.isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={state.isLoading || !message.trim()}
              size="lg"
            >
              {state.isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          {state.error && (
            <div className="mt-2 text-sm text-destructive">
              Error: {state.error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
