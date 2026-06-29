import { describe, expect, it } from 'vitest'
import { buildEncounter, newGame, reduce, seedRng, statusStacks, type Command, type GameState } from '@bible/engine'
import { createContent } from './index'

// End-to-end wiring check: a REAL authored encounter (Elah's "champion": champion + shield-bearer +
// archer) must, through buildEncounter, receive its per-archetype AI profiles AND its synergy auras
// (Aegis line-screen, War-Leader rally) with no per-template authoring — and those auras must screen /
// rally the ENEMY line only, never the party. (Unit tests cover the engine; this covers the content→
// builder→combat seam that turns archetypes into behavior.)

const content = createContent()
const dispatch = (s: GameState, cmd: Command): GameState => reduce(s, cmd).state

function run(): GameState['run'] {
  let s = dispatch(newGame(), { type: 'createHero', id: 'h1', name: 'David' })
  s = dispatch(s, { type: 'startRun', characterId: 'h1', worldId: 'world-03', seed: 'elah-strat', content })
  return s.run
}

describe('Elah "champion" encounter — strategies + synergy auras from archetypes', () => {
  const built = buildEncounter(run()!, 'champion', 'n', seedRng('strat')).combat
  const champ = built.combatants.champ!
  const shield = built.combatants.shield!
  const arch = built.combatants.arch!

  it('installs the synergy auras by archetype (no per-template wiring)', () => {
    expect(shield.powers).toContainEqual({ id: 'aegis', stacks: 3 })
    expect(champ.powers).toContainEqual({ id: 'warleader', stacks: 1 })
    expect(arch.powers ?? []).toEqual([]) // the archer is a plain back-row marker
  })

  it('selects per-archetype AI profiles (explicit champion, defaulted archer)', () => {
    expect(champ.aiProfileId).toBe('champion') // explicit on the template
    expect(arch.aiProfileId).toBe('archer') // defaulted from its archetype
    expect(shield.aiProfileId).toBe('shieldGuard')
  })

  it('round 1: Aegis screens the whole enemy line and War-Leader rallies it — never the party', () => {
    // buildEncounter → startCombat → beginRound has already fired the round-1 auras.
    expect(champ.block).toBeGreaterThan(0)
    expect(shield.block).toBeGreaterThan(0)
    expect(arch.block).toBeGreaterThan(0)
    expect(statusStacks(champ, 'strength')).toBe(1)
    expect(statusStacks(arch, 'strength')).toBe(1)

    const heroes = built.partyOrder.map((id) => built.combatants[id]!)
    expect(heroes.every((h) => h.block === 0)).toBe(true) // auras don't cross the faction line
    expect(heroes.every((h) => statusStacks(h, 'strength') === 0)).toBe(true)
  })
})
