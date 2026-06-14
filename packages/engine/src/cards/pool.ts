// The persistent per-character card POOL — the set of cards reward/shop offers sample from. The
// pool is mostly DERIVED so it self-heals across content rebalances and needs no save migration:
//   effectivePool = base (content.cardPoolStart) ∪ level unlocks (≤ hero level) ∪ Character.pool
// `Character.pool` stores only the event/shop-granted extras. Verse cards (earned via study) and the
// '+' upgrade variants (created by upgrading, never offered) are filtered out. Pure: sampling threads
// `run.rng` via `shuffle` — never Math.random.

import type { ContentBundle } from '../content/bundle'
import { TEST_HERO_NAME, type Character } from '../state/character'
import type { RngState } from '../rng/rng'
import { shuffle } from '../rng/rng'
import type { CardDefId } from '../types'

/** All cards unlocked at or below `level` (keys serialize as strings — coerce with Number). */
export function unlocksUpToLevel(content: ContentBundle, level: number): CardDefId[] {
  const table = content.cardUnlocksByLevel ?? {}
  const out: CardDefId[] = []
  for (const [lvl, ids] of Object.entries(table)) {
    if (Number(lvl) <= level) out.push(...ids)
  }
  return out
}

/** The set of card ids that are some other card's '+' upgrade target (never offered in the pool). */
function upgradeTargets(content: ContentBundle): Set<CardDefId> {
  const set = new Set<CardDefId>()
  for (const c of Object.values(content.cards)) if (c.upgradeTo) set.add(c.upgradeTo)
  return set
}

/**
 * The hero's effective draw pool: base ∪ level-unlocks(≤level) ∪ persistent extras, minus verse
 * cards and '+' variants. Deduped and sorted for determinism (it feeds shuffle/pick).
 */
export function effectivePool(character: Character, content: ContentBundle): CardDefId[] {
  const targets = upgradeTargets(content)
  // Testing hero "Enoch": the whole card library is unlocked (verse + '+' variants still filtered below).
  const merged =
    character.name === TEST_HERO_NAME
      ? Object.keys(content.cards)
      : [...(content.cardPoolStart ?? []), ...unlocksUpToLevel(content, character.level), ...character.pool]
  const seen = new Set<CardDefId>()
  const out: CardDefId[] = []
  for (const id of merged) {
    if (seen.has(id)) continue
    const def = content.cards[id]
    if (!def || def.type === 'verse' || targets.has(id)) continue
    seen.add(id)
    out.push(id)
  }
  return out.sort()
}

/** Sample up to `n` distinct cards from a pool. Returns the picks + advanced rng (value-typed). */
export function sampleCards(pool: readonly CardDefId[], n: number, rng: RngState): [CardDefId[], RngState] {
  const [shuffled, next] = shuffle(rng, pool)
  return [shuffled.slice(0, Math.max(0, n)), next]
}
