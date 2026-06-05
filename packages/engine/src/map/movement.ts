// Pure movement helpers for an UNDIRECTED node mesh. Travel is one edge at a time to any adjacent
// node that is visible (reveal gate) and ungated. The CONSEQUENCE depends on whether this is the
// FIRST visit (fire the node's fixed event) or a REVISIT (roll the ambush table — unless the node
// is "quiet": a rest node, or a cleared combat). The world reducer (map/reduce.ts) orchestrates it.

import type { NodeId } from '../types'
import { evalGate, type GateContext } from './gate'
import { COMBAT_TYPES, REST_TYPES, type MapEdge, type MapNode, type WorldMap, type WorldState } from './types'

export function edgeBetween(map: WorldMap, from: NodeId, to: NodeId): MapEdge | undefined {
  for (const edgeId of map.adjacency[from] ?? []) {
    const e = map.edges[edgeId]
    if (e && ((e.a === from && e.b === to) || (e.b === from && e.a === to))) return e
  }
  return undefined
}

export function nodeVisible(map: WorldMap, world: WorldState, ctx: GateContext, id: NodeId): boolean {
  const node = map.nodes[id]
  if (!node) return false
  if (!node.reveal) return true
  return world.revealed.includes(id) || evalGate(node.reveal, ctx)
}

/** A node is "quiet" on revisit (never ambushes): a rest node, or a combat already cleared. */
export function isQuiet(node: MapNode, world: WorldState): boolean {
  if (REST_TYPES.includes(node.type)) return true
  if (COMBAT_TYPES.includes(node.type)) return world.cleared.includes(node.id)
  return false
}

export type Visit = 'first' | 'revisit'

export type MoveCheck =
  | { ok: true; visit: Visit; edge: MapEdge }
  | { ok: false; reason: 'no-edge' | 'gated' | 'not-one-way' | 'hidden' | 'busy' }

/** Whether the hero may step from world.current to `target` right now. */
export function canMove(map: WorldMap, world: WorldState, ctx: GateContext, target: NodeId): MoveCheck {
  if (world.movement.kind !== 'idle') return { ok: false, reason: 'busy' }
  const edge = edgeBetween(map, world.current, target)
  if (!edge) return { ok: false, reason: 'no-edge' }
  if (edge.oneWay && edge.oneWay !== target) return { ok: false, reason: 'not-one-way' }
  if (!nodeVisible(map, world, ctx, target)) return { ok: false, reason: 'hidden' }

  const latched = world.edgesUnlocked.includes(edge.id)
  if (!latched && !evalGate(edge.gate, ctx)) return { ok: false, reason: 'gated' }

  return { ok: true, visit: world.visited.includes(target) ? 'revisit' : 'first', edge }
}
