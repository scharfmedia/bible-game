import { describe, expect, it } from 'vitest'
import { emptyInventory } from '../inventory/types'
import { testContent } from '../testing/fixtures'
import { evalGate } from './gate'
import { canMove } from './movement'
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
  it('allows a forward step to an adjacent node', () => {
    const r = canMove(map, world(), ctx(), 'n1')
    expect(r.ok).toBe(true)
    expect(r.ok && r.direction).toBe('forward')
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

  it('only permits backward steps to already-seen nodes', () => {
    const w = { ...world(), current: 'n2', visited: ['n0', 'n1', 'n2'] }
    const back = canMove(map, w, { ...ctx(), world: w }, 'n1')
    expect(back.ok && back.direction).toBe('backward')
    const wUnseen = { ...world(), current: 'n2', visited: ['n2'] }
    expect(canMove(map, wUnseen, { ...ctx(), world: wUnseen }, 'n1')).toEqual({ ok: false, reason: 'not-seen' })
  })
})
