// World/adventure sub-reducer: movement (forward fixed-event / backward random roll), the
// encounter→combat handoff, point-and-click scene interactions, moral events, and the fireplace.
// Threads Spirit intents onto run.spirit (single-writer) and sets screens. Pure.

import { buildEncounter, encounterExists } from '../combat/encounterBuilder'
import type { Command } from '../commands/command'
import type { GameEvent, ReduceResult } from '../events/event'
import { memberMaxHp, type PartyMember } from '../state/character'
import { applySpiritEvent, type SpiritEvent } from '../spirit/spirit'
import type { GameState, RunState } from '../state/gameState'
import { fork, nextFloat } from '../rng/rng'
import { resolveInteraction, runScript, type SceneTransition } from '../scene/resolve'
import type { NodeId } from '../types'
import type { MapNode, WorldMap } from './types'
import { canMove } from './movement'
import { evalGate } from './gate'

const reject = (state: GameState, reason: string): ReduceResult => ({ state, events: [{ type: 'rejected', reason }] })
const ok = (state: GameState, events: GameEvent[]): ReduceResult => ({ state, events })

const mapOf = (run: RunState): WorldMap => run.content.worlds[run.worldId]!.map

function withSpirit(run: RunState, spiritEvents: SpiritEvent[]): { run: RunState; events: GameEvent[] } {
  let r = run
  const events: GameEvent[] = []
  for (const ev of spiritEvents) {
    const out = applySpiritEvent(r.spirit, ev)
    r = { ...r, spirit: out.state }
    events.push({ type: 'spiritShifted', delta: out.delta, reason: out.reason })
  }
  return { run: r, events }
}

const clearNode = (run: RunState, nodeId: NodeId): RunState =>
  run.world.cleared.includes(nodeId)
    ? run
    : { ...run, world: { ...run.world, cleared: [...run.world.cleared, nodeId] } }

export function reduceWorld(state: GameState, cmd: Command): ReduceResult {
  if (!state.run) return reject(state, 'no-run')
  switch (cmd.type) {
    case 'world/move':
      return move(state, cmd.target)
    case 'world/sceneInteract':
      return sceneInteract(state, cmd)
    case 'world/leaveScene':
      return leaveScene(state)
    case 'world/eventChoice':
      return eventChoice(state, cmd.eventId, cmd.choiceId)
    case 'world/fireplace':
      return fireplace(state, cmd.action)
    case 'world/advanceWorld':
      return advanceWorld(state)
    default:
      return reject(state, 'unknown-world-command')
  }
}

// ---- movement ---------------------------------------------------------------------------

function move(state: GameState, target: NodeId): ReduceResult {
  const run = state.run!
  const map = mapOf(run)
  const ctx = { inventory: run.inventory, spirit: run.spirit.spirit, world: run.world }
  const chk = canMove(map, run.world, ctx, target)
  if (!chk.ok) return reject(state, `move:${chk.reason}`)

  const node = map.nodes[target]!
  const fromId = run.world.current
  const visited = run.world.visited.includes(target) ? run.world.visited : [...run.world.visited, target]
  const depth = chk.direction === 'forward' ? Math.max(run.depth, node.depth) : run.depth
  const run2: RunState = { ...run, depth, world: { ...run.world, current: target, visited } }

  const moved: GameEvent = { type: 'moved', from: fromId, to: target, direction: chk.direction }

  if (chk.direction === 'forward' && !run.world.cleared.includes(target)) {
    return triggerFixed(state, run2, node, [moved])
  }
  if (chk.direction === 'backward') {
    return rollBackward(state, run2, node, [moved])
  }
  // forward into an already-cleared node: free passage
  return ok({ ...state, run: run2 }, [moved])
}

function triggerFixed(state: GameState, run: RunState, node: MapNode, pre: GameEvent[]): ReduceResult {
  const ev = node.fixedEvent
  switch (ev.kind) {
    case 'none':
      return ok({ ...state, run: clearNode(run, node.id) }, pre)
    case 'combat':
    case 'boss':
      return startCombatNode(state, run, node.id, ev.encounter, false, pre)
    case 'scene': {
      const run2 = { ...run, world: { ...run.world, movement: { kind: 'inScene' as const, sceneId: ev.sceneId } } }
      return ok({ ...state, run: run2, screen: 'scene' }, [
        ...pre,
        { type: 'sceneEntered', sceneId: ev.sceneId },
        { type: 'screenChanged', screen: 'scene' },
      ])
    }
    case 'event': {
      const run2 = { ...run, world: { ...run.world, movement: { kind: 'inEvent' as const, eventId: ev.eventId, node: node.id } } }
      return ok({ ...state, run: run2, screen: 'event' }, [...pre, { type: 'screenChanged', screen: 'event' }])
    }
    case 'fireplace':
      return ok({ ...state, run, screen: 'fireplace' }, [...pre, { type: 'screenChanged', screen: 'fireplace' }])
    case 'shop':
      // shop deferred for M1 — treat as a benign cleared node
      return ok({ ...state, run: clearNode(run, node.id) }, pre)
  }
}

function rollBackward(state: GameState, run: RunState, node: MapNode, pre: GameEvent[]): ReduceResult {
  const table = run.content.worlds[run.worldId]!.backwardTable
  const [f, rng] = nextFloat(run.rng)
  const run2: RunState = { ...run, rng, world: { ...run.world, backwardCursor: run.world.backwardCursor + 1 } }

  let kind: 'nothing' | 'fight' | 'event' = 'nothing'
  if (f < table.fight) kind = 'fight'
  else if (f < table.fight + table.event) kind = 'event'

  const events: GameEvent[] = [...pre, { type: 'backwardEncounter', kind }]

  if (kind === 'fight' && table.fightEncounterId && encounterExists(run.content, table.fightEncounterId)) {
    return startCombatNode(state, run2, node.id, table.fightEncounterId, true, events)
  }
  if (kind === 'event' && table.eventId && run.content.events[table.eventId]) {
    const run3 = {
      ...run2,
      world: { ...run2.world, movement: { kind: 'inEvent' as const, eventId: table.eventId, node: node.id, backward: true } },
    }
    return ok({ ...state, run: run3, screen: 'event' }, [...events, { type: 'screenChanged', screen: 'event' }])
  }
  return ok({ ...state, run: run2 }, events)
}

// ---- encounter handoff ------------------------------------------------------------------

function startCombatNode(
  state: GameState,
  run: RunState,
  nodeId: NodeId,
  encounterId: string,
  backward: boolean,
  pre: GameEvent[],
): ReduceResult {
  if (!encounterExists(run.content, encounterId)) return reject(state, 'no-such-encounter')
  const combatRng = fork(run.rng, `combat:${nodeId}:${run.world.backwardCursor}`)
  const startStep = buildEncounter(run, encounterId, nodeId, combatRng)

  let run2: RunState = {
    ...run,
    world: { ...run.world, movement: { kind: 'inCombat' as const, encounter: encounterId, node: nodeId, backward } },
  }
  const sp = withSpirit(run2, startStep.spiritEvents)
  run2 = sp.run

  return ok({ ...state, run: run2, combat: startStep.combat, screen: 'combat' }, [
    ...pre,
    ...startStep.events,
    ...sp.events,
    { type: 'screenChanged', screen: 'combat' },
  ])
}

// ---- scenes -----------------------------------------------------------------------------

function sceneInteract(state: GameState, cmd: Extract<Command, { type: 'world/sceneInteract' }>): ReduceResult {
  const run = state.run!
  if (run.world.movement.kind !== 'inScene') return reject(state, 'not-in-scene')
  const scene = run.content.scenes[cmd.sceneId]
  if (!scene) return reject(state, 'no-such-scene')

  const outcome = resolveInteraction(run.world, run.inventory, run.spirit.spirit, scene, {
    sceneId: cmd.sceneId,
    hotspotId: cmd.hotspotId,
    verb: cmd.verb,
    itemId: cmd.itemId,
  })

  let run2: RunState = { ...run, world: outcome.world, inventory: outcome.inventory }
  const sp = withSpirit(run2, outcome.spiritEvents)
  run2 = sp.run
  const events = [...outcome.events, ...sp.events]

  if (outcome.transition) return applyTransition(state, run2, outcome.transition, events)
  return ok({ ...state, run: run2 }, events)
}

function leaveScene(state: GameState): ReduceResult {
  const run = state.run!
  if (run.world.movement.kind !== 'inScene') return reject(state, 'not-in-scene')
  const run2 = clearNode({ ...run, world: { ...run.world, movement: { kind: 'idle' } } }, run.world.current)
  return ok({ ...state, run: run2, screen: 'map' }, [{ type: 'screenChanged', screen: 'map' }])
}

function applyTransition(state: GameState, run: RunState, t: SceneTransition, pre: GameEvent[]): ReduceResult {
  if (t.kind === 'combat') return startCombatNode(state, run, run.world.current, t.id, false, pre)
  if (t.kind === 'event') {
    const run2 = { ...run, world: { ...run.world, movement: { kind: 'inEvent' as const, eventId: t.id, node: run.world.current } } }
    return ok({ ...state, run: run2, screen: 'event' }, [...pre, { type: 'screenChanged', screen: 'event' }])
  }
  // changeScene
  const run2 = { ...run, world: { ...run.world, movement: { kind: 'inScene' as const, sceneId: t.id } } }
  return ok({ ...state, run: run2, screen: 'scene' }, [...pre, { type: 'sceneEntered', sceneId: t.id }])
}

// ---- moral events -----------------------------------------------------------------------

function eventChoice(state: GameState, eventId: string, choiceId: string): ReduceResult {
  const run = state.run!
  if (run.world.movement.kind !== 'inEvent') return reject(state, 'not-in-event')
  const backward = run.world.movement.backward ?? false
  const def = run.content.events[eventId]
  if (!def) return reject(state, 'no-such-event')
  const choice = def.choices.find((c) => c.id === choiceId)
  if (!choice) return reject(state, 'no-such-choice')
  if (choice.requires && !evalGate(choice.requires, { inventory: run.inventory, spirit: run.spirit.spirit, world: run.world })) {
    return reject(state, 'choice-locked')
  }

  const outcome = runScript(run.world, run.inventory, run.spirit.spirit, `event:${eventId}`, choice.script)
  let run2: RunState = { ...run, world: outcome.world, inventory: outcome.inventory }
  const sp = withSpirit(run2, outcome.spiritEvents)
  run2 = sp.run
  const events = [...outcome.events, ...sp.events]

  if (outcome.transition?.kind === 'combat') {
    return startCombatNode(state, run2, run.world.current, outcome.transition.id, backward, events)
  }

  // event resolved → back to the map. Fixed event nodes are cleared; backward events are not.
  run2 = { ...run2, world: { ...run2.world, movement: { kind: 'idle' } } }
  if (!backward) run2 = clearNode(run2, run.world.current)
  return ok({ ...state, run: run2, screen: 'map' }, [...events, { type: 'screenChanged', screen: 'map' }])
}

// ---- fireplace --------------------------------------------------------------------------

function fireplace(state: GameState, action: 'rest' | 'pray' | 'leave'): ReduceResult {
  const run = state.run!
  const node = run.world.current
  const restFlag = `fireplace:${node}:rested`
  const prayFlag = `fireplace:${node}:prayed`

  if (action === 'rest') {
    if (run.world.flags[restFlag]) return reject(state, 'already-rested')
    const party: PartyMember[] = run.party.map((m) => ({ ...m, currentHp: memberMaxHp(m) }))
    const run2: RunState = { ...run, party, world: { ...run.world, flags: { ...run.world.flags, [restFlag]: true } } }
    return ok({ ...state, run: run2 }, [{ type: 'notice', messageKey: 'fireplace.rested' }])
  }
  if (action === 'pray') {
    if (run.world.flags[prayFlag]) return reject(state, 'already-prayed')
    const sp = withSpirit({ ...run, world: { ...run.world, flags: { ...run.world.flags, [prayFlag]: true } } }, [{ kind: 'pray' }])
    return ok({ ...state, run: sp.run }, [{ type: 'notice', messageKey: 'fireplace.prayed' }, ...sp.events])
  }
  // leave
  const run2 = clearNode({ ...run, world: { ...run.world, movement: { kind: 'idle' } } }, node)
  return ok({ ...state, run: run2, screen: 'map' }, [{ type: 'screenChanged', screen: 'map' }])
}

// ---- world transition -------------------------------------------------------------------

function advanceWorld(state: GameState): ReduceResult {
  const run = state.run!
  if (!run.world.bossDefeated) return reject(state, 'boss-not-defeated')
  // M1: only one world exists. Acknowledge the milestone; the next world is deferred content.
  return ok(state, [{ type: 'worldAdvanced', worldId: run.worldId }, { type: 'notice', messageKey: 'world.nextComing' }])
}
