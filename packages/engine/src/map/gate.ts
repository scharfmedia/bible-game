import { itemCount, type InventoryState } from '../inventory/types'
import type { GateExpr, WorldState } from './types'

export interface GateContext {
  inventory: InventoryState
  spirit: number
  world: WorldState
}

/** Evaluate the gate DSL against world flags / inventory / spirit / cleared nodes. Pure. */
export function evalGate(g: GateExpr | undefined, ctx: GateContext): boolean {
  if (!g) return true
  if ('always' in g) return true
  if ('all' in g) return g.all.every((x) => evalGate(x, ctx))
  if ('any' in g) return g.any.some((x) => evalGate(x, ctx))
  if ('not' in g) return !evalGate(g.not, ctx)
  if ('hasItem' in g) return itemCount(ctx.inventory, g.hasItem) >= (g.count ?? 1)
  if ('flag' in g) {
    const v = ctx.world.flags[g.flag]
    return g.eq === undefined ? Boolean(v) : v === g.eq
  }
  if ('spiritAtLeast' in g) return ctx.spirit >= g.spiritAtLeast
  if ('clearedNode' in g) return ctx.world.cleared.includes(g.clearedNode)
  return false
}
