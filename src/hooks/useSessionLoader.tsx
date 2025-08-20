// Temporarily disabled hook
const useSessionLoader = () => {
  // Temporarily disabled - properties not available in current store
  return {
    getSession: () => Promise.resolve(null),
    loadSessions: () => Promise.resolve(),
    isLoading: false
  }
}

export default useSessionLoader
