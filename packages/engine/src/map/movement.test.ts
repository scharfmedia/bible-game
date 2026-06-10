import { describe, expect, it } from 'vitest'
import { emptyInventory } from '../inventory/types'
import { testContent } from '../testing/fixtures'
import { evalGate } from './gate'
import { canMove, mapEntrances } from './movement'
import { initialWorldState } from './types'

const map = testContent().worlds['world-01']!.map
const ctx = (over: Partial<{ items: Record<string, number>; spirit: number }> = {}) => ({
  inventory: { ...emptyInventory(), stacks: over.items ?? {} },
  spirit: over.spirit ?? 100,
  world: world(),
})

const world = () => initialWorldState('world-01', 'n0')

describe('evalGate', () => {
  it('handles items, flags, spirit, cleared and boolean combinators', () => {
    const base = ctx({ items: { key: 1 } })
    expect(evalGate({ hasItem: 'key' }, base)).toBe(true)
    expect(evalGate({ hasItem: 'sword' }, base)).toBe(false)
    expect(evalGate({ spiritAtLeast: 50 }, base)).toBe(true)
    expect(evalGate({ spiritAtLeast: 500 }, base)).toBe(false)
    expect(evalGate({ all: [{ hasItem: 'key' }, { spiritAtLeast: 50 }] }, base)).toBe(true)
    expect(evalGate({ any: [{ hasItem: 'sword' }, { spiritAtLeast: 50 }] }, base)).toBe(true)
    expect(evalGate({ not: { hasItem: 'sword' } }, base)).toBe(true)
    expect(evalGate(undefined, base)).toBe(true)
  })
})

describe('canMove', () => {
  it('allows a step to an adjacent unvisited node (first visit)', () => {
    const r = canMove(map, world(), ctx(), 'n1')
    expect(r.ok).toBe(true)
    expect(r.ok && r.visit).toBe('first')
  })

  it('rejects non-adjacent jumps', () => {
    expect(canMove(map, world(), ctx(), 'n3')).toEqual({ ok: false, reason: 'no-edge' })
  })

  it('blocks a gated edge until the item is held, then allows it', () => {
    // place the hero at n3 to test the n3→n4 gate (requires "key")
    const w = { ...world(), current: 'n3', visited: ['n0', 'n1', 'n2', 'n3'] }
    expect(canMove(map, w, { ...ctx(), world: w }, 'n4')).toEqual({ ok: false, reason: 'gated' })
    const withKey = { inventory: { ...emptyInventory(), stacks: { key: 1 } }, spirit: 100, world: w }
    const r = canMove(map, w, withKey, 'n4')
    expect(r.ok).toBe(true)
  })

  it('classifies an already-visited adjacent node as a revisit', () => {
    const w = { ...world(), current: 'n2', visited: ['n0', 'n1', 'n2'] }
    const back = canMove(map, w, { ...ctx(), world: w }, 'n1')
    expect(back.ok && back.visit).toBe('revisit')
  })

  it('rejects moving while still unplaced (no entry chosen yet)', () => {
    const w = { ...world(), current: '', visited: [] }
    expect(canMove(map, w, { ...ctx(), world: w }, 'n1')).toEqual({ ok: false, reason: 'unplaced' })
  })
})

describe('mapEntrances', () => {
  it('defaults to [entrance] when no entrances are declared', () => {
    expect(mapEntrances(map)).toEqual(['n0'])
  })
})

describe('advance-block: an uncleared battle bars the way onward', () => {
  // the test mesh n2 is a combat node; standing on it uncleared, you cannot push on to a NEW node…
  it('blocks stepping past an uncleared combat node to an unvisited node', () => {
    const w = { ...world(), current: 'n2', visited: ['n0', 'n1', 'n2'] }
    expect(canMove(map, w, { ...ctx(), world: w }, 'n3')).toEqual({ ok: false, reason: 'blocked' })
  })
  // …but you may always RETREAT to a node you've already visited and try another route…
  it('still allows retreating to an already-visited node', () => {
    const w = { ...world(), current: 'n2', visited: ['n0', 'n1', 'n2'] }
    const back = canMove(map, w, { ...ctx(), world: w }, 'n1')
    expect(back.ok && back.visit).toBe('revisit')
  })
  // …and once the battle is won, the way onward opens.
  it('opens the way once the battle is cleared', () => {
    const w = { ...world(), current: 'n2', visited: ['n0', 'n1', 'n2'], cleared: ['n2'] }
    expect(canMove(map, w, { ...ctx(), world: w }, 'n3').ok).toBe(true)
  })
})
