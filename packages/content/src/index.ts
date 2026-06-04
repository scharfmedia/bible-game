// @bible/content — the real Milestone-1 content bundle. Assembles cards / encounters / scenes /
// events / items / verses / world into a ContentBundle the engine consumes, and validates
// referential integrity (catches authoring mistakes the type-checker can't, e.g. a node pointing
// at a missing encounter).

import type { ContentBundle } from '@bible/engine'
import { CARDS, HERO_START_DECK } from './cards'
import { VERSES } from './verses'
import { ENCOUNTERS, EVENTS, ITEMS, SCENES, WORLD_01_MAP } from './world'

const HERO_GRACE_ABILITIES = ['sight', 'mercy']

export function createContent(): ContentBundle {
  const bundle: ContentBundle = {
    heroStartDeck: HERO_START_DECK,
    heroGraceAbilities: HERO_GRACE_ABILITIES,
    cards: CARDS,
    encounters: ENCOUNTERS,
    scenes: SCENES,
    events: EVENTS,
    items: ITEMS,
    verses: VERSES,
    worlds: {
      'world-01': {
        map: WORLD_01_MAP,
        backwardTable: { fight: 0.3, event: 0.3, fightEncounterId: 'forest_beast', eventId: 'traveler' },
      },
    },
  }
  validateContent(bundle)
  return bundle
}

/** Referential-integrity checks. Throws on an authoring error. */
export function validateContent(b: ContentBundle): void {
  const err = (m: string) => {
    throw new Error(`content: ${m}`)
  }

  for (const id of b.heroStartDeck) if (!b.cards[id]) err(`start deck references missing card "${id}"`)

  for (const v of Object.values(b.verses)) {
    if (!b.cards[v.cardDefId]) err(`verse "${v.id}" references missing card "${v.cardDefId}"`)
    for (const loc of ['en', 'de'] as const) {
      const d = v.byLocale[loc]
      if (!d) err(`verse "${v.id}" missing locale "${loc}"`)
      if (d.blankIndices.some((i) => i < 0 || i >= d.tokens.length)) err(`verse "${v.id}" (${loc}) has an out-of-range blank index`)
    }
  }

  for (const enc of Object.values(b.encounters)) {
    for (const o of enc.rewardOptions ?? []) {
      if (o.kind === 'card' && o.defId && !b.cards[o.defId]) err(`encounter "${enc.id}" rewards missing card "${o.defId}"`)
      if (o.kind === 'relic' && o.defId && !b.items[o.defId]) err(`encounter "${enc.id}" rewards missing relic "${o.defId}"`)
    }
  }

  for (const [worldId, world] of Object.entries(b.worlds)) {
    const map = world.map
    if (!map.nodes[map.entrance]) err(`world "${worldId}" entrance "${map.entrance}" missing`)
    if (!map.nodes[map.bossId]) err(`world "${worldId}" boss "${map.bossId}" missing`)
    for (const node of Object.values(map.nodes)) {
      const fe = node.fixedEvent
      if ((fe.kind === 'combat' || fe.kind === 'boss') && !b.encounters[fe.encounter]) err(`node "${node.id}" references missing encounter "${fe.encounter}"`)
      if (fe.kind === 'scene' && !b.scenes[fe.sceneId]) err(`node "${node.id}" references missing scene "${fe.sceneId}"`)
      if (fe.kind === 'event' && !b.events[fe.eventId]) err(`node "${node.id}" references missing event "${fe.eventId}"`)
    }
    for (const edge of Object.values(map.edges)) {
      if (!map.nodes[edge.a] || !map.nodes[edge.b]) err(`edge "${edge.id}" references a missing node`)
    }
  }
}

export { CARDS, HERO_START_DECK } from './cards'
export { VERSES } from './verses'
export { ENCOUNTERS, EVENTS, ITEMS, SCENES, WORLD_01_MAP } from './world'
