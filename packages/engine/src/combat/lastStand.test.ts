import { describe, expect, it } from 'vitest'
import type { CardDef, CardInstance } from '../cards/types'
import { seedRng } from '../rng/rng'
import { endTurn, ensureActing, playCard, startCombat, type CombatInit } from './combat'
import { statusStacks } from './damage'
import type { Combatant } from './types'

// "Last stand" rally: the instant a flagged foe becomes the SOLE living enemy of a multi-enemy fight
// it gains the `lastStand` buff (deals ×2, takes ×½) and steps to the front.

const CARDS: Record<string, CardDef> = {
  strike: { id: 'strike', type: 'attack', layer: 'flesh', cost: 1, target: 'enemy', nameKey: '', textKey: '', effects: [{ kind: 'damage', amount: 6 }] },
}
const deck = (n: number, owner = 'm-hero'): CardInstance[] =>
  Array.from({ length: n }, (_, i) => ({ iid: `${owner}-${i}`, defId: 'strike', ownerId: owner }))

const hero: Combatant = {
  id: 'hero', faction: 'party', archetype: 'hero', isHuman: true, alive: true, hp: 50, maxHp: 50,
  block: 0, side: 'left', row: 'front', stats: { maxHp: 50, attack: 2, speed: 5 }, scale: 1, statuses: [],
  memberId: 'm-hero', contributesEnergy: 3, graceAbilityIds: [],
}
const foe = (id: string, over: Partial<Combatant> = {}): Combatant => ({
  id, faction: 'enemy', archetype: 'soldier', isHuman: true, alive: true, hp: 30, maxHp: 30,
  block: 0, side: 'right', row: 'front', stats: { maxHp: 30, attack: 5, speed: 3 }, scale: 1, statuses: [], ...over,
})

const init = (over: Partial<CombatInit> = {}): CombatInit => ({
  rng: seedRng('laststand'),
  party: [hero],
  enemies: [foe('foeA', { hp: 6, maxHp: 6 }), foe('foeB', { lastStandWhenAlone: true })],
  deck: deck(5),
  cardDefs: CARDS,
  energyMax: 3,
  graceMax: 0,
  flags: { mandatory: false, allowFlee: true, isBoss: false },
  winCondition: { kind: 'allEnemiesDefeated' },
  nodeId: 'n', encounterId: 'e',
  ...over,
})
// startCombat opens in the decision window; entering the action phase draws the opening hand.
const start = (over: Partial<CombatInit> = {}) => ensureActing(startCombat(init(over)).combat).combat
const strikeIid = (c: ReturnType<typeof startCombat>['combat']) => c.hand.find((x) => x.defId === 'strike')!.iid

describe('last-stand rally (sole-surviving-foe trigger)', () => {
  it('does NOT rally while more than one enemy is alive', () => {
    const combat = start({ enemies: [foe('foeA', { lastStandWhenAlone: true }), foe('foeB', { lastStandWhenAlone: true })] })
    expect(statusStacks(combat.combatants.foeA!, 'lastStand')).toBe(0)
    expect(statusStacks(combat.combatants.foeB!, 'lastStand')).toBe(0)
  })

  it('rallies the last flagged foe standing: gains lastStand, steps to front, emits statusApplied', () => {
    let combat = start()
    const r = playCard(combat, strikeIid(combat), 'foeA', 0) // 6 dmg kills foeA (6 hp)
    combat = r.combat
    expect(combat.combatants.foeA!.alive).toBe(false)
    const foeB = combat.combatants.foeB!
    expect(statusStacks(foeB, 'lastStand')).toBe(1)
    expect(foeB.row).toBe('front')
    expect(r.events).toContainEqual({ type: 'statusApplied', targetId: 'foeB', status: 'lastStand', stacks: 1 })
  })

  it('the rallied foe TAKES HALF: a 6-damage strike does 3', () => {
    let combat = start()
    combat = playCard(combat, strikeIid(combat), 'foeA', 0).combat // foeA dies → foeB rallies
    const before = combat.combatants.foeB!.hp
    combat = playCard(combat, strikeIid(combat), 'foeB', 0).combat
    expect(before - combat.combatants.foeB!.hp).toBe(3) // floor(6 × 0.5)
  })

  it('the rallied foe DEALS DOUBLE: a 5-attack hits for 10', () => {
    let combat = start()
    combat = playCard(combat, strikeIid(combat), 'foeA', 0).combat // foeA dies → foeB rallies
    const hp0 = combat.combatants.hero!.hp
    combat = endTurn(combat, 0).combat // foeB attacks (intent 5 × lastStand 2 = 10)
    expect(hp0 - combat.combatants.hero!.hp).toBe(10)
  })

  it('control: an UNFLAGGED last foe does not rally (full damage, no buff)', () => {
    let combat = start({ enemies: [foe('foeA', { hp: 6, maxHp: 6 }), foe('foeB')] })
    combat = playCard(combat, strikeIid(combat), 'foeA', 0).combat
    const foeB = combat.combatants.foeB!
    expect(statusStacks(foeB, 'lastStand')).toBe(0)
    const before = foeB.hp
    combat = playCard(combat, strikeIid(combat), 'foeB', 0).combat
    expect(before - combat.combatants.foeB!.hp).toBe(6) // full, not halved
  })

  it('the rally persists across rounds (does not decay like weak/vulnerable)', () => {
    let combat = start()
    combat = playCard(combat, strikeIid(combat), 'foeA', 0).combat // rally on
    combat = endTurn(combat, 0).combat // a full round elapses (tickStatuses runs)
    expect(statusStacks(combat.combatants.foeB!, 'lastStand')).toBe(1)
  })
})
