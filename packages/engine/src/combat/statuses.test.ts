import { describe, expect, it } from 'vitest'
import type { CardDef, CardInstance } from '../cards/types'
import { seedRng } from '../rng/rng'
import { ensureActing, endTurn, playCard, startCombat, type CombatInit } from './combat'
import type { Combatant } from './types'

// Phase-1 status mechanics: poison (DoT), dexterity (block-scaling), and the activated `bound` lock.

const CARDS: Record<string, CardDef> = {
  guard: { id: 'guard', type: 'skill', layer: 'flesh', cost: 1, target: 'self', nameKey: '', textKey: '', effects: [{ kind: 'block', amount: 5 }] },
  poisonFoe: { id: 'poisonFoe', type: 'skill', layer: 'flesh', cost: 1, target: 'enemy', nameKey: '', textKey: '', effects: [{ kind: 'applyStatus', status: 'poison', stacks: 4 }] },
  selfPoison: { id: 'selfPoison', type: 'skill', layer: 'flesh', cost: 1, target: 'self', nameKey: '', textKey: '', effects: [{ kind: 'applyStatus', status: 'poison', stacks: 4, target: 'self' }] },
  dexBuff: { id: 'dexBuff', type: 'skill', layer: 'flesh', cost: 1, target: 'self', nameKey: '', textKey: '', effects: [{ kind: 'applyStatus', status: 'dexterity', stacks: 1, target: 'self' }] },
  bindFoe: { id: 'bindFoe', type: 'skill', layer: 'flesh', cost: 1, target: 'enemy', nameKey: '', textKey: '', effects: [{ kind: 'applyStatus', status: 'bound', stacks: 1 }] },
  poisonToll: { id: 'poisonToll', type: 'skill', layer: 'flesh', cost: 1, target: 'enemy', nameKey: '', textKey: '', effects: [{ kind: 'applyStatus', status: 'poison', stacks: 4 }, { kind: 'spiritShift', amount: -15, reason: 'sowedAffliction' }] },
}

const hero = (over: Partial<Combatant> = {}): Combatant => ({
  id: 'hero', faction: 'party', archetype: 'hero', isHuman: true, alive: true, hp: 30, maxHp: 50, block: 0, side: 'left', row: 'front', stats: { maxHp: 50, attack: 0, speed: 5 }, scale: 1, statuses: [], memberId: 'm-hero', contributesEnergy: 4, graceAbilityIds: [], ...over,
})
const foe = (over: Partial<Combatant> = {}): Combatant => ({
  id: 'foe', faction: 'enemy', archetype: 'dummy', isHuman: false, alive: true, hp: 100, maxHp: 100, block: 0, side: 'right', row: 'front', stats: { maxHp: 100, attack: 6, speed: 1 }, scale: 1, statuses: [], ...over,
})

const deck = (defs: string[]): CardInstance[] => defs.map((d, i) => ({ iid: `i${i}-${d}`, defId: d, ownerId: 'm-hero' }))
const init = (defs: string[], over: Partial<CombatInit> = {}): CombatInit => ({
  rng: seedRng('st'), party: [hero()], enemies: [foe()], deck: deck(defs), cardDefs: CARDS,
  energyMax: 4, graceMax: 0, flags: { mandatory: false, allowFlee: true, isBoss: false },
  winCondition: { kind: 'allEnemiesDefeated' }, nodeId: 'n', encounterId: 'e', ...over,
})
const begin = (i: CombatInit) => ensureActing(startCombat(i).combat).combat
const iid = (c: ReturnType<typeof begin>, defId: string) => c.hand.find((x) => x.defId === defId)!.iid
const fill = (...defs: string[]): string[] => [...defs, 'guard', 'guard', 'guard', 'guard', 'guard'].slice(0, Math.max(5, defs.length))

describe('poison (damage over time)', () => {
  it('ticks for its stacks at round resolve, then wanes by 1', () => {
    let c = begin(init(fill('poisonFoe')))
    c = playCard(c, iid(c, 'poisonFoe'), 'foe', 0).combat
    expect(c.combatants.foe!.statuses.find((s) => s.id === 'poison')?.stacks).toBe(4)

    c = endTurn(c, 0).combat // round resolve → tick 4
    expect(c.combatants.foe!.hp).toBe(96)
    expect(c.combatants.foe!.statuses.find((s) => s.id === 'poison')?.stacks).toBe(3)

    c = endTurn(c, 0).combat // tick 3
    expect(c.combatants.foe!.hp).toBe(93)
    expect(c.combatants.foe!.statuses.find((s) => s.id === 'poison')?.stacks).toBe(2)
  })

  it('scales with the afflicted combatant level (poison × scale)', () => {
    let c = begin(init(fill('poisonFoe'), { enemies: [foe({ scale: 2 })] }))
    c = playCard(c, iid(c, 'poisonFoe'), 'foe', 0).combat
    c = endTurn(c, 0).combat
    expect(c.combatants.foe!.hp).toBe(100 - 4 * 2) // 92
  })

  it('bypasses block entirely (hits HP, leaves the block pool intact)', () => {
    // self-poison on the hero + a guard: the enemy hits 1 (absorbed), then poison ticks straight to HP.
    let c = begin(init(fill('selfPoison', 'guard'), { enemies: [foe({ stats: { maxHp: 100, attack: 0, speed: 1 } })] }))
    c = playCard(c, iid(c, 'guard'), undefined, 0).combat // block 5
    c = playCard(c, iid(c, 'selfPoison'), undefined, 0).combat // poison 4 on self
    const hp0 = c.combatants.hero!.hp
    const r = endTurn(c, 0) // enemy hits 1 (into block); poison 4 → straight to HP, bypassing block
    // Had poison gone through the (>4) block pool it would be fully absorbed; instead HP drops by 4.
    expect(r.combat.combatants.hero!.hp).toBe(hp0 - 4)
    const poisonHit = r.events.find((e) => e.type === 'damageDealt' && e.targetId === 'hero' && e.amount === 4)
    expect(poisonHit && 'blocked' in poisonHit ? poisonHit.blocked : -1).toBe(0)
  })

  it('is lethal and griefs Spirit when it finishes a human enemy', () => {
    let c = begin(init(fill('poisonFoe'), { enemies: [foe({ isHuman: true, hp: 3, maxHp: 30, stats: { maxHp: 30, attack: 2, speed: 1 } })] }))
    c = playCard(c, iid(c, 'poisonFoe'), 'foe', 0).combat
    const r = endTurn(c, 0) // tick 4 → kills the human
    expect(r.combat.combatants.foe!.alive).toBe(false)
    expect(r.combat.humansKilled).toBe(1)
    expect(r.spiritEvents.some((e) => e.kind === 'killHuman')).toBe(true)
  })
})

describe('poison as temptation (Spirit toll)', () => {
  it('playing a poison card emits a negative moralChoice Spirit event', () => {
    let c = begin(init(fill('poisonToll')))
    const r = playCard(c, iid(c, 'poisonToll'), 'foe', 0)
    const toll = r.spiritEvents.find((e) => e.kind === 'moralChoice')
    expect(toll && 'delta' in toll ? toll.delta : 0).toBe(-15)
    c = r.combat
    expect(c.combatants.foe!.statuses.find((s) => s.id === 'poison')?.stacks).toBe(4) // still poisons
  })
})

describe('dexterity (block-scaling buff)', () => {
  it('adds stacks × scale to block gained from cards', () => {
    let c = begin(init(fill('dexBuff', 'guard')))
    c = playCard(c, iid(c, 'dexBuff'), undefined, 0).combat // +1 dexterity
    c = playCard(c, iid(c, 'guard'), undefined, 0).combat // 5 + 1*scale(1) = 6
    expect(c.combatants.hero!.block).toBe(6)
  })

  it('persists across rounds (not decayed by tickStatuses)', () => {
    let c = begin(init(fill('dexBuff', 'guard', 'guard')))
    c = playCard(c, iid(c, 'dexBuff'), undefined, 0).combat
    c = endTurn(c, 0).combat // round resolve ticks statuses
    expect(c.combatants.hero!.statuses.find((s) => s.id === 'dexterity')?.stacks).toBe(1)
    c = ensureActing(c).combat
    c = playCard(c, iid(c, 'guard'), undefined, 0).combat
    expect(c.combatants.hero!.block).toBe(6) // dexterity still applies next round
  })
})

describe('bound (turn-skip lock)', () => {
  it('makes the enemy skip its next turn and spends a stack', () => {
    let c = begin(init(fill('bindFoe'), { enemies: [foe({ stats: { maxHp: 100, attack: 12, speed: 1 } })] }))
    const hp0 = c.combatants.hero!.hp
    c = playCard(c, iid(c, 'bindFoe'), 'foe', 0).combat
    c = endTurn(c, 0).combat // enemy is bound → skips its attack
    expect(c.combatants.hero!.hp).toBe(hp0) // took no damage
    expect(c.combatants.foe!.statuses.find((s) => s.id === 'bound')).toBeUndefined() // stack spent
  })
})
