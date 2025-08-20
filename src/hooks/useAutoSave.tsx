import { useEffect } from 'react'
import { usePlaygroundStore } from '@/store'

/**
 * Hook to automatically save chat sessions when messages change
 */
export function useAutoSave() {
  const { messages, currentSessionId, saveCurrentSession } = usePlaygroundStore()

  useEffect(() => {
    // Only auto-save if we have a current session and messages
    if (currentSessionId && messages.length > 0) {
      // Debounced save - the store handles the debouncing
      saveCurrentSession()
    }
  }, [messages, currentSessionId, saveCurrentSession])
}

export default useAutoSave
