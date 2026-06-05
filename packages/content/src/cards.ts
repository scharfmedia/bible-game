import type { CardDef } from '@bible/engine'

// Milestone-1 card library. Text lives in @bible/i18n by these keys; the engine sees only data.
// Flesh cards do fixed work; spirit cards (layer:'spirit') auto-scale with Spirit potency and
// FIZZLE when the player is carnal — verse cards (layer:'spirit', no floor) most of all.

export const CARDS: Record<string, CardDef> = {
  // --- flesh ---
  strike: { id: 'strike', type: 'attack', layer: 'flesh', cost: 1, target: 'enemy', nameKey: 'card.strike.name', textKey: 'card.strike.text', rarity: 'starter', effects: [{ kind: 'damage', amount: 6, damageType: 'physical' }] },
  strike_heavy: { id: 'strike_heavy', type: 'attack', layer: 'flesh', cost: 2, target: 'enemy', nameKey: 'card.strike_heavy.name', textKey: 'card.strike_heavy.text', rarity: 'common', effects: [{ kind: 'damage', amount: 10, damageType: 'physical' }] },
  guard: { id: 'guard', type: 'skill', layer: 'flesh', cost: 1, target: 'self', nameKey: 'card.guard.name', textKey: 'card.guard.text', rarity: 'starter', effects: [{ kind: 'block', amount: 5 }] },
  brace: { id: 'brace', type: 'skill', layer: 'flesh', cost: 2, target: 'self', nameKey: 'card.brace.name', textKey: 'card.brace.text', rarity: 'common', effects: [{ kind: 'block', amount: 8 }] },
  second_wind: { id: 'second_wind', type: 'skill', layer: 'flesh', cost: 1, target: 'self', nameKey: 'card.second_wind.name', textKey: 'card.second_wind.text', rarity: 'common', effects: [{ kind: 'heal', amount: 4 }, { kind: 'draw', count: 1 }] },
  flurry: { id: 'flurry', type: 'attack', layer: 'flesh', cost: 1, target: 'enemy', nameKey: 'card.flurry.name', textKey: 'card.flurry.text', rarity: 'common', effects: [{ kind: 'damage', amount: 3, damageType: 'physical', hits: 2 }] },
  shove: { id: 'shove', type: 'attack', layer: 'flesh', cost: 1, target: 'enemy', nameKey: 'card.shove.name', textKey: 'card.shove.text', rarity: 'common', effects: [{ kind: 'damage', amount: 4, damageType: 'physical' }, { kind: 'pushRow' }] },
  quickstep: { id: 'quickstep', type: 'skill', layer: 'flesh', cost: 1, target: 'none', nameKey: 'card.quickstep.name', textKey: 'card.quickstep.text', rarity: 'common', effects: [{ kind: 'draw', count: 2 }] },
  rally: { id: 'rally', type: 'skill', layer: 'flesh', cost: 2, target: 'allAllies', nameKey: 'card.rally.name', textKey: 'card.rally.text', rarity: 'uncommon', effects: [{ kind: 'block', amount: 3, target: 'allAllies' }] },
  subdue: { id: 'subdue', type: 'attack', layer: 'flesh', cost: 1, target: 'enemy', nameKey: 'card.subdue.name', textKey: 'card.subdue.text', rarity: 'uncommon', nonLethal: true, effects: [{ kind: 'damage', amount: 8, damageType: 'physical' }] },
  focus: { id: 'focus', type: 'skill', layer: 'flesh', cost: 0, target: 'none', nameKey: 'card.focus.name', textKey: 'card.focus.text', rarity: 'uncommon', effects: [{ kind: 'gainEnergy', amount: 1 }] },

  // --- spiritual (scale with potency; dim when carnal) ---
  prayer_of_peace: { id: 'prayer_of_peace', type: 'spiritual', layer: 'spirit', cost: 1, target: 'self', nameKey: 'card.prayer_of_peace.name', textKey: 'card.prayer_of_peace.text', rarity: 'common', fruitAffinity: 'faith', effects: [{ kind: 'block', amount: 6, layer: 'spirit' }] },
  light_of_truth: { id: 'light_of_truth', type: 'spiritual', layer: 'spirit', cost: 2, target: 'enemy', nameKey: 'card.light_of_truth.name', textKey: 'card.light_of_truth.text', rarity: 'common', fruitAffinity: 'faith', effects: [{ kind: 'damage', amount: 8, damageType: 'spiritual' }] },
  compassion: { id: 'compassion', type: 'spiritual', layer: 'spirit', cost: 1, target: 'ally', nameKey: 'card.compassion.name', textKey: 'card.compassion.text', rarity: 'uncommon', fruitAffinity: 'mercy', effects: [{ kind: 'heal', amount: 5 }] },

  // --- verse cards (latent until earned via gap-fill; the most potency-gated) ---
  verse_phil_4_6: { id: 'verse_phil_4_6', type: 'verse', layer: 'spirit', cost: 1, target: 'self', nameKey: 'card.verse_phil_4_6.name', textKey: 'card.verse_phil_4_6.text', rarity: 'rare', fruitAffinity: 'faith', verseChallengeId: 'phil_4_6', effects: [{ kind: 'block', amount: 10, layer: 'spirit' }, { kind: 'draw', count: 1 }] },
  verse_zech_4_6: { id: 'verse_zech_4_6', type: 'verse', layer: 'spirit', cost: 2, target: 'enemy', nameKey: 'card.verse_zech_4_6.name', textKey: 'card.verse_zech_4_6.text', rarity: 'rare', fruitAffinity: 'faith', verseChallengeId: 'zech_4_6', effects: [{ kind: 'damage', amount: 12, damageType: 'spiritual' }] },
  verse_luke_10_27: { id: 'verse_luke_10_27', type: 'verse', layer: 'spirit', cost: 1, target: 'self', nameKey: 'card.verse_luke_10_27.name', textKey: 'card.verse_luke_10_27.text', rarity: 'rare', fruitAffinity: 'mercy', verseChallengeId: 'luke_10_27', effects: [{ kind: 'block', amount: 8, layer: 'spirit' }, { kind: 'heal', amount: 4 }] },
}

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
