import React from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { initI18n } from './i18n'
import { useGame } from './store/gameStore'
import './styles.css'

initI18n('en')

// Load any saved profile before first paint, then render.
void useGame
  .getState()
  .hydrate()
  .finally(() => {
    createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
  })
