// Point-and-click resolution: a verb+hotspot(+item) maps to a declarative Script, which the
// interpreter runs as a pure transformation of (world, inventory) producing events + Spirit
// intents + an optional transition (start combat/event/scene). Engine-side and fully testable.

import { evalGate } from '../map/gate'
import type { WorldState } from '../map/types'
import { itemCount, type InventoryState } from '../inventory/types'
import type { GameEvent } from '../events/event'
import type { SpiritEvent } from '../spirit/spirit'
import type { EncounterId, EventId, NodeId, SceneId } from '../types'
import type { Scene, Script, Verb } from './types'

export type SceneTransition =
  | { kind: 'combat'; id: EncounterId }
  | { kind: 'event'; id: EventId }
  | { kind: 'scene'; id: SceneId }
  | { kind: 'goto'; id: NodeId } // reveal a hidden node and relocate the pilgrim onto it

export interface ScriptOutcome {
  world: WorldState
  inventory: InventoryState
  events: GameEvent[]
  spiritEvents: SpiritEvent[]
  transition?: SceneTransition
}

function sceneRuntime(world: WorldState, sceneId: SceneId) {
  return world.sceneStates[sceneId] ?? { takenHotspots: [], toggled: {}, dialogueSeen: [] }
}

/** Run a declarative script. Pure. Spirit gates inside `if` read the starting `spirit`. */
export function runScript(
  world: WorldState,
  inventory: InventoryState,
  spirit: number,
  sceneId: SceneId,
  script: Script,
): ScriptOutcome {
  let w = world
  let inv = inventory
  const events: GameEvent[] = []
  const spiritEvents: SpiritEvent[] = []
  let transition: SceneTransition | undefined

  for (const cmd of script) {
    if (transition) break // a transition ends the scene; ignore the rest
    if ('say' in cmd) {
      events.push({ type: 'sceneLine', lineKey: cmd.say, speaker: cmd.speaker })
    } else if ('setFlag' in cmd) {
      w = { ...w, flags: { ...w.flags, [cmd.setFlag]: cmd.value } }
    } else if ('giveItem' in cmd) {
      const n = cmd.count ?? 1
      inv = { ...inv, stacks: { ...inv.stacks, [cmd.giveItem]: (inv.stacks[cmd.giveItem] ?? 0) + n } }
      events.push({ type: 'itemGained', itemId: cmd.giveItem, count: n })
    } else if ('takeItem' in cmd) {
      const n = cmd.count ?? 1
      const left = Math.max(0, (inv.stacks[cmd.takeItem] ?? 0) - n)
      inv = { ...inv, stacks: { ...inv.stacks, [cmd.takeItem]: left } }
      events.push({ type: 'itemUsed', itemId: cmd.takeItem })
    } else if ('revealNode' in cmd) {
      if (!w.revealed.includes(cmd.revealNode)) w = { ...w, revealed: [...w.revealed, cmd.revealNode] }
      events.push({ type: 'nodeRevealed', node: cmd.revealNode })
    } else if ('goToNode' in cmd) {
      // discover a hidden node AND walk there: reveal it, then hand a `goto` transition to the
      // world reducer (which relocates the pilgrim and returns to the map).
      if (!w.revealed.includes(cmd.goToNode)) w = { ...w, revealed: [...w.revealed, cmd.goToNode] }
      events.push({ type: 'nodeRevealed', node: cmd.goToNode })
      transition = { kind: 'goto', id: cmd.goToNode }
    } else if ('unlockEdge' in cmd) {
      if (!w.edgesUnlocked.includes(cmd.unlockEdge)) w = { ...w, edgesUnlocked: [...w.edgesUnlocked, cmd.unlockEdge] }
      events.push({ type: 'edgeUnlocked', edge: cmd.unlockEdge })
    } else if ('addSpirit' in cmd) {
      spiritEvents.push({ kind: 'moralChoice', delta: cmd.addSpirit, reason: cmd.reason })
    } else if ('markTaken' in cmd) {
      const rt = sceneRuntime(w, sceneId)
      if (!rt.takenHotspots.includes(cmd.markTaken)) {
        w = { ...w, sceneStates: { ...w.sceneStates, [sceneId]: { ...rt, takenHotspots: [...rt.takenHotspots, cmd.markTaken] } } }
      }
    } else if ('startCombat' in cmd) {
      transition = { kind: 'combat', id: cmd.startCombat }
    } else if ('startEvent' in cmd) {
      transition = { kind: 'event', id: cmd.startEvent }
    } else if ('changeScene' in cmd) {
      transition = { kind: 'scene', id: cmd.changeScene }
    } else if ('if' in cmd) {
      const pass = evalGate(cmd.if, { inventory: inv, spirit, world: w })
      const branch = pass ? cmd.then : cmd.else
      if (branch) {
        const r = runScript(w, inv, spirit, sceneId, branch)
        w = r.world
        inv = r.inventory
        events.push(...r.events)
        spiritEvents.push(...r.spiritEvents)
        if (r.transition) transition = r.transition
      }
    }
  }

  return { world: w, inventory: inv, events, spiritEvents, transition }
}

export interface SceneIntent {
  sceneId: SceneId
  hotspotId: string
  verb: Verb
  itemId?: string
}

/** Resolve a verb+hotspot(+item) interaction in a scene. */
export function resolveInteraction(
  world: WorldState,
  inventory: InventoryState,
  spirit: number,
  scene: Scene,
  intent: SceneIntent,
): ScriptOutcome {
  const unchanged: ScriptOutcome = { world, inventory, events: [], spiritEvents: [] }
  const hotspot = scene.hotspots.find((h) => h.id === intent.hotspotId)
  if (!hotspot) return { ...unchanged, events: [{ type: 'rejected', reason: 'no-such-hotspot' }] }
  if (hotspot.visibleWhen && !evalGate(hotspot.visibleWhen, { inventory, spirit, world })) {
    return { ...unchanged, events: [{ type: 'rejected', reason: 'hotspot-hidden' }] }
  }

  const interaction = hotspot.interactions[intent.verb]
  if (!interaction) {
    return { ...unchanged, events: [{ type: 'sceneLine', lineKey: `verb.refusal.${intent.verb}` }] }
  }
  if (interaction.requiresItem && itemCount(inventory, interaction.requiresItem) < 1) {
    return {
      ...unchanged,
      events: [{ type: 'sceneLine', lineKey: interaction.fallbackLineKey ?? 'verb.refusal.use' }],
    }
  }
  if (interaction.script) {
    return runScript(world, inventory, spirit, scene.id, interaction.script)
  }
  return {
    ...unchanged,
    events: [{ type: 'sceneLine', lineKey: interaction.fallbackLineKey ?? `verb.refusal.${intent.verb}` }],
  }
}
