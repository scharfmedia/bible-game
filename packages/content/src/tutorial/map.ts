import type { EncounterDef, MapEdge, MapNode, WorldMap } from '@bible/engine'

// World 02 — "Beside Still Waters": a short, gentle TUTORIAL. A calm shepherd's path that teaches
// the controls (travel, the shepherd's how-to-play talk, an easy fight, rest-to-heal, then a boss)
// and nothing more. IMPORTANT: this world must NEVER mention or hint at the hidden Spirit/flesh
// system — the player discovers that on their own. The foes are WOLVES (beasts: killing them is
// spirit-neutral, so combat can't surface that system). Four linear nodes: talk → an easy wolf →
// rest (now meaningful, you're hurt) → the boss wolf, whose victory plays the outro.

type Conns = Record<string, string[]>

const CONNECTIONS: Conns = {
  stillWaters: ['thicket'],
  thicket: ['stillWaters', 'restingPlace'],
  restingPlace: ['thicket', 'theFold'],
  theFold: ['restingPlace'],
}

function buildGraph(conns: Conns): { edges: Record<string, MapEdge>; adjacency: Record<string, string[]> } {
  const edges: Record<string, MapEdge> = {}
  const adjacency: Record<string, string[]> = {}
  const ensure = (n: string) => (adjacency[n] ??= [])
  for (const [a, list] of Object.entries(conns)) {
    ensure(a)
    for (const b of list) {
      ensure(b)
      const [x, y] = [a, b].sort()
      const id = `${x}__${y}`
      if (!edges[id]) edges[id] = { id, a: x!, b: y! }
      if (!adjacency[a]!.includes(id)) adjacency[a]!.push(id)
      if (!adjacency[b]!.includes(id)) adjacency[b]!.push(id)
    }
  }
  return { edges, adjacency }
}

const nameKey = (id: string) => `node.tutorial.${id}`

const NODES: Record<string, MapNode> = {
  // Entry node: opens the shepherd-guide conversation automatically (a dialogue node resolves on
  // entry and overlays the talk on the map). The shepherd walks the player through how to play.
  stillWaters: { id: 'stillWaters', type: 'scene', nameKey: nameKey('stillWaters'), pos: { x: 0, y: 2 }, depth: 0, fixedEvent: { kind: 'dialogue', dialogueId: 'shepherdGuide' }, bgAsset: 'bg-waypoint-lower-well', tags: ['entrance'] },
  // first easy fight — leaves the hero hurt, so resting at the next node actually matters
  thicket: { id: 'thicket', type: 'combat', nameKey: nameKey('thicket'), pos: { x: 1, y: 2 }, depth: 1, fixedEvent: { kind: 'combat', encounter: 'strayWolf' }, bgAsset: 'bg-combat-shepherds-track', tags: [] },
  restingPlace: { id: 'restingPlace', type: 'rest', nameKey: nameKey('restingPlace'), pos: { x: 2, y: 2 }, depth: 2, fixedEvent: { kind: 'fireplace' }, bgAsset: 'bg-rest-old-cistern', tags: [] },
  theFold: { id: 'theFold', type: 'boss', nameKey: nameKey('theFold'), pos: { x: 3, y: 2 }, depth: 3, fixedEvent: { kind: 'boss', encounter: 'loneWolf' }, bgAsset: 'bg-combat-shepherds-track', tags: [] },
}

const graph = buildGraph(CONNECTIONS)

export const TUTORIAL_MAP: WorldMap = {
  worldId: 'world-02',
  seed: 'still-waters',
  entrance: 'stillWaters',
  bossId: 'theFold',
  outroStoryId: 'tutorialOutro',
  musicKey: 'music/map-tutorial',
  nodes: NODES,
  edges: graph.edges,
  adjacency: graph.adjacency,
}

// Wolves are beasts (isHuman:false) → spirit-neutral kills that never surface the hidden system. The
// UI names enemies by archetype (`enemy.<archetype>`), so archetype must be `wolf` (→ "Gaunt Wolf").
// Flat scaling (level exps 0) keeps difficulty fixed regardless of hero level. `strayWolf` is the easy
// teaching fight (8 HP, 8 dmg); `loneWolf` is the boss — bigger and with real bite (50 HP, 12 dmg).
export const TUTORIAL_ENCOUNTERS: Record<string, EncounterDef> = {
  strayWolf: {
    id: 'strayWolf',
    enemies: [{ id: 'wolf', archetype: 'wolf', nameKey: 'enemy.wolf', isHuman: false, scaling: { baseHp: 8, baseAtk: 8, hpLevelExp: 0, atkLevelExp: 0 } }],
    flags: { mandatory: false, allowFlee: true, isBoss: false },
    winCondition: { kind: 'allEnemiesDefeated' },
    rewardOptions: [{ id: 'money', kind: 'money', amount: 8 }],
    rewardXp: 8,
    battleBg: 'bg-combat-shepherds-track-sideview',
    rewardBg: 'bg-combat-shepherds-track',
  },
  loneWolf: {
    id: 'loneWolf',
    enemies: [{ id: 'wolf', archetype: 'wolf', nameKey: 'enemy.wolf', isHuman: false, scaling: { baseHp: 50, baseAtk: 12, hpLevelExp: 0, atkLevelExp: 0 } }],
    flags: { mandatory: false, allowFlee: true, isBoss: true },
    winCondition: { kind: 'allEnemiesDefeated' },
    rewardOptions: [{ id: 'money', kind: 'money', amount: 10 }],
    rewardXp: 10,
    battleBg: 'bg-combat-shepherds-track-sideview',
    rewardBg: 'bg-combat-shepherds-track',
  },
}

// No revisit ambushes — the tutorial stays calm and predictable.
export const TUTORIAL_AMBUSH_TABLE = { combat: 0, event: 0 } as const
