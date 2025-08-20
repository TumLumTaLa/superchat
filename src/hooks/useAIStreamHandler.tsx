// Temporarily disabled hook
const useAIChatStreamHandler = () => {
  // Temporarily disabled - properties not available in current store
  return {
    handleStreamingMessage: () => Promise.resolve(),
    isStreaming: false
  }
}

export default useAIChatStreamHandler
