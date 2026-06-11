import { describe, expect, it } from 'vitest'
import type { GameState } from '@bible/engine'
import { MUSIC_LEVELS, selectMusic } from './selectMusic'

// selectMusic only reads a thin slice of state, so we fake the minimum it touches.
interface Opts {
  screen: string
  noRun?: boolean
  mapMusic?: string
  current?: string
  nodeMusic?: string
  combat?: { encounterId: string } | null
  battleMusic?: string
  dynamic?: boolean
}

const makeState = (o: Opts): GameState => {
  const profile = { settings: { dynamicMusic: o.dynamic ?? true } }
  if (o.noRun) return { screen: o.screen, run: null, combat: null, profile } as unknown as GameState
  const current = o.current ?? 'n1'
  return {
    screen: o.screen,
    combat: o.combat ?? null,
    profile,
    run: {
      worldId: 'w1',
      world: { current },
      content: {
        worlds: { w1: { map: { musicKey: o.mapMusic, nodes: { [current]: { musicKey: o.nodeMusic } } } } },
        encounters: o.combat ? { [o.combat.encounterId]: { battleMusic: o.battleMusic } } : {},
      },
    },
  } as unknown as GameState
}

describe('MUSIC_LEVELS match the agreed spec', () => {
  it('locks the per-context multipliers of the music-volume setting', () => {
    expect(MUSIC_LEVELS).toEqual({
      menu: 0.5,
      map: 0.5,
      nodeDuck: 0.2,
      nodeOwn: 0.8,
      battle: 0.8,
      battleOwn: 0.8,
      gameOver: 0,
    })
  })
})

describe('selectMusic', () => {
  it('plays the start-screen track across all menu screens', () => {
    for (const screen of ['start', 'heroSelect', 'heroCreation', 'worldSelect', 'settings']) {
      expect(selectMusic(makeState({ screen, noRun: true }))).toEqual({ ref: 'music/startscreen', level: MUSIC_LEVELS.menu })
    }
  })

  it('falls back to the start-screen track whenever there is no run', () => {
    expect(selectMusic(makeState({ screen: 'map', noRun: true }))).toEqual({ ref: 'music/startscreen', level: MUSIC_LEVELS.menu })
  })

  it("plays the adventure's map track at map level on the map", () => {
    expect(selectMusic(makeState({ screen: 'map', mapMusic: 'music/map' }))).toEqual({ ref: 'music/map', level: MUSIC_LEVELS.map })
  })

  it("uses 'music/map' as the default when the adventure has no map music", () => {
    expect(selectMusic(makeState({ screen: 'map' }))).toEqual({ ref: 'music/map', level: MUSIC_LEVELS.map })
  })

  it('ducks the map track on a node without its own music', () => {
    for (const screen of ['scene', 'event', 'fireplace']) {
      expect(selectMusic(makeState({ screen, mapMusic: 'music/map' }))).toEqual({ ref: 'music/map', level: MUSIC_LEVELS.nodeDuck })
    }
  })

  it("plays a node's own track at node-own level when it has one", () => {
    expect(selectMusic(makeState({ screen: 'fireplace', mapMusic: 'music/map', nodeMusic: 'music/inn' }))).toEqual({
      ref: 'music/inn',
      level: MUSIC_LEVELS.nodeOwn,
    })
  })

  it('boosts the map track in a battle without its own music', () => {
    expect(selectMusic(makeState({ screen: 'combat', mapMusic: 'music/map', combat: { encounterId: 'e1' } }))).toEqual({
      ref: 'music/map',
      level: MUSIC_LEVELS.battle,
    })
  })

  it("plays a battle's own track at battle-own level when it has one", () => {
    expect(
      selectMusic(makeState({ screen: 'combat', mapMusic: 'music/map', combat: { encounterId: 'e1' }, battleMusic: 'music/boss' })),
    ).toEqual({ ref: 'music/boss', level: MUSIC_LEVELS.battleOwn })
  })

  it('keeps the battle context on the reward screen (single transition back to map)', () => {
    expect(selectMusic(makeState({ screen: 'reward', mapMusic: 'music/map', combat: { encounterId: 'e1' } }))).toEqual({
      ref: 'music/map',
      level: MUSIC_LEVELS.battle,
    })
  })

  it('fades to silence on game over', () => {
    expect(selectMusic(makeState({ screen: 'gameOver', mapMusic: 'music/map' }))).toEqual({ ref: null, level: MUSIC_LEVELS.gameOver })
  })

  describe('with dynamic music off', () => {
    it('keeps the same flat level (1.0) across map, ducked node, and battle — track may still switch', () => {
      expect(selectMusic(makeState({ screen: 'map', mapMusic: 'music/map', dynamic: false }))).toEqual({ ref: 'music/map', level: 1 })
      // node without its own music: same track, NO duck
      expect(selectMusic(makeState({ screen: 'scene', mapMusic: 'music/map', dynamic: false }))).toEqual({ ref: 'music/map', level: 1 })
      // node with its own music: track switches, but level stays flat
      expect(selectMusic(makeState({ screen: 'fireplace', mapMusic: 'music/map', nodeMusic: 'music/inn', dynamic: false }))).toEqual({
        ref: 'music/inn',
        level: 1,
      })
      // battle without its own music: same track, NO boost
      expect(selectMusic(makeState({ screen: 'combat', mapMusic: 'music/map', combat: { encounterId: 'e1' }, dynamic: false }))).toEqual({
        ref: 'music/map',
        level: 1,
      })
    })

    it('still fades to silence on game over', () => {
      expect(selectMusic(makeState({ screen: 'gameOver', mapMusic: 'music/map', dynamic: false }))).toEqual({ ref: null, level: 0 })
    })
  })
})
