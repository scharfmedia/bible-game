// Design reference size. The whole UI is laid out at this fixed resolution inside `.stage`, then
// uniformly scaled to fit the viewport (see styles.css). Keeping one reference means the layout looks
// pixel-identical on every device — only the scale factor changes.
export const DESIGN_W = 1280
export const DESIGN_H = 720

/**
 * Publish viewport-derived CSS custom properties before first paint and on every resize:
 *  - `--app-height`: the *visible* viewport height (visualViewport), so the full-screen letterbox
 *    container fits the visible area even on Android tablet browsers where `100vh` overshoots.
 *  - `--ui-scale`: uniform scale factor `min(width/DESIGN_W, height/DESIGN_H)` applied to `.stage`,
 *    so text, cards and HUD all scale together (fixes the cross-device scale inconsistency).
 */
export function installViewportMetrics(): void {
  if (typeof window === 'undefined') return
  const root = document.documentElement
  const apply = () => {
    const w = window.visualViewport?.width ?? window.innerWidth
    const h = window.visualViewport?.height ?? window.innerHeight
    root.style.setProperty('--app-height', `${Math.round(h)}px`)
    const scale = Math.min(w / DESIGN_W, h / DESIGN_H)
    root.style.setProperty('--ui-scale', String(scale))
  }
  apply()
  window.addEventListener('resize', apply)
  window.addEventListener('orientationchange', apply)
  const vv = window.visualViewport
  if (vv) {
    vv.addEventListener('resize', apply)
    vv.addEventListener('scroll', apply)
  }
}
