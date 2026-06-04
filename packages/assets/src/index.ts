// @bible/assets — the asset-abstraction layer. Content/engine reference visuals by AssetRef
// (e.g. "scene/forest-house-inside"); this maps them to concrete URLs. Unknown refs return
// undefined so the UI falls back to a programmatic CSS placeholder — swapping in final art later
// means editing only this registry.

const REGISTRY: Record<string, string> = {
  // point-and-click scene backdrops (user-provided)
  'scene/forest-house-inside': '/assets/002-2-forest-house-inside.jpg',
  'scene/forest-house-outside': '/assets/002-1-forest-house-outside.jpg',
  'scene/merchant-place': '/assets/001-merchant-place.jpg',
  // battlefield backgrounds
  'battlefield/forest': '/assets/004-battlefield-forest.png',
  'battlefield/enchanted-forest': '/assets/004-battlefield-enchanted-forest.png',
  'battlefield/hill': '/assets/004-battlefield-on-hill.png',
  'battlefield/crossroads': '/assets/004-battlefield-open-crossroads.png',
  'battlefield/seaside': '/assets/004-battlefield-seaside.png',
  'battlefield/open-road': '/assets/005-battlefield-open-road.png',
}

export function resolveAsset(ref: string | undefined): string | undefined {
  return ref ? REGISTRY[ref] : undefined
}

/** CSS `background-image` value for an AssetRef, or undefined (caller applies a placeholder). */
export function assetBg(ref: string | undefined): string | undefined {
  const url = resolveAsset(ref)
  return url ? `url(${url})` : undefined
}
