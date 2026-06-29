import { describe, expect, it } from 'vitest'
import { pickIntent } from './ai'
import type { Combatant } from './types'

const mk = (over: Partial<Combatant> = {}): Combatant => ({
  id: 'e',
  faction: 'enemy',
  archetype: 'test',
  isHuman: true,
  alive: true,
  hp: 100,
  maxHp: 100,
  block: 0,
  side: 'right',
  row: 'front',
  stats: { maxHp: 100, attack: 10, speed: 0 },
  scale: 1,
  statuses: [],
  ...over,
})

describe('pickIntent — default (no profile)', () => {
  it('a plain enemy attacks for its attack stat', () => {
    expect(pickIntent(mk(), { round: 1 })).toEqual({ kind: 'attack', value: 10 })
  })
  it('a demon just attacks with its attack stat (dread is gone)', () => {
    expect(pickIntent(mk({ isDemon: true }), { round: 1 })).toEqual({ kind: 'attack', value: 10 })
  })
  it('a bound enemy wastes its turn (special), taking precedence over a profile', () => {
    const e = mk({ aiProfileId: 'goliath', statuses: [{ id: 'bound', stacks: 1 }] })
    expect(pickIntent(e, { round: 2 })).toEqual({ kind: 'special', value: 0 })
  })
  it('an unknown profile falls back to default behavior', () => {
    expect(pickIntent(mk({ aiProfileId: 'nope' }), { round: 1 })).toEqual({ kind: 'attack', value: 10 })
  })
})

describe('goliath profile', () => {
  const g = (round: number, over: Partial<Combatant> = {}) => pickIntent(mk({ aiProfileId: 'goliath', stats: { maxHp: 100, attack: 12, speed: 0 }, ...over }), { round })

  it('cycles brace → smash(×3) → guard while healthy, on a 1-based round', () => {
    expect(g(1)).toEqual({ kind: 'buff', status: 'strength', stacks: 2 })
    expect(g(2)).toEqual({ kind: 'attackMulti', value: 12, hits: 3 })
    expect(g(3)).toEqual({ kind: 'block', value: 12 })
    expect(g(4)).toEqual({ kind: 'buff', status: 'strength', stacks: 2 }) // wraps
  })

  it('enrages below half HP: no guard, harder smashes (×4), bigger buff', () => {
    const enraged = { hp: 100, maxHp: 340 } // 100*2 < 340
    expect(g(1, enraged)).toEqual({ kind: 'buff', status: 'strength', stacks: 3 })
    expect(g(2, enraged)).toEqual({ kind: 'attackMulti', value: 12, hits: 4 })
    expect(g(3, enraged)).toEqual({ kind: 'attackMulti', value: 12, hits: 4 })
  })

  it('the enrage boundary is strictly below half (hp*2 < maxHp)', () => {
    expect(g(1, { hp: 50, maxHp: 100 })).toEqual({ kind: 'buff', status: 'strength', stacks: 2 }) // exactly half → not enraged
    expect(g(1, { hp: 49, maxHp: 100 })).toEqual({ kind: 'buff', status: 'strength', stacks: 3 }) // below half → enraged
  })
})

describe('champion profile', () => {
  const c = (round: number, over: Partial<Combatant> = {}) => pickIntent(mk({ aiProfileId: 'champion', ...over }), { round })
  it('weakens then strikes; enrages to vulnerable + double damage', () => {
    expect(c(1)).toEqual({ kind: 'debuff', status: 'weak', stacks: 2 })
    expect(c(2)).toEqual({ kind: 'attack', value: 10 })
    expect(c(1, { hp: 10, maxHp: 100 })).toEqual({ kind: 'debuff', status: 'vulnerable', stacks: 2 })
    expect(c(2, { hp: 10, maxHp: 100 })).toEqual({ kind: 'attack', value: 20 })
  })
})

describe('dreadSpirit profile', () => {
  const d = (round: number, over: Partial<Combatant> = {}) => pickIntent(mk({ aiProfileId: 'dreadSpirit', isDemon: true, ...over }), { round })
  it('sows clutter, curses with vulnerability, then strikes into the opening', () => {
    expect(d(1)).toEqual({ kind: 'clutter', value: 1 })
    expect(d(2)).toEqual({ kind: 'debuff', status: 'vulnerable', stacks: 1 })
    expect(d(3)).toEqual({ kind: 'attack', value: 10 })
  })
  it('enraged (below half HP) it sows more clutter', () => {
    expect(d(1, { hp: 10, maxHp: 100 })).toEqual({ kind: 'clutter', value: 2 })
  })
  it('the curse alternates to poison on the second full cycle (round 5)', () => {
    expect(d(5)).toEqual({ kind: 'debuff', status: 'poison', stacks: 2 }) // (5-1)/3 = 1 → poison pass
  })
})

describe('per-archetype profiles (selected at encounter build)', () => {
  it('soldier: gathers Strength, attacks, guards — enraged it drops the guard', () => {
    const s = (round: number, over: Partial<Combatant> = {}) => pickIntent(mk({ aiProfileId: 'soldier', ...over }), { round })
    expect(s(1)).toEqual({ kind: 'buff', status: 'strength', stacks: 1 })
    expect(s(2)).toEqual({ kind: 'attack', value: 10 })
    expect(s(3)).toEqual({ kind: 'block', value: 8 })
    // enraged → 2-step [buff, attack]: round 3 wraps to buff
    expect(s(3, { hp: 10, maxHp: 100 })).toEqual({ kind: 'buff', status: 'strength', stacks: 1 })
  })

  it('archer: pokes twice then MARKS the hero Vulnerable (sets up the brutes)', () => {
    const a = (round: number) => pickIntent(mk({ aiProfileId: 'archer' }), { round })
    expect(a(1)).toEqual({ kind: 'attack', value: 10 })
    expect(a(3)).toEqual({ kind: 'debuff', status: 'vulnerable', stacks: 1 })
  })

  it('shieldGuard: braces then jabs (the line-screen is its Aegis power, not the intent)', () => {
    const g = (round: number) => pickIntent(mk({ aiProfileId: 'shieldGuard' }), { round })
    expect(g(1)).toEqual({ kind: 'block', value: 13 }) // round(10×1.25)
    expect(g(2)).toEqual({ kind: 'attack', value: 10 })
  })

  it('opportunist (robber): mugs, mugs, guards — cornered it just attacks', () => {
    const o = (round: number, over: Partial<Combatant> = {}) => pickIntent(mk({ aiProfileId: 'opportunist', ...over }), { round })
    expect(o(3)).toEqual({ kind: 'block', value: 8 })
    expect(o(3, { hp: 10, maxHp: 100 })).toEqual({ kind: 'attack', value: 10 })
  })

  it('skirmisher (thief): jabs then snatches (clutter)', () => {
    expect(pickIntent(mk({ aiProfileId: 'skirmisher' }), { round: 2 })).toEqual({ kind: 'clutter', value: 1 })
  })

  it('tormentor (generic demon): weakens, poisons, then strikes', () => {
    const t = (round: number) => pickIntent(mk({ aiProfileId: 'tormentor', isDemon: true }), { round })
    expect(t(1)).toEqual({ kind: 'debuff', status: 'weak', stacks: 1 })
    expect(t(2)).toEqual({ kind: 'debuff', status: 'poison', stacks: 2 })
    expect(t(3)).toEqual({ kind: 'attack', value: 10 })
  })

  it('greed: drains+poisons, and only BINDS when enraged (gated, never the round it attacks)', () => {
    const g = (round: number, over: Partial<Combatant> = {}) => pickIntent(mk({ aiProfileId: 'greed', isDemon: true, ...over }), { round })
    expect(g(1)).toEqual({ kind: 'debuff', status: 'weak', stacks: 1 }) // healthy → weak
    expect(g(1, { hp: 10, maxHp: 100 })).toEqual({ kind: 'debuff', status: 'bound', stacks: 1 }) // enraged → bind
    expect(g(3, { hp: 10, maxHp: 100 })).toEqual({ kind: 'attack', value: 10 }) // the attack step is never a bind
  })

  it('accuser: clutters, curses Vulnerable, strikes, poisons (4-step)', () => {
    const a = (round: number) => pickIntent(mk({ aiProfileId: 'accuser', isDemon: true }), { round })
    expect(a(1)).toEqual({ kind: 'clutter', value: 1 })
    expect(a(2)).toEqual({ kind: 'debuff', status: 'vulnerable', stacks: 1 })
    expect(a(3)).toEqual({ kind: 'attack', value: 10 })
    expect(a(4)).toEqual({ kind: 'debuff', status: 'poison', stacks: 2 })
  })

  it('idol: poisons the hero then jabs (its rally is the War-Leader power)', () => {
    const i = (round: number) => pickIntent(mk({ aiProfileId: 'idol', isDemon: true }), { round })
    expect(i(1)).toEqual({ kind: 'debuff', status: 'poison', stacks: 1 })
    expect(i(2)).toEqual({ kind: 'attack', value: 10 })
  })

  it('is deterministic for a given (profile, round, hp)', () => {
    const a = mk({ aiProfileId: 'accuser', isDemon: true })
    expect(pickIntent(a, { round: 6 })).toEqual(pickIntent(a, { round: 6 }))
  })
})
