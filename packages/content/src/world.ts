import type { EncounterDef, ItemDef, MoralEvent, Scene, WorldMap } from '@bible/engine'

// World 01 — "The Forest Road". A small hand-authored graph: two forward paths (a beast fight or
// the merchant) converge at a fireplace, then a key-gated edge leads to the thief mini-boss.

export const SCENES: Record<string, Scene> = {
  forestHouse: {
    id: 'forestHouse',
    bgAsset: 'scene/forest-house-inside',
    hotspots: [
      {
        id: 'chest',
        shape: { x: 0.3, y: 0.55, w: 0.18, h: 0.2 },
        nameKey: 'scene.forestHouse.chest',
        defaultVerb: 'take',
        interactions: {
          observe: { fallbackLineKey: 'scene.forestHouse.chest.observe' },
          take: {
            script: [
              { giveItem: 'key', count: 1 },
              { markTaken: 'chest' },
              { say: 'scene.forestHouse.tookKey', speaker: 'hero' },
            ],
          },
        },
      },
      {
        id: 'window',
        shape: { x: 0.7, y: 0.3, w: 0.15, h: 0.2 },
        nameKey: 'scene.forestHouse.window',
        interactions: { observe: { fallbackLineKey: 'scene.forestHouse.window.observe' } },
      },
    ],
  },
  merchant: {
    id: 'merchant',
    bgAsset: 'scene/merchant-place',
    hotspots: [
      {
        id: 'merchant',
        shape: { x: 0.45, y: 0.4, w: 0.18, h: 0.35 },
        nameKey: 'scene.merchant.person',
        interactions: { observe: { fallbackLineKey: 'scene.merchant.greeting' } },
      },
      {
        id: 'fire',
        shape: { x: 0.2, y: 0.65, w: 0.12, h: 0.12 },
        nameKey: 'scene.merchant.fire',
        interactions: { observe: { fallbackLineKey: 'scene.merchant.fire.observe' } },
      },
    ],
  },
}

export const EVENTS: Record<string, MoralEvent> = {
  traveler: {
    id: 'traveler',
    bgAsset: 'event/traveler',
    titleKey: 'event.traveler.title',
    bodyKey: 'event.traveler.body',
    choices: [
      { id: 'give', labelKey: 'event.traveler.give', script: [{ addSpirit: 20, reason: 'gaveToTraveler' }, { say: 'event.traveler.gaveResult' }] },
      { id: 'refuse', labelKey: 'event.traveler.refuse', script: [{ say: 'event.traveler.refuseResult' }] },
      { id: 'rob', labelKey: 'event.traveler.rob', script: [{ addSpirit: -25, reason: 'robbedTraveler' }, { giveItem: 'coin', count: 1 }, { say: 'event.traveler.robResult' }] },
    ],
  },
  idol: {
    id: 'idol',
    bgAsset: 'event/idol',
    titleKey: 'event.idol.title',
    bodyKey: 'event.idol.body',
    choices: [
      { id: 'bow', labelKey: 'event.idol.bow', script: [{ addSpirit: -30, reason: 'bowedToIdol' }, { giveItem: 'idol_relic', count: 1 }, { say: 'event.idol.bowResult' }] },
      { id: 'break', labelKey: 'event.idol.break', script: [{ addSpirit: 18, reason: 'brokeIdol' }, { say: 'event.idol.breakResult' }] },
    ],
  },
}

export const ITEMS: Record<string, ItemDef> = {
  key: { id: 'key', kind: 'key', nameKey: 'item.key.name', descKey: 'item.key.desc', icon: 'item/key', stackable: false, usableInScene: true },
  coin: { id: 'coin', kind: 'currency', nameKey: 'item.coin.name', descKey: 'item.coin.desc', icon: 'item/coin', stackable: true, usableInScene: false },
  veil_lifted: { id: 'veil_lifted', kind: 'relic', nameKey: 'item.veil_lifted.name', descKey: 'item.veil_lifted.desc', icon: 'item/veil', stackable: false, usableInScene: false, spiritEffectWhileHeld: 2 },
  idol_relic: { id: 'idol_relic', kind: 'relic', nameKey: 'item.idol_relic.name', descKey: 'item.idol_relic.desc', icon: 'item/idol', stackable: false, usableInScene: false },
}

export const ENCOUNTERS: Record<string, EncounterDef> = {
  forest_beast: {
    id: 'forest_beast',
    enemies: [
      { id: 'wolf', archetype: 'wolf', nameKey: 'enemy.wolf', isHuman: false, scaling: { baseHp: 8, baseAtk: 3, hpLevelExp: 1, atkLevelExp: 1 } },
    ],
    flags: { mandatory: false, allowFlee: true, isBoss: false },
    winCondition: { kind: 'allEnemiesDefeated' },
    rewardOptions: [
      { id: 'money', kind: 'money', amount: 25 },
      { id: 'card', kind: 'card', defId: 'compassion' },
    ],
    rewardXp: 25,
  },
  thief_road: {
    id: 'thief_road',
    enemies: [
      { id: 'thief', archetype: 'thief', nameKey: 'enemy.thief', isHuman: true, revealsId: 'demon', scaling: { baseHp: 6, baseAtk: 1, hpLevelExp: 1, atkLevelExp: 1 } },
      { id: 'demon', archetype: 'demon', nameKey: 'enemy.demon', isHuman: false, isDemon: true, hidden: true, boundToId: 'thief', dread: 4, fleshDamageCap: 1, scaling: { baseHp: 3, baseAtk: 1, hpLevelExp: 1, atkLevelExp: 1 } },
    ],
    flags: { mandatory: false, allowFlee: true, isBoss: true },
    winCondition: { kind: 'allDemonsDestroyed' },
    rewardOptions: [
      { id: 'money', kind: 'money', amount: 50 },
      { id: 'relic', kind: 'relic', defId: 'veil_lifted' },
    ],
    rewardXp: 40,
  },
}

export const WORLD_01_MAP: WorldMap = {
  worldId: 'world-01',
  seed: 'world-01',
  entrance: 'n0',
  bossId: 'n4',
  nodes: {
    n0: { id: 'n0', type: 'entrance', nameKey: 'node.world01.entrance', pos: { x: 0, y: 1 }, depth: 0, fixedEvent: { kind: 'none' }, tags: [] },
    n1: { id: 'n1', type: 'scene', nameKey: 'node.world01.house', pos: { x: 1, y: 1 }, depth: 1, fixedEvent: { kind: 'scene', sceneId: 'forestHouse' }, sceneId: 'forestHouse', tags: [] },
    n2: { id: 'n2', type: 'combat', nameKey: 'node.world01.glade', pos: { x: 2, y: 0 }, depth: 2, fixedEvent: { kind: 'combat', encounter: 'forest_beast' }, tags: [] },
    n5: { id: 'n5', type: 'scene', nameKey: 'node.world01.merchant', pos: { x: 2, y: 2 }, depth: 2, fixedEvent: { kind: 'scene', sceneId: 'merchant' }, sceneId: 'merchant', tags: [] },
    n3: { id: 'n3', type: 'fireplace', nameKey: 'node.world01.fire', pos: { x: 3, y: 1 }, depth: 3, fixedEvent: { kind: 'fireplace' }, tags: [] },
    n4: { id: 'n4', type: 'boss', nameKey: 'node.world01.crossroads', pos: { x: 4, y: 1 }, depth: 4, fixedEvent: { kind: 'boss', encounter: 'thief_road' }, tags: [] },
  },
  edges: {
    e01: { id: 'e01', a: 'n0', b: 'n1' },
    e12: { id: 'e12', a: 'n1', b: 'n2' },
    e15: { id: 'e15', a: 'n1', b: 'n5' },
    e23: { id: 'e23', a: 'n2', b: 'n3' },
    e53: { id: 'e53', a: 'n5', b: 'n3' },
    e34: { id: 'e34', a: 'n3', b: 'n4', gate: { hasItem: 'key' } },
  },
  adjacency: {
    n0: ['e01'],
    n1: ['e01', 'e12', 'e15'],
    n2: ['e12', 'e23'],
    n5: ['e15', 'e53'],
    n3: ['e23', 'e53', 'e34'],
    n4: ['e34'],
  },
}
