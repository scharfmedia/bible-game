// Grace abilities are a fixed hero KIT (not cards), spending a dedicated `grace` resource so they
// never compete for card energy. Grace flows FROM walking in the Spirit; using it nudges Spirit up.
// Mercy/Stay-the-Hand (subdue a human without killing — Luke 6:36) is the hero's grace ability.
// (Sight — revealing the demon behind a human, 2 Kings 6:17 — used to live here as grace; it is now
// the EARNED "Open My Eyes" verse card, played on a foe via the `revealHidden` effect op.)

import type { GraceAbilityId, I18nKey } from '../types'

export interface GraceAbilityMeta {
  id: GraceAbilityId
  costGrace: number
  nameKey: I18nKey
  descKey: I18nKey
  scriptureRef: string
  /** what the ability needs to target */
  target: 'humanEnemy' | 'enemy' | 'none'
}

export const GRACE_ABILITIES: Record<GraceAbilityId, GraceAbilityMeta> = {
  mercy: {
    id: 'mercy',
    costGrace: 0,
    nameKey: 'grace.mercy.name',
    descKey: 'grace.mercy.desc',
    scriptureRef: 'Luke 6:36',
    target: 'humanEnemy',
  },
}

export const getGrace = (id: GraceAbilityId): GraceAbilityMeta | undefined => GRACE_ABILITIES[id]
