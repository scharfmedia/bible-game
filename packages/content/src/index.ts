// @bible/content — the real Milestone-2 content bundle: "The Jericho Road". Assembles the 22-node
// map / encounters / scenes / events / items / verses / cards into a ContentBundle the engine
// consumes, and validates referential + graph integrity (catches authoring mistakes the
// type-checker can't — a node pointing at a missing scene, an asymmetric edge, an out-of-range
// verse blank, an unreachable boss).

import type { ContentBundle } from '@bible/engine'
import { CARDS, HERO_START_DECK } from './cards'
import { VERSES } from './verses'
import { AMBUSH_TABLE, ENCOUNTERS, ITEMS, WORLD_01_MAP } from './jericho/map'
import { SCENES } from './jericho/scenes'
import { EVENTS } from './jericho/events'

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
      'world-01': { map: WORLD_01_MAP, ambushTable: AMBUSH_TABLE },
    },
  }
  validateContent(bundle)
  return bundle
}

/** Referential + graph integrity. Throws on an authoring error. */
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
      if (d.blankIndices.some((i) => i < 0 || i >= d.tokens.length)) err(`verse "${v.id}" (${loc}) has an out-of-range blank index (a blanked word wasn't found in the text)`)
    }
  }

  for (const enc of Object.values(b.encounters)) {
    for (const o of enc.rewardOptions ?? []) {
      if (o.kind === 'card' && o.defId && !b.cards[o.defId]) err(`encounter "${enc.id}" rewards missing card "${o.defId}"`)
      if (o.kind === 'relic' && o.defId && !b.items[o.defId]) err(`encounter "${enc.id}" rewards missing relic "${o.defId}"`)
    }
    // demons referenced by a human's revealsId must exist in the same encounter
    const ids = new Set(enc.enemies.map((e) => e.id))
    for (const e of enc.enemies) {
      if (e.revealsId && !ids.has(e.revealsId)) err(`encounter "${enc.id}" enemy "${e.id}" reveals missing "${e.revealsId}"`)
      if (e.boundToId && !ids.has(e.boundToId)) err(`encounter "${enc.id}" demon "${e.id}" bound to missing "${e.boundToId}"`)
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

    // edges reference existing nodes; adjacency is symmetric
    for (const edge of Object.values(map.edges)) {
      if (!map.nodes[edge.a] || !map.nodes[edge.b]) err(`edge "${edge.id}" references a missing node`)
      if (!map.adjacency[edge.a]?.includes(edge.id) || !map.adjacency[edge.b]?.includes(edge.id)) {
        err(`edge "${edge.id}" is not listed symmetrically in adjacency`)
      }
    }

    // boss reachable from the entrance (ignoring gates — they unlock during play)
    const seen = new Set<string>([map.entrance])
    const queue = [map.entrance]
    while (queue.length) {
      const cur = queue.shift()!
      for (const eid of map.adjacency[cur] ?? []) {
        const e = map.edges[eid]!
        const next = e.a === cur ? e.b : e.a
        if (!seen.has(next)) {
          seen.add(next)
          queue.push(next)
        }
      }
    }
    if (!seen.has(map.bossId)) err(`world "${worldId}" boss is unreachable from the entrance`)
  }
}

export { CARDS, HERO_START_DECK } from './cards'
export { VERSES } from './verses'
export { ENCOUNTERS, ITEMS, WORLD_01_MAP, AMBUSH_TABLE } from './jericho/map'
export { SCENES } from './jericho/scenes'
export { EVENTS } from './jericho/events'
