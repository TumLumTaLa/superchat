'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { usePlaygroundStore } from '@/store'
import { motion, AnimatePresence } from 'framer-motion'
import Icon from '@/components/ui/icon'

const ChatHistory = () => {
  const {
    chatSessions,
    currentSessionId,
    loadSession,
    deleteSession
  } = usePlaygroundStore()
  
  const [showHistory, setShowHistory] = useState(false)

  const handleLoadSession = (sessionId: string) => {
    loadSession(sessionId)
  }

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteSession(sessionId)
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  const sortedSessions = [...chatSessions].sort((a, b) => b.updatedAt - a.updatedAt)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium uppercase text-primary">Chat History</div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowHistory(!showHistory)}
        >
          <Icon type={showHistory ? 'chevron-up' : 'chevron-down'} size="xs" />
        </Button>
      </div>

      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1 max-h-64 overflow-y-auto"
          >
            {sortedSessions.length === 0 ? (
              <div className="text-xs text-muted-foreground p-2 text-center">
                No chat history yet
              </div>
            ) : (
              sortedSessions.map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                    currentSessionId === session.id
                      ? 'bg-primary/15 border border-primary/20'
                      : 'hover:bg-accent'
                  }`}
                  onClick={() => handleLoadSession(session.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-primary truncate">
                      {session.title}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {session.model}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        •
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(session.updatedAt)}
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                    onClick={(e) => handleDeleteSession(session.id, e)}
                  >
                    <Icon type="trash" size="xs" />
                  </Button>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ChatHistory
