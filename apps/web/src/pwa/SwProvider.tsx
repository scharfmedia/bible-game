import { createContext, useContext, type ReactNode } from 'react'
import { useServiceWorker, type SwState } from './useServiceWorker'

// One shared service-worker registration for the whole app, so the update banner and the
// Settings "check for updates" button observe the same state (registering twice would conflict).
const SwContext = createContext<SwState | null>(null)

export function SwProvider({ children }: { children: ReactNode }) {
  const sw = useServiceWorker()
  return <SwContext.Provider value={sw}>{children}</SwContext.Provider>
}

export function useSw(): SwState {
  const ctx = useContext(SwContext)
  if (!ctx) throw new Error('useSw must be used within <SwProvider>')
  return ctx
}
