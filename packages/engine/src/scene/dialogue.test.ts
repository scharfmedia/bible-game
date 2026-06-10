import { describe, expect, it } from 'vitest'
import { newGame, reduce } from '../commands/reduce'
import type { Command } from '../commands/command'
import type { GameState } from '../state/gameState'
import { itemCount } from '../inventory/types'
import { testContent } from '../testing/fixtures'

// The fixture's forest-house scene has a talkable "stranger" hotspot wired to the `wanderer`
// dialogue (greet → ask / key-gated unlock / provoke→combat / leave; tale → once-only coin / leave).

const CONTENT = testContent()
const run = (s: GameState, c: Command): GameState => reduce(s, c).state

/** A run standing in the forest-house scene, where the talkable hotspot lives. */
function inScene(): GameState {
  let s = run(newGame(), { type: 'createHero', id: 'h1', name: 'Gideon' })
  s = run(s, { type: 'startRun', characterId: 'h1', worldId: 'world-01', seed: 's', content: CONTENT })
  s = run(s, { type: 'world/chooseEntry', nodeId: 'n0' })
  s = run(s, { type: 'world/move', target: 'n1' })
  s = run(s, { type: 'world/enter' })
  return s
}

const talk = (s: GameState): GameState =>
  run(s, { type: 'world/sceneInteract', sceneId: 'forestHouse', hotspotId: 'stranger', verb: 'talk' })

const choose = (s: GameState, nodeId: string, choiceId: string): GameState =>
  run(s, { type: 'world/dialogueChoice', dialogueId: 'wanderer', nodeId, choiceId })

describe('dialogue engine', () => {
  it('a talk hotspot opens the conversation as an additive overlay (no screen/movement change)', () => {
    const s = inScene()
    expect(s.screen).toBe('scene')
    const s2 = talk(s)
    expect(s2.screen).toBe('scene')
    expect(s2.run!.world.movement.kind).toBe('inScene')
    expect(s2.run!.world.dialogue).toEqual({ dialogueId: 'wanderer', node: 'greet' })
  })

  it('a goto choice advances the cursor and runs the next node onEnter', () => {
    const s = talk(inScene())
    const before = s.run!.spirit.spirit
    const s2 = choose(s, 'greet', 'ask')
    expect(s2.run!.world.dialogue).toEqual({ dialogueId: 'wanderer', node: 'tale' })
    expect(s2.run!.spirit.spirit).toBe(before + 3) // tale.onEnter: addSpirit 3
  })

  it('rejects a gated choice when its requirement is unmet, leaving the conversation intact', () => {
    const s = talk(inScene()) // hero has no key
    const r = reduce(s, { type: 'world/dialogueChoice', dialogueId: 'wanderer', nodeId: 'greet', choiceId: 'unlock' })
    expect(r.events.map((e) => e.type)).toEqual(['rejected'])
    expect(r.state.run!.world.dialogue).toEqual({ dialogueId: 'wanderer', node: 'greet' })
  })

  it('a gated choice whose requirement is met runs its unlock script and advances', () => {
    let s = inScene()
    s = run(s, { type: 'world/sceneInteract', sceneId: 'forestHouse', hotspotId: 'drawer', verb: 'take' }) // pick up the key
    s = choose(talk(s), 'greet', 'unlock')
    expect(s.run!.world.flags.wandererToldSecret).toBe(true)
    expect(s.run!.world.revealed).toContain('n3')
    expect(s.run!.world.dialogue).toEqual({ dialogueId: 'wanderer', node: 'tale' })
  })

  it('a choice with no goto ends the conversation, returning to the scene underneath', () => {
    const s2 = choose(talk(inScene()), 'greet', 'bye')
    expect(s2.run!.world.dialogue).toBeNull()
    expect(s2.screen).toBe('scene')
  })

  it('a startCombat choice clears the overlay and begins combat', () => {
    const s2 = choose(talk(inScene()), 'greet', 'provoke')
    expect(s2.run!.world.dialogue).toBeNull()
    expect(s2.combat).not.toBeNull()
    expect(s2.screen).toBe('combat')
  })

  it('a once-only choice gives its reward once, then is refused', () => {
    let s = choose(talk(inScene()), 'greet', 'ask')
    s = choose(s, 'tale', 'coin')
    expect(itemCount(s.run!.inventory, 'coin')).toBe(1)
    expect(s.run!.world.flags['dlg:wanderer:coin']).toBe(true)
    expect(s.run!.world.dialogue).toBeNull() // coin has no goto → ends

    // re-open, navigate back to the tale node; the spent choice is refused and gives nothing
    s = choose(talk(s), 'greet', 'ask')
    const r = reduce(s, { type: 'world/dialogueChoice', dialogueId: 'wanderer', nodeId: 'tale', choiceId: 'coin' })
    expect(r.events.map((e) => e.type)).toEqual(['rejected'])
    expect(itemCount(r.state.run!.inventory, 'coin')).toBe(1)
  })

  it('leaveDialogue clears the overlay', () => {
    const s2 = run(talk(inScene()), { type: 'world/leaveDialogue' })
    expect(s2.run!.world.dialogue).toBeNull()
    expect(s2.screen).toBe('scene')
  })

  it('blocks scene interaction while a conversation is open', () => {
    const s = talk(inScene())
    const r = reduce(s, { type: 'world/sceneInteract', sceneId: 'forestHouse', hotspotId: 'drawer', verb: 'take' })
    expect(r.events.map((e) => e.type)).toEqual(['rejected'])
  })

  it('rejects a dialogue choice when no conversation is active', () => {
    const r = reduce(inScene(), { type: 'world/dialogueChoice', dialogueId: 'wanderer', nodeId: 'greet', choiceId: 'ask' })
    expect(r.events.map((e) => e.type)).toEqual(['rejected'])
  })
})
