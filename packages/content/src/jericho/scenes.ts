import type { Hotspot, Interaction, Scene } from '@bible/engine'

// Point-and-click scenes for the Jericho road. Waypoints share a road/tracks/horizon idiom plus a
// node-specific hotspot; the house is a rich explore (items + family prayer → unlocks the hidden
// spiritual route); shops are flavor scenes (no trading yet). All text is i18n keys (EN/DE in
// @bible/i18n) by the convention scene.<sceneId>.<hotspotId>[.observe|.take|.use].

type Rect = [number, number, number, number]

function hs(sceneId: string, id: string, rect: Rect, extra: Partial<Record<string, Interaction>> = {}): Hotspot {
  return {
    id,
    shape: { x: rect[0], y: rect[1], w: rect[2], h: rect[3] },
    nameKey: `scene.${sceneId}.${id}`,
    interactions: {
      observe: { fallbackLineKey: `scene.${sceneId}.${id}.observe` },
      ...extra,
    },
  }
}

/** A plain waypoint: three observe hotspots (road / tracks / horizon) + a node-specific one. */
function waypoint(id: string, bgAsset: string, fourthId: string, fourthRect: Rect): Scene {
  return {
    id,
    bgAsset,
    hotspots: [
      hs(id, 'road', [0.36, 0.62, 0.28, 0.22]),
      hs(id, 'tracks', [0.1, 0.68, 0.22, 0.18]),
      hs(id, 'horizon', [0.55, 0.22, 0.34, 0.18]),
      hs(id, fourthId, fourthRect),
    ],
  }
}

// --- the rich explore: the poor family's house ---
const house: Scene = {
  id: 'house',
  bgAsset: 'bg-explore-poor-family-house',
  hotspots: [
    hs('house', 'cupboard', [0.06, 0.4, 0.16, 0.3], {
      take: { script: [{ giveItem: 'bread', count: 1 }, { markTaken: 'cupboard' }, { say: 'scene.house.cupboard.take', speaker: 'hero' }] },
    }),
    hs('house', 'drawer', [0.28, 0.55, 0.14, 0.18], {
      take: { script: [{ giveItem: 'letter', count: 1 }, { markTaken: 'drawer' }, { say: 'scene.house.drawer.take', speaker: 'hero' }] },
    }),
    hs('house', 'waterJar', [0.46, 0.5, 0.12, 0.2], {
      take: { script: [{ giveItem: 'oilFlask', count: 1 }, { markTaken: 'waterJar' }, { say: 'scene.house.waterJar.take', speaker: 'hero' }] },
    }),
    hs('house', 'chest', [0.7, 0.55, 0.16, 0.22]),
    // The family: praying with them lifts the spirit and opens the hidden route.
    hs('house', 'family', [0.4, 0.28, 0.22, 0.3], {
      use: {
        script: [
          { setFlag: 'familyPrayer', value: true },
          { addSpirit: 12, reason: 'familyPrayer' },
          { say: 'scene.house.family.pray', speaker: 'hero' },
        ],
      },
    }),
  ],
}

// --- shops (flavor only for now) ---
const marketplace: Scene = {
  id: 'marketplace',
  bgAsset: 'bg-shop-roadside-market',
  hotspots: [
    hs('marketplace', 'stalls', [0.1, 0.4, 0.25, 0.3]),
    hs('marketplace', 'crowd', [0.4, 0.45, 0.25, 0.3]),
    hs('marketplace', 'trader', [0.68, 0.4, 0.18, 0.32]),
  ],
}
const merchant: Scene = {
  id: 'merchant',
  bgAsset: 'bg-shop-merchant-camp',
  hotspots: [
    hs('merchant', 'wares', [0.55, 0.5, 0.2, 0.25]),
    hs('merchant', 'keeper', [0.3, 0.38, 0.18, 0.34]),
    hs('merchant', 'fire', [0.12, 0.62, 0.14, 0.16]),
  ],
}

export const SCENES: Record<string, Scene> = {
  oliveGrove: waypoint('oliveGrove', 'bg-waypoint-olive-grove', 'olives', [0.08, 0.32, 0.2, 0.34]),
  pottersField: waypoint('pottersField', 'bg-waypoint-potters-field', 'shards', [0.62, 0.6, 0.24, 0.2]),
  lowerWell: waypoint('lowerWell', 'bg-waypoint-lower-well', 'well', [0.4, 0.5, 0.2, 0.3]),
  marketFork: waypoint('marketFork', 'bg-waypoint-market-fork', 'signpost', [0.46, 0.34, 0.12, 0.34]),
  samaritanRoad: waypoint('samaritanRoad', 'bg-waypoint-samaritan-road', 'shrine', [0.66, 0.42, 0.18, 0.28]),
  watchtower: waypoint('watchtower', 'bg-waypoint-ruined-watchtower', 'tower', [0.58, 0.2, 0.22, 0.45]),
  narrowSteps: waypoint('narrowSteps', 'bg-waypoint-narrow-steps', 'steps', [0.4, 0.4, 0.22, 0.4]),
  house,
  marketplace,
  merchant,
}
