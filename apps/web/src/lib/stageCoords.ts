import { DESIGN_W, DESIGN_H } from './appHeight'

/**
 * Map a viewport/client point — a pointer's clientX/clientY, or a point from getBoundingClientRect
 * (which returns post-transform *visual* coordinates) — into the `.stage` design coordinate space
 * (0..DESIGN_W × 0..DESIGN_H).
 *
 * Use this for any coordinate that drives an element's RENDER position *inside* the scaled stage
 * (the combat aim arrow / ghost card, the held-item ghost, the radial menu). Hit-testing via
 * document.elementFromPoint must keep raw viewport coordinates — don't convert those.
 */
export function viewportToStage(clientX: number, clientY: number): { x: number; y: number } {
  const stage = document.querySelector('.stage')
  if (!stage) return { x: clientX, y: clientY }
  const r = stage.getBoundingClientRect()
  const sx = r.width / DESIGN_W || 1
  const sy = r.height / DESIGN_H || 1
  return { x: (clientX - r.left) / sx, y: (clientY - r.top) / sy }
}
