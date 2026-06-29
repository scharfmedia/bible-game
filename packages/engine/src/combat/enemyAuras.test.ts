import { describe, expect, it } from 'vitest'
import type { CardDef } from '../cards/types'
import { seedRng } from '../rng/rng'
import { endTurn, ensureActing, startCombat, type CombatInit } from './combat'
import { statusStacks } from './damage'
import type { Combatant, PowerInstance } from './types'

// Enemy synergies are PERSISTENT POWERS that fire each round while their holder lives (fireEnemyPowers
// → the same hook engine + applyEffect the player's powers use). Their `target:'allAllies'`/'enemy'
// ops resolve RELATIVE to the holder's faction (resolveTargets), so an enemy aura buffs the ENEMY line
// and a party power still hits the enemies. These tests pin that, the "as long as it lives" lifecycle,
// and that auras never leak across the faction line.

const CARDS: Record<string, CardDef> = {
  strike: { id: 'strike', type: 'attack', layer: 'flesh', cost: 1, target: 'enemy', nameKey: '', textKey: '', effects: [{ kind: 'damage', amount: 6 }] },
}

const hero = (over: Partial<Combatant> = {}): Combatant => ({
  id: 'hero', faction: 'party', archetype: 'hero', isHuman: true, alive: true,
  hp: 200, maxHp: 200, block: 0, side: 'left', row: 'front',
  stats: { maxHp: 200, attack: 4, speed: 5 }, scale: 1,
  statuses: [], memberId: 'm-hero', contributesEnergy: 3, graceAbilityIds: [], ...over,
})

const foe = (id: string, over: Partial<Combatant> = {}): Combatant => ({
  id, faction: 'enemy', archetype: 'brute', isHuman: false, alive: true,
  hp: 60, maxHp: 60, block: 0, side: 'right', row: 'front',
  stats: { maxHp: 60, attack: 4, speed: 5 }, scale: 1, statuses: [], ...over,
})

const init = (enemies: Combatant[], party: Combatant[] = [hero()]): CombatInit => ({
  rng: seedRng('enemy-auras'),
  party,
  enemies,
  deck: [{ iid: 'h0', defId: 'strike', ownerId: 'm-hero' }],
  cardDefs: CARDS,
  energyMax: 3,
  graceMax: 1,
  flags: { mandatory: false, allowFlee: false, isBoss: false },
  winCondition: { kind: 'allEnemiesDefeated' },
  nodeId: 'n',
  encounterId: 'e',
})

const aegis = (stacks: number): PowerInstance[] => [{ id: 'aegis', stacks }]
const warleader = (stacks: number): PowerInstance[] => [{ id: 'warleader', stacks }]

describe('Aegis — the shield-bearer line screen (enemy block aura)', () => {
  it('grants Block to the WHOLE enemy line at round start, and never to the party', () => {
    // bearer holds Aegis(3); a plain ally foe; the party should be untouched.
    const c = startCombat(init([foe('bearer', { powers: aegis(3) }), foe('ally')])).combat
    expect(c.combatants.bearer!.block).toBe(3) // stacks × scale(1), includes the holder itself
    expect(c.combatants.ally!.block).toBe(3) // source-relative 'allAllies' → the enemy line
    expect(c.combatants.hero!.block).toBe(0) // aura does NOT cross the faction line
  })

  it('block scales with the holder level (flesh op × scale)', () => {
    const c = startCombat(init([foe('bearer', { powers: aegis(3), scale: 2 }), foe('ally', { scale: 2 })])).combat
    // amount(3) × holder scale(2) on the holder; the ally's own grant uses the holder's op amount × scale too
    expect(c.combatants.bearer!.block).toBe(6)
    expect(c.combatants.ally!.block).toBe(6)
  })

  it('stops screening the round the bearer dies — "as long as it lives"', () => {
    const start = startCombat(init([foe('bearer', { powers: aegis(3) }), foe('ally')])).combat
    // the bearer falls (e.g. focused down); drive a full round so beginRound re-fires the auras
    const bearerDead = { ...start, combatants: { ...start.combatants, bearer: { ...start.combatants.bearer!, alive: false, hp: 0 } } }
    const next = endTurn(ensureActing(bearerDead).combat, 100).combat
    expect(next.roundNumber).toBe(2)
    expect(next.combatants.ally!.block).toBe(0) // reset at the enemy turn, NOT re-granted (bearer gone)
  })
})

describe('War-Leader — the rally aura (enemy strength)', () => {
  it('grants Strength to the enemy line each round and compounds; the party is unaffected', () => {
    const start = startCombat(init([foe('captain', { powers: warleader(1) }), foe('grunt')])).combat
    expect(statusStacks(start.combatants.captain!, 'strength')).toBe(1)
    expect(statusStacks(start.combatants.grunt!, 'strength')).toBe(1) // 'allAllies' → the enemy line
    expect(statusStacks(start.combatants.hero!, 'strength')).toBe(0)

    const next = endTurn(ensureActing(start).combat, 100).combat // round 2 → rally fires again
    expect(next.roundNumber).toBe(2)
    expect(statusStacks(next.combatants.grunt!, 'strength')).toBe(2) // persists + +1/round
  })
})

describe('enemies curse the player (debuff intents through the core)', () => {
  it('an idol poisons the hero on round 1, and the DoT ticks at round resolve', () => {
    // idol round-1 intent = debuff poison(1) (no melee that turn); resolveRound's tickDots deals it.
    const start = startCombat(init([foe('idol', { archetype: 'idolSpirit', aiProfileId: 'idol' })])).combat
    const next = endTurn(ensureActing(start).combat, 100).combat
    expect(next.combatants.hero!.hp).toBe(199) // 200 − 1 poison tick (stacks 1 × scale 1), no attack
  })
})

describe('faction-relative targeting — regression for the player', () => {
  it("a party-held Menace power still weakens the front ENEMY (party source 'enemy' → opposing)", () => {
    const c = startCombat(init([foe('front')], [hero({ powers: [{ id: 'menace', stacks: 1 }] })])).combat
    expect(statusStacks(c.combatants.front!, 'weak')).toBe(1)
    expect(statusStacks(c.combatants.hero!, 'weak')).toBe(0) // the debuff didn't land on its own holder
  })
})
