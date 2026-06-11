import type { GameState } from '@bible/engine'

// Per-context music levels — multipliers of the music-volume setting. The single place to tune the
// feel. (User-specified: map 50%, ducked node 20%, boosted battle 80%; chosen: menu 50%, node-own
// 80%, battle-own 80%, game-over silent.)
export const MUSIC_LEVELS = {
  menu: 0.5, // start + all pre-run menu screens (keeps playing into the map)
  map: 0.5, // overworld normal
  nodeDuck: 0.2, // node WITHOUT its own track → map music ducked underneath
  nodeOwn: 0.8, // node WITH its own dedicated track
  battle: 0.8, // battle WITHOUT its own track → map music boosted
  battleOwn: 0.8, // battle WITH its own dedicated track
  gameOver: 0, // fade to silence
} as const

const DEFAULT_MAP_MUSIC = 'music/map'
const STARTSCREEN_MUSIC = 'music/startscreen'
const MENU_SCREENS = new Set(['start', 'heroSelect', 'heroCreation', 'worldSelect', 'settings'])

/** A music cue: which registry track to play (null = silence) and at what level (0..1 of master). */
export interface MusicCue {
  ref: string | null
  level: number
}

/** Pure: derive the desired music from game state. MusicController turns this into manager calls. */
export function selectMusic(state: GameState): MusicCue {
  const { screen, run } = state

  // When the player turns off dynamic music, every audible context plays at a flat level (the music
  // slider value, i.e. 1.0 × master) — track switches still happen, but the volume never ducks/boosts.
  const dynamic = state.profile.settings.dynamicMusic
  const lvl = (level: number): number => (dynamic ? level : 1)

  // The menu arc (and any state without a run) plays the start-screen track; it crossfades to the
  // adventure's map track only once a run is actually underway (screen becomes 'map').
  if (MENU_SCREENS.has(screen) || !run) return { ref: STARTSCREEN_MUSIC, level: lvl(MUSIC_LEVELS.menu) }

  const map = run.content.worlds[run.worldId]?.map
  const mapMusic = map?.musicKey ?? DEFAULT_MAP_MUSIC

  // Combat AND the post-combat reward screen share the battle context (combat stays non-null through
  // reward). This gives the whole combat→reward→map arc a SINGLE transition, at choose-reward.
  if (screen === 'combat' || screen === 'reward') {
    const enc = state.combat ? run.content.encounters[state.combat.encounterId] : undefined
    return enc?.battleMusic
      ? { ref: enc.battleMusic, level: lvl(MUSIC_LEVELS.battleOwn) }
      : { ref: mapMusic, level: lvl(MUSIC_LEVELS.battle) }
  }

  // The node-interaction screens. A node with its own track plays it (foregrounded); otherwise the
  // map music keeps playing, ducked underneath.
  if (screen === 'scene' || screen === 'event' || screen === 'fireplace') {
    const node = map?.nodes[run.world.current]
    return node?.musicKey
      ? { ref: node.musicKey, level: lvl(MUSIC_LEVELS.nodeOwn) }
      : { ref: mapMusic, level: lvl(MUSIC_LEVELS.nodeDuck) }
  }

  if (screen === 'gameOver') return { ref: null, level: MUSIC_LEVELS.gameOver }

  // screen === 'map'
  return { ref: mapMusic, level: lvl(MUSIC_LEVELS.map) }
}
