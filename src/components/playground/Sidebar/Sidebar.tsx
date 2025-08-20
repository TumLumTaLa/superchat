'use client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import useChatActions from '@/hooks/useChatActions'
import { usePlaygroundStore } from '@/store'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import Icon from '@/components/ui/icon'
import { llm7Service } from '@/lib/llm7Service'
import ChatHistory from './ChatHistory'

const SidebarHeader = () => (
  <div className="flex items-center gap-2">
    <Icon type="agno" size="xs" />
    <span className="text-xs font-medium uppercase text-white">Super Chat</span>
  </div>
)

const NewChatButton = ({
  disabled,
  onClick
}: {
  disabled: boolean
  onClick: () => void
}) => (
  <Button
    onClick={onClick}
    disabled={disabled}
    size="lg"
    className="h-9 w-full rounded-xl bg-primary text-xs font-medium text-background hover:bg-primary/80"
  >
    <Icon type="plus-icon" size="xs" className="text-background" />
    <span className="uppercase">New Chat</span>
  </Button>
)



const LLM7Settings = () => {
  const {
    llm7ApiKey,
    setLLM7ApiKey,
    temperature,
    setTemperature,
    systemPrompt,
    setSystemPrompt
  } = usePlaygroundStore()

  const [showSettings, setShowSettings] = useState(false)

  const handleApiKeyChange = (value: string) => {
    setLLM7ApiKey(value)
    llm7Service.setApiKey(value || 'unused')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium uppercase text-primary">Super Chat Settings</div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Icon type="settings" size="xs" />
        </Button>
      </div>

      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-3"
        >
          <div>
            <Label className="text-xs text-muted-foreground">API Key (Optional)</Label>
            <Input
              type="password"
              placeholder="Enter LLM7 token"
              value={llm7ApiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              className="h-8 text-xs"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Get free tokens at{' '}
              <a
                href="https://token.llm7.io"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                token.llm7.io
              </a>
            </p>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">
              Temperature: {temperature}
            </Label>
            <Input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="h-8"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">System Prompt</Label>
            <textarea
              placeholder="Enter system prompt to customize AI behavior..."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full min-h-[80px] max-h-[200px] p-2 text-xs border border-border rounded-md bg-background resize-y"
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Define how the AI should behave and respond
            </p>
          </div>
        </motion.div>
      )}
    </div>
  )
}



const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { clearChat, focusChatInput } = useChatActions()
  const { hydrated } = usePlaygroundStore()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [hydrated])

  const handleNewChat = () => {
    clearChat()
    focusChatInput()
  }

  return (
    <motion.aside
      className="relative flex h-screen shrink-0 grow-0 flex-col overflow-hidden px-2 py-3 font-dmmono"
      initial={{ width: '16rem' }}
      animate={{ width: isCollapsed ? '2.5rem' : '16rem' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <motion.button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute right-2 top-2 z-10 p-1"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        type="button"
        whileTap={{ scale: 0.95 }}
      >
        <Icon
          type="sheet"
          size="xs"
          className={`transform ${isCollapsed ? 'rotate-180' : 'rotate-0'}`}
        />
      </motion.button>
      <motion.div
        className="w-60 space-y-5"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: isCollapsed ? 0 : 1, x: isCollapsed ? -20 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{
          pointerEvents: isCollapsed ? 'none' : 'auto'
        }}
      >
        <SidebarHeader />
        <NewChatButton
          disabled={false}
          onClick={handleNewChat}
        />
        {isMounted && (
          <>
            <ChatHistory />
            <LLM7Settings />
          </>
        )}
      </motion.div>
    </motion.aside>
  )
}

export default Sidebar
