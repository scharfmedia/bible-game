import { describe, expect, it } from 'vitest'
import { newGame, reduce } from '../commands/reduce'
import type { Command } from '../commands/command'
import type { GameState } from '../state/gameState'
import { testContent } from '../testing/fixtures'

// The fixture's `wanderer` dialogue has a "story" choice wired to { startStory: 'forestTale' },
// and that story's onEnd sets the flag `heardForestTale`.

const CONTENT = testContent()
const run = (s: GameState, c: Command): GameState => reduce(s, c).state

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
const openStory = (): GameState =>
  run(talk(inScene()), { type: 'world/dialogueChoice', dialogueId: 'wanderer', nodeId: 'greet', choiceId: 'story' })

describe('story / narration engine', () => {
  it('a dialogue choice can open a story overlay, closing the conversation (additive — screen unchanged)', () => {
    const s = openStory()
    expect(s.run!.world.dialogue).toBeNull()
    expect(s.run!.world.story).toEqual({ storyId: 'forestTale' })
    expect(s.screen).toBe('scene')
    expect(s.run!.world.movement.kind).toBe('inScene')
  })

  it('dismissStory clears the overlay and runs its onEnd script', () => {
    const s = run(openStory(), { type: 'world/dismissStory' })
    expect(s.run!.world.story).toBeNull()
    expect(s.run!.world.flags.heardForestTale).toBe(true)
  })

  it('blocks scene interaction while a story is open', () => {
    const r = reduce(openStory(), { type: 'world/sceneInteract', sceneId: 'forestHouse', hotspotId: 'drawer', verb: 'take' })
    expect(r.events.map((e) => e.type)).toEqual(['rejected'])
  })

  it('rejects dismissStory when no story is open', () => {
    const r = reduce(inScene(), { type: 'world/dismissStory' })
    expect(r.events.map((e) => e.type)).toEqual(['rejected'])
  })
})
