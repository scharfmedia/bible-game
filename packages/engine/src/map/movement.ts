// Pure movement helpers: edge lookup, forward/backward classification, and traversal eligibility.
// Movement is ALWAYS one edge at a time (no path-finding jumps). Forward into an uncleared node
// fires its fixed event; backward (to a seen node) rolls the backward-encounter table. The world
// reducer (map/reduce.ts) orchestrates the consequences.

import type { NodeId } from '../types'
import { evalGate, type GateContext } from './gate'
import type { MapEdge, WorldMap, WorldState } from './types'

export function edgeBetween(map: WorldMap, from: NodeId, to: NodeId): MapEdge | undefined {
  for (const edgeId of map.adjacency[from] ?? []) {
    const e = map.edges[edgeId]
    if (e && ((e.a === from && e.b === to) || (e.b === from && e.a === to))) return e
  }
  return undefined
}

export type Direction = 'forward' | 'backward'

export function classify(map: WorldMap, from: NodeId, to: NodeId): Direction {
  const a = map.nodes[from]
  const b = map.nodes[to]
  return (b?.depth ?? 0) > (a?.depth ?? 0) ? 'forward' : 'backward'
}

export function nodeVisible(map: WorldMap, world: WorldState, ctx: GateContext, id: NodeId): boolean {
  const node = map.nodes[id]
  if (!node) return false
  if (!node.reveal) return true
  return world.revealed.includes(id) || evalGate(node.reveal, ctx)
}

export type MoveCheck =
  | { ok: true; direction: Direction; edge: MapEdge }
  | { ok: false; reason: 'no-edge' | 'gated' | 'not-one-way' | 'not-seen' | 'hidden' | 'busy' }

/** Whether the hero may step from world.current to `target` right now. */
export function canMove(map: WorldMap, world: WorldState, ctx: GateContext, target: NodeId): MoveCheck {
  if (world.movement.kind !== 'idle') return { ok: false, reason: 'busy' }
  const from = world.current
  const edge = edgeBetween(map, from, target)
  if (!edge) return { ok: false, reason: 'no-edge' }
  if (edge.oneWay && edge.oneWay !== target) return { ok: false, reason: 'not-one-way' }
  if (!nodeVisible(map, world, ctx, target)) return { ok: false, reason: 'hidden' }

  const latched = world.edgesUnlocked.includes(edge.id)
  if (!latched && !evalGate(edge.gate, ctx)) return { ok: false, reason: 'gated' }

  const direction = classify(map, from, target)
  if (direction === 'backward' && !world.visited.includes(target)) return { ok: false, reason: 'not-seen' }

  return { ok: true, direction, edge }
}
