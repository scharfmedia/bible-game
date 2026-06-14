// Pure card PREVIEW — what a card would do right now, reusing the exact combat math so a previewed
// number/chance can never drift from what actually happens. The UI uses this to show a card's
// (Spirit- or level-scaled) damage at rest, the exact per-target hit while aiming, and miracle odds.

import type { CardDef } from '../cards/types'
import { miracleChance, scaleSpiritValue } from '../spirit/spirit'
import type { CardDefId, CombatantId } from '../types'
import { absorb, physicalAmount } from './damage'
import type { CombatState } from './types'

export interface CardDamagePreview {
  /** to-HP damage per hit after the target's block when a defender is given; else the nominal scaled base */
  perHit: number
  hits: number
  total: number
  /** true for spirit cards (scaled by the hidden Spirit stat), false for flesh (scaled by level) */
  spirit: boolean
  blocked: number
}

/** A Spirit-powered miracle's previewed odds/shape (for banish / protect cards). */
export type MiraclePreview =
  | { kind: 'banish'; chance: number }
  | { kind: 'protect'; chance: number; turns: number }

/** The combatant that would play a card owned by `ownerMemberId` (mirrors combat.ts sourceForCard). */
export function cardSource(c: CombatState, ownerMemberId: string): CombatantId | undefined {
  const owner = c.partyOrder.find((id) => c.combatants[id]?.memberId === ownerMemberId && c.combatants[id]?.alive)
  return owner ?? c.partyOrder.find((id) => c.combatants[id]?.alive) ?? c.partyOrder[0]
}

const bySpiritBase = (def: CardDef, amount: number, spirit: number, scale: number): number =>
  def.layer === 'spirit' ? scaleSpiritValue(amount, spirit) : amount * scale

/** Headline damage for a card's first damage op. null for cards that deal no direct damage. */
export function previewCardDamage(
  c: CombatState,
  defId: CardDefId,
  ownerMemberId: string,
  spirit: number,
  defenderId?: CombatantId,
): CardDamagePreview | null {
  const def = c.cardDefs[defId]
  const op = def?.effects.find((e) => e.kind === 'damage')
  if (!def || !op || op.kind !== 'damage') return null

  const srcId = cardSource(c, ownerMemberId)
  const source = srcId ? c.combatants[srcId] : undefined
  if (!source) return null
  const defender = defenderId ? c.combatants[defenderId] : undefined
  const hits = op.hits ?? 1
  const base = bySpiritBase(def, op.amount, spirit, source.scale)

  let perHit = base
  let blocked = 0
  if (defender) {
    const split = absorb(physicalAmount(base, source, defender).amount, defender.block)
    perHit = split.hpDamage
    blocked = split.blocked
  }
  return { perHit, hits, total: perHit * hits, spirit: def.layer === 'spirit', blocked }
}

/** Miracle odds for a banish/protect card at the current Spirit. null for non-miracle cards. */
export function previewMiracle(card: CardDef, spirit: number): MiraclePreview | null {
  for (const op of card.effects) {
    if (op.kind === 'banish') return { kind: 'banish', chance: miracleChance(spirit, op.floor, op.cap) }
    if (op.kind === 'protect') return { kind: 'protect', chance: miracleChance(spirit, op.floor, op.cap), turns: op.turns }
  }
  return null
}
