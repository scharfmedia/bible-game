// @bible/assets — the asset-abstraction layer. Content/engine reference visuals by AssetRef;
// this maps them to concrete URLs. Unknown refs return undefined so the UI falls back to a
// programmatic CSS placeholder — swapping in final art later means editing only this registry.
//
// Jericho-road backgrounds are referenced by their file STEM (e.g. "bg-explore-poor-family-house"),
// so content can name the exact image. Combat encounters use the "-sideview" stem for the battle
// and the plain stem for the reward.

// Every bg-*.png under apps/web/public/assets, by file stem.
const JERICHO_BG = [
  'bg-road-dusty-road',
  'bg-waypoint-olive-grove',
  'bg-waypoint-potters-field',
  'bg-waypoint-lower-well',
  'bg-waypoint-market-fork',
  'bg-waypoint-samaritan-road',
  'bg-waypoint-ruined-watchtower',
  'bg-waypoint-narrow-steps',
  'bg-explore-poor-family-house',
  'bg-event-wounded-traveler',
  'bg-shop-roadside-market',
  'bg-shop-merchant-camp',
  'bg-rest-old-cistern',
  'bg-rest-jericho-inn',
  'bg-rest-hidden-prayer-place',
  'bg-rest-quiet-cave',
  'bg-combat-dry-wash',
  'bg-combat-dry-wash-sideview',
  'bg-combat-shepherds-track',
  'bg-combat-shepherds-track-sideview',
  'bg-combat-ridge-path',
  'bg-combat-ridge-path-sideview',
  'bg-combat-broken-toll-gate',
  'bg-combat-broken-toll-gate-sideview',
  'bg-combat-rocky-pass',
  'bg-combat-rocky-pass-sideview',
  'bg-boss-narrow-gate',
  'bg-boss-narrow-gate-sideview',
]

const REGISTRY: Record<string, string> = {
  // Milestone-1 art (kept for fallback / older content)
  'scene/forest-house-inside': '/assets/002-2-forest-house-inside.jpg',
  'scene/forest-house-outside': '/assets/002-1-forest-house-outside.jpg',
  'scene/merchant-place': '/assets/001-merchant-place.jpg',
  'battlefield/forest': '/assets/004-battlefield-forest.png',
  'battlefield/enchanted-forest': '/assets/004-battlefield-enchanted-forest.png',
  'battlefield/hill': '/assets/004-battlefield-on-hill.png',
  'battlefield/crossroads': '/assets/004-battlefield-open-crossroads.png',
  'battlefield/seaside': '/assets/004-battlefield-seaside.png',
  'battlefield/open-road': '/assets/005-battlefield-open-road.png',
  // Jericho road — every bg by stem
  ...Object.fromEntries(JERICHO_BG.map((stem) => [stem, `/assets/${stem}.png`])),
}

export function resolveAsset(ref: string | undefined): string | undefined {
  return ref ? REGISTRY[ref] : undefined
}

/** CSS `background-image` value for an AssetRef, or undefined (caller applies a placeholder). */
export function assetBg(ref: string | undefined): string | undefined {
  const url = resolveAsset(ref)
  return url ? `url(${url})` : undefined
}
