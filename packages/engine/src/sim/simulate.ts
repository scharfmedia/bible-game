// Headless run driver: apply a command list through the pure root reducer. Used by tests as an
// integration tripwire (start → thief mini-boss) and as a balancing harness.

import type { Command } from '../commands/command'
import { reduce } from '../commands/reduce'
import type { GameEvent } from '../events/event'
import type { GameState } from '../state/gameState'

export interface SimEntry {
  cmd: Command
  events: GameEvent[]
}
export interface SimResult {
  state: GameState
  events: GameEvent[]
  log: SimEntry[]
}

export function simulate(initial: GameState, commands: Command[]): SimResult {
  let state = initial
  const events: GameEvent[] = []
  const log: SimEntry[] = []
  for (const cmd of commands) {
    const r = reduce(state, cmd)
    state = r.state
    events.push(...r.events)
    log.push({ cmd, events: r.events })
  }
  return { state, events, log }
}

/** Did any event of this type occur in the run? */
export const sawEvent = (result: SimResult, type: GameEvent['type']): boolean =>
  result.events.some((e) => e.type === type)
