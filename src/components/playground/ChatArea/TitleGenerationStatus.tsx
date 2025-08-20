'use client'

import { useState, useEffect } from 'react'
import { usePlaygroundStore } from '@/store'
import { motion, AnimatePresence } from 'framer-motion'
import Icon from '@/components/ui/icon'

/**
 * Component to show title generation status
 */
export function TitleGenerationStatus() {
  const { currentSessionId, chatSessions } = usePlaygroundStore()
  const [isGenerating, setIsGenerating] = useState(false)
  const [showStatus, setShowStatus] = useState(false)

  const currentSession = chatSessions.find(s => s.id === currentSessionId)

  useEffect(() => {
    if (currentSession) {
      // Show status when session has enough messages but still has default title
      const shouldShow = currentSession.title === 'New Chat' && currentSession.messages.length >= 2
      setShowStatus(shouldShow)
    } else {
      setShowStatus(false)
    }
  }, [currentSession])

  // Simulate title generation status (in real implementation, this would come from the store)
  useEffect(() => {
    if (showStatus) {
      setIsGenerating(true)
      const timer = setTimeout(() => {
        setIsGenerating(false)
      }, 3000) // Simulate 3 second generation time

      return () => clearTimeout(timer)
    }
  }, [showStatus])

  if (!showStatus) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex items-center space-x-2 px-4 py-2 bg-accent/50 border-b border-accent"
      >
        <div className="flex items-center space-x-2">
          {isGenerating ? (
            <>
              <Icon type="refresh" size="xs" className="animate-spin" />
              <span className="text-xs text-muted-foreground">
                Generating AI title...
              </span>
            </>
          ) : (
            <>
              <Icon type="check" size="xs" className="text-green-500" />
              <span className="text-xs text-muted-foreground">
                Title generated
              </span>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default TitleGenerationStatus
