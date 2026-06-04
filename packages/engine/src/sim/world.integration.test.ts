import { describe, expect, it } from 'vitest'
import type { Command } from '../commands/command'
import { newGame } from '../commands/reduce'
import { heroMemberId } from '../state/character'
import { testContent } from '../testing/fixtures'
import { sawEvent, simulate } from './simulate'

const content = testContent()
const HERO = heroMemberId('h1')
const strikeA = `${HERO}#0`
const strikeB = `${HERO}#4`
const lightCard = `${HERO}#2`

const bootstrap = (seed = 'run-1'): Command[] => [
  { type: 'createHero', id: 'h1', name: 'Gideon' },
  { type: 'startRun', characterId: 'h1', worldId: 'world-01', seed, content },
]

// The full vertical slice: scene (take key) → beast combat → fireplace (pray) → gated edge →
// thief mini-boss completed RIGHTEOUSLY (Sight → spiritual kill; the human is freed).
const fullPeacefulRun = (seed = 'run-1'): Command[] => [
  ...bootstrap(seed),
  { type: 'world/move', target: 'n1' }, // → forest-house scene
  { type: 'world/sceneInteract', sceneId: 'forestHouse', hotspotId: 'drawer', verb: 'take' }, // get the key
  { type: 'world/leaveScene' },
  { type: 'world/move', target: 'n2' }, // → beast combat
  { type: 'combat/playCard', iid: strikeA, targetId: 'wolf' },
  { type: 'combat/playCard', iid: strikeB, targetId: 'wolf' }, // 16 dmg kills the 10-HP wolf
  { type: 'combat/chooseReward', optionId: 'money' },
  { type: 'world/move', target: 'n3' }, // → fireplace
  { type: 'world/fireplace', action: 'pray' }, // recover Spirit
  { type: 'world/fireplace', action: 'leave' },
  { type: 'world/move', target: 'n4' }, // gated by "key" → thief mini-boss
  { type: 'combat/useGrace', ability: 'sight' }, // reveal the bound demon
  { type: 'combat/playCard', iid: lightCard, targetId: 'demon' }, // spiritual kill
  { type: 'combat/chooseReward', optionId: 'money' },
]

describe('vertical slice — full peaceful run (DoD tripwire)', () => {
  const res = simulate(newGame(), fullPeacefulRun())
  const run = res.state.run!

  it('completes end-to-end with no rejected commands', () => {
    expect(sawEvent(res, 'rejected')).toBe(false)
  })

  it('reaches and defeats the thief mini-boss righteously (demon revealed, human freed)', () => {
    expect(sawEvent(res, 'demonRevealed')).toBe(true)
    expect(run.world.bossDefeated).toBe(true)
    expect(run.world.cleared).toEqual(expect.arrayContaining(['n1', 'n2', 'n3', 'n4']))
    expect(res.state.screen).toBe('map')
    expect(res.state.combat).toBeNull()
  })

  it('took the key, raised Spirit, and harmed no humans', () => {
    expect(run.inventory.stacks.key).toBe(1)
    expect(run.spirit.spirit).toBeGreaterThan(100)
    expect(run.spirit.killedHumans).toBe(0)
  })

  it('earned XP from both fights', () => {
    expect(res.state.profile.slots[0]!.character.xp).toBeGreaterThan(0)
  })
})

describe('the cross-node gate', () => {
  it('blocks the boss edge until the key is taken', () => {
    // walk to n3 WITHOUT visiting the scene to grab the key, then try the gated edge
    const noKey = simulate(newGame(), [
      ...bootstrap(),
      { type: 'world/move', target: 'n1' },
      { type: 'world/leaveScene' }, // leave without taking the key
      { type: 'world/move', target: 'n2' },
      { type: 'combat/playCard', iid: strikeA, targetId: 'wolf' },
      { type: 'combat/playCard', iid: strikeB, targetId: 'wolf' },
      { type: 'combat/chooseReward', optionId: 'money' },
      { type: 'world/move', target: 'n3' },
      { type: 'world/fireplace', action: 'leave' },
      { type: 'world/move', target: 'n4' }, // should be rejected — no key
    ])
    expect(noKey.log.at(-1)!.events).toContainEqual({ type: 'rejected', reason: 'move:gated' })
    expect(noKey.state.run!.world.current).toBe('n3')
  })
})

describe('backward movement', () => {
  it('rolls the backward table → moral event, which a choice resolves', () => {
    const res = simulate(newGame(), [
      ...bootstrap(),
      { type: 'world/move', target: 'n1' },
      { type: 'world/sceneInteract', sceneId: 'forestHouse', hotspotId: 'drawer', verb: 'take' },
      { type: 'world/leaveScene' },
      { type: 'world/move', target: 'n2' },
      { type: 'combat/playCard', iid: strikeA, targetId: 'wolf' },
      { type: 'combat/playCard', iid: strikeB, targetId: 'wolf' },
      { type: 'combat/chooseReward', optionId: 'money' },
      { type: 'world/move', target: 'n1' }, // backward to a seen node → event
      { type: 'world/eventChoice', eventId: 'traveler', choiceId: 'give' },
    ])
    expect(res.events).toContainEqual({ type: 'backwardEncounter', kind: 'event' })
    expect(res.events.some((e) => e.type === 'spiritShifted' && e.reason === 'gaveToTraveler')).toBe(true)
    expect(res.state.screen).toBe('map')
  })
})

describe('determinism', () => {
  it('same seed + same script → byte-identical final state', () => {
    const a = simulate(newGame(), fullPeacefulRun('seed-X'))
    const b = simulate(newGame(), fullPeacefulRun('seed-X'))
    expect(JSON.stringify(a.state)).toBe(JSON.stringify(b.state))
  })
})
