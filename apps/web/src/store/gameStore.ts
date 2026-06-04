import { create } from 'zustand'
import { createContent } from '@bible/content'
import { newGame, reduce, type Command, type GameEvent, type GameState, type Locale } from '@bible/engine'
import { saveStore } from '@bible/persistence'
import { i18n } from '../i18n'

// The Zustand bridge: the ONLY place the engine is driven. Components dispatch Commands and read
// state + the last event batch (for animation). Game logic lives entirely in the engine.

const content = createContent()

const randomId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `id-${Math.random().toString(36).slice(2)}`

interface GameStore {
  state: GameState
  /** the events produced by the most recent dispatch (consumed by animations) */
  lastEvents: GameEvent[]
  /** increments every dispatch so effects can react to a fresh batch */
  tick: number
  content: typeof content
  dispatch: (cmd: Command) => void
  createHero: (name: string) => void
  startRun: (characterId: string) => void
  hydrate: () => Promise<void>
  resume: (characterId: string) => Promise<void>
  setLocale: (locale: Locale) => void
}

export const useGame = create<GameStore>((set, get) => ({
  state: newGame(),
  lastEvents: [],
  tick: 0,
  content,

  dispatch: (cmd) => {
    const { state, tick } = get()
    const { state: next, events } = reduce(state, cmd)
    set({ state: next, lastEvents: events, tick: tick + 1 })
    // autosave at boundaries (never mid-combat)
    if (!next.combat) void saveStore.persist(next)
  },

  createHero: (name) => get().dispatch({ type: 'createHero', id: randomId(), name }),

  startRun: (characterId) =>
    get().dispatch({ type: 'startRun', characterId, worldId: 'world-01', seed: `${characterId}-${randomId()}`, content }),

  hydrate: async () => {
    const profile = await saveStore.loadProfile()
    if (profile) {
      set({ state: { ...newGame(), profile } })
      void i18n.changeLanguage(profile.settings.locale)
    }
  },

  resume: async (characterId) => {
    const run = await saveStore.loadRun(characterId)
    get().dispatch({ type: 'selectHero', id: characterId })
    if (run) {
      set((s) => ({ state: { ...s.state, run, combat: null, prompt: null, screen: 'map' } }))
    } else {
      get().dispatch({ type: 'navigate', screen: 'worldSelect' })
    }
  },

  setLocale: (locale) => {
    get().dispatch({ type: 'updateSettings', settings: { locale } })
    void i18n.changeLanguage(locale)
  },
}))
