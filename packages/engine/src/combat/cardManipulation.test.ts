import { describe, expect, it } from 'vitest'
import type { CardDef, CardInstance } from '../cards/types'
import { seedRng } from '../rng/rng'
import { endTurn, ensureActing, playCard, startCombat, type CombatInit } from './combat'
import type { Combatant } from './types'

// ---- fixtures ----------------------------------------------------------------------------

const CARDS: Record<string, CardDef> = {
  strike: { id: 'strike', type: 'attack', layer: 'flesh', cost: 1, target: 'enemy', nameKey: '', textKey: '', upgradeTo: 'strike_plus', effects: [{ kind: 'damage', amount: 6 }] },
  strike_plus: { id: 'strike_plus', type: 'attack', layer: 'flesh', cost: 1, target: 'enemy', nameKey: '', textKey: '', upgradeTo: 'strike_plus_plus', effects: [{ kind: 'damage', amount: 9 }] },
  strike_plus_plus: { id: 'strike_plus_plus', type: 'attack', layer: 'flesh', cost: 1, target: 'enemy', nameKey: '', textKey: '', effects: [{ kind: 'damage', amount: 12 }] },
  guard: { id: 'guard', type: 'skill', layer: 'flesh', cost: 1, target: 'self', nameKey: '', textKey: '', effects: [{ kind: 'block', amount: 5 }] },
  sharpen: { id: 'sharpen', type: 'skill', layer: 'flesh', cost: 1, target: 'none', nameKey: '', textKey: '', effects: [{ kind: 'hone', count: 1 }] },
  cast_off: { id: 'cast_off', type: 'skill', layer: 'flesh', cost: 1, target: 'none', exhaust: true, nameKey: '', textKey: '', effects: [{ kind: 'exhaustChosen', count: 2 }] },
  prepare: { id: 'prepare', type: 'skill', layer: 'flesh', cost: 0, target: 'none', nameKey: '', textKey: '', effects: [{ kind: 'topDeck', count: 1 }] },
  spike: { id: 'spike', type: 'status', layer: 'flesh', cost: 0, target: 'none', unplayable: true, nameKey: '', textKey: '', effects: [] },
}

const deck = (defs: string[], owner = 'm-hero'): CardInstance[] =>
  defs.map((d, i) => ({ iid: `${owner}-${i}-${d}`, defId: d, ownerId: owner }))

const hero = (over: Partial<Combatant> = {}): Combatant => ({
  id: 'hero', faction: 'party', archetype: 'hero', isHuman: true, alive: true,
  hp: 50, maxHp: 50, block: 0, side: 'left', row: 'front',
  stats: { maxHp: 50, attack: 2, speed: 5 }, scale: 1, statuses: [],
  memberId: 'm-hero', contributesEnergy: 3, graceAbilityIds: [], ...over,
})

const foe = (over: Partial<Combatant> = {}): Combatant => ({
  id: 'foe', faction: 'enemy', archetype: 'foe', isHuman: false, alive: true,
  hp: 50, maxHp: 50, block: 0, side: 'right', row: 'front',
  stats: { maxHp: 50, attack: 3, speed: 1 }, scale: 1, statuses: [], ...over,
})

const mkInit = (deckDefs: string[], over: Partial<CombatInit> = {}): CombatInit => ({
  rng: seedRng('card-manip'),
  party: [hero()],
  enemies: [foe()],
  deck: deck(deckDefs),
  cardDefs: CARDS,
  energyMax: 3,
  graceMax: 0,
  flags: { mandatory: false, allowFlee: false, isBoss: false },
  winCondition: { kind: 'allEnemiesDefeated' },
  nodeId: 'n', encounterId: 'e',
  ...over,
})

const iidOf = (combat: ReturnType<typeof startCombat>['combat'], defId: string): string =>
  combat.hand.find((c) => c.defId === defId)!.iid

// ---- hone (Sharpen) ----------------------------------------------------------------------

describe('hone (Sharpen)', () => {
  it('upgrades a chosen card to its + form for the rest of the battle', () => {
    let { combat } = startCombat(mkInit(['sharpen', 'strike', 'strike', 'guard', 'strike']))
    combat = ensureActing(combat).combat
    const target = iidOf(combat, 'strike')

    const r = playCard(combat, iidOf(combat, 'sharpen'), undefined, 0, [target])
    combat = r.combat
    expect(r.events).toContainEqual({ type: 'cardsHoned', iids: [target] })
    expect(combat.hand.find((c) => c.iid === target)!.honedDefId).toBe('strike_plus')
  })

  it('the honed copy then strikes for its + damage (9, not 6)', () => {
    let { combat } = startCombat(mkInit(['sharpen', 'strike', 'strike', 'guard', 'strike']))
    combat = ensureActing(combat).combat
    const target = iidOf(combat, 'strike')
    combat = playCard(combat, iidOf(combat, 'sharpen'), undefined, 0, [target]).combat
    combat = playCard(combat, target, 'foe', 0).combat
    expect(combat.combatants.foe!.hp).toBe(50 - 9)
  })

  it('only upgradeable cards qualify (guard has no + form → no-op)', () => {
    let { combat } = startCombat(mkInit(['sharpen', 'guard', 'guard', 'guard', 'guard']))
    combat = ensureActing(combat).combat
    const guardIid = iidOf(combat, 'guard')
    const r = playCard(combat, iidOf(combat, 'sharpen'), undefined, 0, [guardIid])
    combat = r.combat
    expect(combat.hand.find((c) => c.iid === guardIid)?.honedDefId).toBeUndefined()
    expect(r.events.some((e) => e.type === 'cardsHoned')).toBe(false)
  })

  it('climbs a multi-level chain across plays (strike → + → ++)', () => {
    let { combat } = startCombat(mkInit(['sharpen', 'sharpen', 'strike', 'strike', 'strike']))
    combat = ensureActing(combat).combat
    const target = iidOf(combat, 'strike')
    combat = playCard(combat, iidOf(combat, 'sharpen'), undefined, 0, [target]).combat
    expect(combat.hand.find((c) => c.iid === target)!.honedDefId).toBe('strike_plus')
    combat = playCard(combat, iidOf(combat, 'sharpen'), undefined, 0, [target]).combat
    expect(combat.hand.find((c) => c.iid === target)!.honedDefId).toBe('strike_plus_plus')
  })
})

// ---- exhaustChosen (Cast Off) ------------------------------------------------------------

describe('exhaustChosen (Cast Off)', () => {
  it('banishes chosen cards to the exhaust pile and clears them from circulation', () => {
    let { combat } = startCombat(mkInit(['cast_off', 'strike', 'guard', 'strike', 'guard']))
    combat = ensureActing(combat).combat
    const a = combat.hand.find((c) => c.defId === 'strike')!.iid
    const b = combat.hand.find((c) => c.defId === 'guard')!.iid

    const r = playCard(combat, iidOf(combat, 'cast_off'), undefined, 0, [a, b])
    combat = r.combat
    expect(r.events).toContainEqual({ type: 'cardsExhausted', iids: [a, b] })
    const exhaustIids = combat.exhaustPile.map((c) => c.iid)
    expect(exhaustIids).toEqual(expect.arrayContaining([a, b]))
    // the chosen cards are gone from hand/draw/discard
    const live = [...combat.hand, ...combat.drawPile, ...combat.discardPile].map((c) => c.iid)
    expect(live).not.toContain(a)
    expect(live).not.toContain(b)
  })
})

// ---- topDeck (Prepare the Way) -----------------------------------------------------------

describe('topDeck (Prepare the Way)', () => {
  it('places a chosen card on TOP of the draw pile (drawn first next round)', () => {
    let { combat } = startCombat(mkInit(['prepare', 'strike', 'guard', 'strike', 'guard', 'strike', 'strike']))
    combat = ensureActing(combat).combat
    expect(combat.drawPile.length).toBeGreaterThan(0) // there is a pile to sit on top of
    const target = combat.hand.find((c) => c.defId === 'strike')!.iid

    combat = playCard(combat, iidOf(combat, 'prepare'), undefined, 0, [target]).combat
    expect(combat.drawPile[0]!.iid).toBe(target)
    expect(combat.hand.some((c) => c.iid === target)).toBe(false)
  })
})

// ---- unplayable clutter (Spike) ----------------------------------------------------------

describe('unplayable clutter (Spike)', () => {
  it('cannot be played — playCard rejects it and the card stays in hand', () => {
    let { combat } = startCombat(mkInit(['spike', 'strike', 'guard', 'strike', 'guard']))
    combat = ensureActing(combat).combat
    const spikeIid = iidOf(combat, 'spike')
    const r = playCard(combat, spikeIid, undefined, 0)
    expect(r.events).toContainEqual({ type: 'rejected', reason: 'card-unplayable' })
    expect(r.combat.hand.some((c) => c.iid === spikeIid)).toBe(true)
  })
})

// ---- enemy clutter injection -------------------------------------------------------------

describe('enemy clutter injection (Spirit of Dread)', () => {
  it('injects Spike cards into the party discard pile on the enemy turn', () => {
    let { combat } = startCombat(mkInit(['strike', 'guard', 'strike', 'guard', 'strike'], { enemies: [foe({ aiProfileId: 'dreadSpirit', isDemon: true, hp: 80, maxHp: 80 })] }))
    expect(combat.combatants.foe!.intent?.kind).toBe('clutter') // round-1 telegraph
    combat = ensureActing(combat).combat
    const before = combat.discardPile.filter((c) => c.defId === 'spike').length
    combat = endTurn(combat, 0).combat
    const injected = combat.discardPile.filter((c) => c.defId === 'spike')
    expect(injected.length).toBeGreaterThan(before)
    expect(injected.every((c) => c.ownerId === 'm-hero')).toBe(true) // purge-safe owner
  })
})
