import type { CardDef } from '@bible/engine'

// Milestone-1 card library. Text lives in @bible/i18n by these keys; the engine sees only data.
// Flesh cards do fixed work; spirit cards (layer:'spirit') auto-scale with Spirit potency and
// FIZZLE when the player is carnal — verse cards (layer:'spirit', no floor) most of all.

export const CARDS: Record<string, CardDef> = {
  // --- flesh ---
  strike: { id: 'strike', type: 'attack', layer: 'flesh', cost: 1, target: 'enemy', nameKey: 'card.strike.name', textKey: 'card.strike.text', rarity: 'starter', upgradeTo: 'strike_plus', effects: [{ kind: 'damage', amount: 6, damageType: 'physical' }] },
  strike_heavy: { id: 'strike_heavy', type: 'attack', layer: 'flesh', cost: 2, target: 'enemy', nameKey: 'card.strike_heavy.name', textKey: 'card.strike_heavy.text', rarity: 'common', effects: [{ kind: 'damage', amount: 10, damageType: 'physical' }] },
  guard: { id: 'guard', type: 'skill', layer: 'flesh', cost: 1, target: 'self', nameKey: 'card.guard.name', textKey: 'card.guard.text', rarity: 'starter', upgradeTo: 'guard_plus', effects: [{ kind: 'block', amount: 5 }] },
  brace: { id: 'brace', type: 'skill', layer: 'flesh', cost: 2, target: 'self', nameKey: 'card.brace.name', textKey: 'card.brace.text', rarity: 'common', effects: [{ kind: 'block', amount: 8 }] },
  second_wind: { id: 'second_wind', type: 'skill', layer: 'flesh', cost: 1, target: 'self', nameKey: 'card.second_wind.name', textKey: 'card.second_wind.text', rarity: 'common', upgradeTo: 'second_wind_plus', effects: [{ kind: 'heal', amount: 4 }, { kind: 'draw', count: 1 }] },
  flurry: { id: 'flurry', type: 'attack', layer: 'flesh', cost: 1, target: 'enemy', nameKey: 'card.flurry.name', textKey: 'card.flurry.text', rarity: 'common', upgradeTo: 'flurry_plus', effects: [{ kind: 'damage', amount: 3, damageType: 'physical', hits: 2 }] },
  shove: { id: 'shove', type: 'attack', layer: 'flesh', cost: 1, target: 'enemy', nameKey: 'card.shove.name', textKey: 'card.shove.text', rarity: 'common', effects: [{ kind: 'damage', amount: 4, damageType: 'physical' }, { kind: 'pushRow' }] },
  quickstep: { id: 'quickstep', type: 'skill', layer: 'flesh', cost: 1, target: 'none', nameKey: 'card.quickstep.name', textKey: 'card.quickstep.text', rarity: 'common', effects: [{ kind: 'draw', count: 2 }] },
  rally: { id: 'rally', type: 'skill', layer: 'flesh', cost: 2, target: 'allAllies', nameKey: 'card.rally.name', textKey: 'card.rally.text', rarity: 'uncommon', effects: [{ kind: 'block', amount: 3, target: 'allAllies' }] },
  subdue: { id: 'subdue', type: 'attack', layer: 'flesh', cost: 1, target: 'enemy', nameKey: 'card.subdue.name', textKey: 'card.subdue.text', rarity: 'uncommon', nonLethal: true, effects: [{ kind: 'damage', amount: 8, damageType: 'physical' }] },
  focus: { id: 'focus', type: 'skill', layer: 'flesh', cost: 0, target: 'none', nameKey: 'card.focus.name', textKey: 'card.focus.text', rarity: 'uncommon', effects: [{ kind: 'gainEnergy', amount: 1 }] },

  // --- spiritual (scale with potency; dim when carnal) ---
  prayer_of_peace: { id: 'prayer_of_peace', type: 'spiritual', layer: 'spirit', cost: 1, target: 'self', nameKey: 'card.prayer_of_peace.name', textKey: 'card.prayer_of_peace.text', rarity: 'common', fruitAffinity: 'faith', upgradeTo: 'prayer_of_peace_plus', effects: [{ kind: 'block', amount: 6, layer: 'spirit' }] },
  light_of_truth: { id: 'light_of_truth', type: 'spiritual', layer: 'spirit', cost: 2, target: 'enemy', nameKey: 'card.light_of_truth.name', textKey: 'card.light_of_truth.text', rarity: 'common', fruitAffinity: 'faith', upgradeTo: 'light_of_truth_plus', effects: [{ kind: 'damage', amount: 8, damageType: 'spiritual' }] },
  compassion: { id: 'compassion', type: 'spiritual', layer: 'spirit', cost: 1, target: 'ally', nameKey: 'card.compassion.name', textKey: 'card.compassion.text', rarity: 'uncommon', fruitAffinity: 'mercy', effects: [{ kind: 'heal', amount: 5 }] },

  // --- verse cards (latent until earned via gap-fill; the most potency-gated) ---
  verse_phil_4_6: { id: 'verse_phil_4_6', type: 'verse', layer: 'spirit', cost: 1, target: 'self', nameKey: 'card.verse_phil_4_6.name', textKey: 'card.verse_phil_4_6.text', rarity: 'rare', fruitAffinity: 'faith', verseChallengeId: 'phil_4_6', effects: [{ kind: 'block', amount: 10, layer: 'spirit' }, { kind: 'draw', count: 1 }] },
  verse_zech_4_6: { id: 'verse_zech_4_6', type: 'verse', layer: 'spirit', cost: 2, target: 'enemy', nameKey: 'card.verse_zech_4_6.name', textKey: 'card.verse_zech_4_6.text', rarity: 'rare', fruitAffinity: 'faith', verseChallengeId: 'zech_4_6', effects: [{ kind: 'damage', amount: 12, damageType: 'spiritual' }] },
  verse_luke_10_27: { id: 'verse_luke_10_27', type: 'verse', layer: 'spirit', cost: 1, target: 'self', nameKey: 'card.verse_luke_10_27.name', textKey: 'card.verse_luke_10_27.text', rarity: 'rare', fruitAffinity: 'mercy', verseChallengeId: 'luke_10_27', effects: [{ kind: 'block', amount: 8, layer: 'spirit' }, { kind: 'heal', amount: 4 }] },

  // --- '+' upgrade variants (created by upgrading at a fire; never offered in the pool) ---
  strike_plus: { id: 'strike_plus', type: 'attack', layer: 'flesh', cost: 1, target: 'enemy', nameKey: 'card.strike_plus.name', textKey: 'card.strike_plus.text', rarity: 'starter', effects: [{ kind: 'damage', amount: 9, damageType: 'physical' }] },
  guard_plus: { id: 'guard_plus', type: 'skill', layer: 'flesh', cost: 1, target: 'self', nameKey: 'card.guard_plus.name', textKey: 'card.guard_plus.text', rarity: 'starter', effects: [{ kind: 'block', amount: 8 }] },
  second_wind_plus: { id: 'second_wind_plus', type: 'skill', layer: 'flesh', cost: 1, target: 'self', nameKey: 'card.second_wind_plus.name', textKey: 'card.second_wind_plus.text', rarity: 'common', effects: [{ kind: 'heal', amount: 6 }, { kind: 'draw', count: 1 }] },
  flurry_plus: { id: 'flurry_plus', type: 'attack', layer: 'flesh', cost: 1, target: 'enemy', nameKey: 'card.flurry_plus.name', textKey: 'card.flurry_plus.text', rarity: 'common', effects: [{ kind: 'damage', amount: 3, damageType: 'physical', hits: 3 }] },
  prayer_of_peace_plus: { id: 'prayer_of_peace_plus', type: 'spiritual', layer: 'spirit', cost: 1, target: 'self', nameKey: 'card.prayer_of_peace_plus.name', textKey: 'card.prayer_of_peace_plus.text', rarity: 'common', fruitAffinity: 'faith', effects: [{ kind: 'block', amount: 9, layer: 'spirit' }] },
  light_of_truth_plus: { id: 'light_of_truth_plus', type: 'spiritual', layer: 'spirit', cost: 2, target: 'enemy', nameKey: 'card.light_of_truth_plus.name', textKey: 'card.light_of_truth_plus.text', rarity: 'common', fruitAffinity: 'faith', effects: [{ kind: 'damage', amount: 12, damageType: 'spiritual' }] },

  // --- pool cards unlocked by hero level (see cardUnlocksByLevel in index.ts) ---
  riposte: { id: 'riposte', type: 'attack', layer: 'flesh', cost: 1, target: 'enemy', nameKey: 'card.riposte.name', textKey: 'card.riposte.text', rarity: 'common', effects: [{ kind: 'block', amount: 5 }, { kind: 'damage', amount: 5, damageType: 'physical' }] },
  rebuke: { id: 'rebuke', type: 'spiritual', layer: 'spirit', cost: 1, target: 'enemy', nameKey: 'card.rebuke.name', textKey: 'card.rebuke.text', rarity: 'common', fruitAffinity: 'faith', effects: [{ kind: 'damage', amount: 5, damageType: 'spiritual' }, { kind: 'applyStatus', status: 'weak', stacks: 1 }] },
  exhort: { id: 'exhort', type: 'skill', layer: 'flesh', cost: 1, target: 'allAllies', nameKey: 'card.exhort.name', textKey: 'card.exhort.text', rarity: 'uncommon', effects: [{ kind: 'applyStatus', status: 'strength', stacks: 1, target: 'allAllies' }] },
  discernment: { id: 'discernment', type: 'spiritual', layer: 'spirit', cost: 1, target: 'self', nameKey: 'card.discernment.name', textKey: 'card.discernment.text', rarity: 'uncommon', fruitAffinity: 'faith', effects: [{ kind: 'draw', count: 1 }, { kind: 'revealHidden', via: 'sight' }] },
  steadfast: { id: 'steadfast', type: 'power', layer: 'flesh', cost: 2, target: 'self', nameKey: 'card.steadfast.name', textKey: 'card.steadfast.text', rarity: 'uncommon', effects: [{ kind: 'block', amount: 4 }, { kind: 'applyStatus', status: 'strength', stacks: 1, target: 'self' }] },
  intercession: { id: 'intercession', type: 'spiritual', layer: 'spirit', cost: 2, target: 'allAllies', nameKey: 'card.intercession.name', textKey: 'card.intercession.text', rarity: 'rare', fruitAffinity: 'mercy', effects: [{ kind: 'heal', amount: 4, target: 'allAllies' }] },
}

/** Cards available to draw/buy from the pool at level 1 (the existing non-starter library). */
export const CARD_POOL_START: string[] = [
  'strike_heavy',
  'brace',
  'quickstep',
  'shove',
  'rally',
  'focus',
  'compassion',
]

/** Cards added to the hero's pool upon reaching each level. */
export const CARD_UNLOCKS_BY_LEVEL: Record<number, string[]> = {
  2: ['riposte', 'rebuke'],
  3: ['exhort'],
  4: ['discernment'],
  5: ['steadfast'],
  6: ['intercession'],
}

/** Max run-deck size; reward/shop adds are blocked at the cap. */
export const DECK_LIMIT = 20

export const HERO_START_DECK: string[] = [
  'strike',
  'strike',
  'strike',
  'guard',
  'guard',
  'subdue', // mercy is possible from the very first robber fight
  'second_wind',
  'flurry',
  'prayer_of_peace',
  'light_of_truth',
]
