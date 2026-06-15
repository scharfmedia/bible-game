import { describe, expect, it } from 'vitest'
import { miracleChance } from '../spirit/spirit'
import { seedRng } from '../rng/rng'
import { ensureActing, playCard, startCombat, type CombatInit } from './combat'
import type { Combatant } from './types'
import type { CardDef, CardInstance } from '../cards/types'

describe('miracleChance — ramps with the walk', () => {
  it('carnal → floor, radiant → cap, monotonic', () => {
    expect(miracleChance(0, 0.1, 0.85)).toBeCloseTo(0.1) // potency 0
    expect(miracleChance(1000, 0.1, 0.85)).toBeCloseTo(0.85) // potency 5 (max)
    expect(miracleChance(500, 0.1, 0.85)).toBeGreaterThan(miracleChance(100, 0.1, 0.85))
  })
})

const CARDS: Record<string, CardDef> = {
  fingerOfGod: { id: 'fingerOfGod', type: 'verse', layer: 'spirit', cost: 1, target: 'none', exhaust: true, nameKey: '', textKey: '', effects: [{ kind: 'banish', floor: 1, cap: 1 }] }, // guaranteed
  dud: { id: 'dud', type: 'verse', layer: 'spirit', cost: 1, target: 'none', nameKey: '', textKey: '', effects: [{ kind: 'banish', floor: 0, cap: 0 }] }, // never
  strike: { id: 'strike', type: 'attack', layer: 'flesh', cost: 1, target: 'enemy', nameKey: '', textKey: '', effects: [{ kind: 'damage', amount: 6 }] },
}

const hero = (): Combatant => ({
  id: 'hero', faction: 'party', archetype: 'hero', isHuman: true, alive: true, hp: 50, maxHp: 50, block: 0,
  side: 'left', row: 'front', stats: { maxHp: 50, attack: 0, speed: 5 }, scale: 1, statuses: [], memberId: 'm-hero', contributesEnergy: 4, graceAbilityIds: [],
})
const foe = (id: string, over: Partial<Combatant> = {}): Combatant => ({
  id, faction: 'enemy', archetype: 'foe', isHuman: false, alive: true, hp: 30, maxHp: 30, block: 0,
  side: 'right', row: 'front', stats: { maxHp: 30, attack: 3, speed: 1 }, scale: 1, statuses: [], ...over,
})

const deck = (defs: string[]): CardInstance[] => defs.map((d, i) => ({ iid: `i${i}-${d}`, defId: d, ownerId: 'm-hero' }))
const init = (enemies: Combatant[]): CombatInit => ({
  rng: seedRng('miracle'), party: [hero()], enemies, deck: deck(['fingerOfGod', 'dud', 'strike', 'strike', 'strike']),
  cardDefs: CARDS, energyMax: 4, graceMax: 0, flags: { mandatory: false, allowFlee: true, isBoss: false },
  winCondition: { kind: 'allEnemiesDefeated' }, nodeId: 'n', encounterId: 'e',
})
const begin = (i: CombatInit) => ensureActing(startCombat(i).combat).combat
const iidOf = (c: ReturnType<typeof begin>, d: string) => c.hand.find((x) => x.defId === d)!.iid
const aliveEnemies = (c: ReturnType<typeof begin>) => c.enemyOrder.filter((id) => c.combatants[id]!.alive)

describe('banish — Finger of God', () => {
  it('removes one (non-immune) enemy on a successful roll', () => {
    let c = begin(init([foe('a'), foe('b')]))
    c = playCard(c, iidOf(c, 'fingerOfGod'), undefined, 1000).combat
    expect(aliveEnemies(c).length).toBe(1) // one banished
  })

  it('a failed roll banishes no one', () => {
    let c = begin(init([foe('a'), foe('b')]))
    c = playCard(c, iidOf(c, 'dud'), undefined, 1000).combat
    expect(aliveEnemies(c).length).toBe(2)
  })

  it('cannot banish a banishImmune boss (it survives even when chosen)', () => {
    let c = begin(init([foe('boss', { banishImmune: true })]))
    c = playCard(c, iidOf(c, 'fingerOfGod'), undefined, 1000).combat
    expect(c.combatants.boss!.alive).toBe(true)
    expect(c.outcome).toBe('ongoing')
  })

  it('banishing the last enemy ends the fight bloodlessly (peaceful — no human-kill grief)', () => {
    let c = begin(init([foe('only')]))
    c = playCard(c, iidOf(c, 'fingerOfGod'), undefined, 1000).combat
    expect(c.combatants.only!.alive).toBe(false)
    expect(c.outcome).toBe('peaceful') // a win, and no one was killed
    expect(c.humansKilled).toBe(0)
  })
})
