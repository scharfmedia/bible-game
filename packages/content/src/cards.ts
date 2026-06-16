import type { CardDef } from '@bible/engine'

// Milestone-1 card library. Text lives in @bible/i18n by these keys; the engine sees only data.
// Flesh cards do fixed work; spirit cards (layer:'spirit') auto-scale with Spirit potency and
// FIZZLE when the player is carnal — verse cards (layer:'spirit', no floor) most of all.

export const CARDS: Record<string, CardDef> = {
  // --- flesh ---
  strike: { id: 'strike', type: 'attack', layer: 'flesh', cost: 1, target: 'enemy', nameKey: 'card.strike.name', textKey: 'card.strike.text', rarity: 'starter', upgradeTo: 'strike_plus', effects: [{ kind: 'damage', amount: 6 }] },
  strike_heavy: { id: 'strike_heavy', type: 'attack', layer: 'flesh', cost: 2, target: 'enemy', nameKey: 'card.strike_heavy.name', textKey: 'card.strike_heavy.text', rarity: 'common', effects: [{ kind: 'damage', amount: 10 }] },
  guard: { id: 'guard', type: 'skill', layer: 'flesh', cost: 1, target: 'self', nameKey: 'card.guard.name', textKey: 'card.guard.text', rarity: 'starter', upgradeTo: 'guard_plus', effects: [{ kind: 'block', amount: 5 }] },
  brace: { id: 'brace', type: 'skill', layer: 'flesh', cost: 2, target: 'self', nameKey: 'card.brace.name', textKey: 'card.brace.text', rarity: 'common', effects: [{ kind: 'block', amount: 8 }] },
  second_wind: { id: 'second_wind', type: 'skill', layer: 'flesh', cost: 1, target: 'self', nameKey: 'card.second_wind.name', textKey: 'card.second_wind.text', rarity: 'common', upgradeTo: 'second_wind_plus', effects: [{ kind: 'heal', amount: 4 }, { kind: 'draw', count: 1 }] },
  flurry: { id: 'flurry', type: 'attack', layer: 'flesh', cost: 1, target: 'enemy', nameKey: 'card.flurry.name', textKey: 'card.flurry.text', rarity: 'common', upgradeTo: 'flurry_plus', effects: [{ kind: 'damage', amount: 3, hits: 2 }] },
  shove: { id: 'shove', type: 'attack', layer: 'flesh', cost: 1, target: 'enemy', nameKey: 'card.shove.name', textKey: 'card.shove.text', rarity: 'common', effects: [{ kind: 'damage', amount: 4 }, { kind: 'pushRow' }] },
  quickstep: { id: 'quickstep', type: 'skill', layer: 'flesh', cost: 1, target: 'none', nameKey: 'card.quickstep.name', textKey: 'card.quickstep.text', rarity: 'common', effects: [{ kind: 'draw', count: 2 }] },
  rally: { id: 'rally', type: 'skill', layer: 'flesh', cost: 2, target: 'allAllies', nameKey: 'card.rally.name', textKey: 'card.rally.text', rarity: 'uncommon', effects: [{ kind: 'block', amount: 3, target: 'allAllies' }] },
  subdue: { id: 'subdue', type: 'attack', layer: 'flesh', cost: 1, target: 'enemy', nameKey: 'card.subdue.name', textKey: 'card.subdue.text', rarity: 'uncommon', nonLethal: true, effects: [{ kind: 'damage', amount: 8 }] },
  focus: { id: 'focus', type: 'skill', layer: 'flesh', cost: 0, target: 'none', nameKey: 'card.focus.name', textKey: 'card.focus.text', rarity: 'uncommon', effects: [{ kind: 'gainEnergy', amount: 1 }] },

  // --- card-manipulation skills (resolved via a "pick cards from a pile" modal in the UI) ---
  // "Iron sharpeneth iron" (Prov 27:17) — temper a chosen card into its '+' form for this battle.
  sharpen: { id: 'sharpen', type: 'skill', layer: 'flesh', cost: 1, target: 'none', nameKey: 'card.sharpen.name', textKey: 'card.sharpen.text', rarity: 'uncommon', effects: [{ kind: 'hone', count: 1 }] },
  // "Lay aside every weight" (Heb 12:1) — banish clutter (chosen cards) to the exhaust pile. Exhausts.
  cast_off: { id: 'cast_off', type: 'skill', layer: 'flesh', cost: 1, target: 'none', exhaust: true, nameKey: 'card.cast_off.name', textKey: 'card.cast_off.text', rarity: 'uncommon', effects: [{ kind: 'exhaustChosen', count: 2 }] },
  // "Prepare ye the way" (Isa 40:3) — set a chosen card on top of the draw pile, drawn first next round.
  prepare: { id: 'prepare', type: 'skill', layer: 'flesh', cost: 0, target: 'none', nameKey: 'card.prepare.name', textKey: 'card.prepare.text', rarity: 'uncommon', effects: [{ kind: 'topDeck', count: 1 }] },

  // --- enemy-injected clutter (never owned/bought): a "thorn" that only clogs the deck (Matt 13:22).
  //     Unplayable; cleared only by an `exhaustChosen` card (Cast Off). ---
  spike: { id: 'spike', type: 'status', layer: 'flesh', cost: 0, target: 'none', unplayable: true, nameKey: 'card.spike.name', textKey: 'card.spike.text', effects: [] },

  // --- MIRACLE cards: earned ONLY by solving scripture (study at a fireplace → ownedVerseCardIds →
  //     persistent across runs). All `layer:'spirit'`: chance + magnitude scale with the hidden Spirit
  //     stat, and they fizzle when carnal. They are never in the pool/starter deck. ---
  // "Not by might, nor by power, but by my Spirit" — God removes a foe from the field.
  verse_zech_4_6: { id: 'verse_zech_4_6', type: 'verse', layer: 'spirit', cost: 2, target: 'none', exhaust: true, nameKey: 'card.verse_zech_4_6.name', textKey: 'card.verse_zech_4_6.text', rarity: 'rare', fruitAffinity: 'faith', verseChallengeId: 'zech_4_6', effects: [{ kind: 'banish', floor: 0.1, cap: 0.85 }] },
  // "The peace of God shall guard your hearts" — a shield that may turn deadly blows into a scratch.
  verse_phil_4_6: { id: 'verse_phil_4_6', type: 'verse', layer: 'spirit', cost: 1, target: 'allAllies', nameKey: 'card.verse_phil_4_6.name', textKey: 'card.verse_phil_4_6.text', rarity: 'rare', fruitAffinity: 'faith', verseChallengeId: 'phil_4_6', effects: [{ kind: 'protect', turns: 2, floor: 0.15, cap: 0.9, target: 'allAllies' }] },
  // "Love thy neighbour" — mercy poured out heals the whole company (scales with Spirit).
  verse_luke_10_27: { id: 'verse_luke_10_27', type: 'verse', layer: 'spirit', cost: 1, target: 'allAllies', nameKey: 'card.verse_luke_10_27.name', textKey: 'card.verse_luke_10_27.text', rarity: 'rare', fruitAffinity: 'mercy', verseChallengeId: 'luke_10_27', effects: [{ kind: 'heal', amount: 8, target: 'allAllies' }] },
  // "Open his eyes, that he may see" — applied to a foe, reveals the demon bound behind it (replaces
  // the old Sight grace button). A plain card: a dead draw when no demon hides — a deckbuilding choice.
  verse_2kings_6_17: { id: 'verse_2kings_6_17', type: 'verse', layer: 'spirit', cost: 1, target: 'enemy', nameKey: 'card.verse_2kings_6_17.name', textKey: 'card.verse_2kings_6_17.text', rarity: 'rare', fruitAffinity: 'knowledge', verseChallengeId: '2kings_6_17', effects: [{ kind: 'revealHidden', via: 'sight' }] },

  // --- '+' upgrade variants (created by upgrading at a fire; never offered in the pool) ---
  strike_plus: { id: 'strike_plus', type: 'attack', layer: 'flesh', cost: 1, target: 'enemy', nameKey: 'card.strike_plus.name', textKey: 'card.strike_plus.text', rarity: 'starter', effects: [{ kind: 'damage', amount: 9 }] },
  guard_plus: { id: 'guard_plus', type: 'skill', layer: 'flesh', cost: 1, target: 'self', nameKey: 'card.guard_plus.name', textKey: 'card.guard_plus.text', rarity: 'starter', effects: [{ kind: 'block', amount: 8 }] },
  second_wind_plus: { id: 'second_wind_plus', type: 'skill', layer: 'flesh', cost: 1, target: 'self', nameKey: 'card.second_wind_plus.name', textKey: 'card.second_wind_plus.text', rarity: 'common', effects: [{ kind: 'heal', amount: 6 }, { kind: 'draw', count: 1 }] },
  flurry_plus: { id: 'flurry_plus', type: 'attack', layer: 'flesh', cost: 1, target: 'enemy', nameKey: 'card.flurry_plus.name', textKey: 'card.flurry_plus.text', rarity: 'common', effects: [{ kind: 'damage', amount: 3, hits: 3 }] },

  // --- pool cards unlocked by hero level (see cardUnlocksByLevel in index.ts) ---
  riposte: { id: 'riposte', type: 'attack', layer: 'flesh', cost: 1, target: 'enemy', nameKey: 'card.riposte.name', textKey: 'card.riposte.text', rarity: 'common', effects: [{ kind: 'block', amount: 5 }, { kind: 'damage', amount: 5 }] },
  exhort: { id: 'exhort', type: 'skill', layer: 'flesh', cost: 1, target: 'allAllies', nameKey: 'card.exhort.name', textKey: 'card.exhort.text', rarity: 'uncommon', effects: [{ kind: 'applyStatus', status: 'strength', stacks: 1, target: 'allAllies' }] },
  steadfast: { id: 'steadfast', type: 'power', layer: 'flesh', cost: 2, target: 'self', nameKey: 'card.steadfast.name', textKey: 'card.steadfast.text', rarity: 'uncommon', effects: [{ kind: 'block', amount: 4 }, { kind: 'applyStatus', status: 'strength', stacks: 1, target: 'self' }] },
}

/** Cards available to draw/buy from the pool at level 1 (the existing non-starter library). */
export const CARD_POOL_START: string[] = [
  'strike_heavy',
  'brace',
  'quickstep',
  'shove',
  'rally',
  'focus',
  // card-manipulation skills — offered in rewards/shops
  'sharpen',
  'cast_off',
  'prepare',
]

/** Cards added to the hero's pool upon reaching each level. Spirit cards are NOT here — they are
 *  earned only by solving scripture (study at a fireplace) and persist via ownedVerseCardIds. */
export const CARD_UNLOCKS_BY_LEVEL: Record<number, string[]> = {
  2: ['riposte'],
  3: ['exhort'],
  5: ['steadfast'],
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
  // card-manipulation skills — seeded into the starter deck so the new modals are immediately
  // playable/testable. (Easily removed: these are also in CARD_POOL_START for normal acquisition.)
  'sharpen',
  'cast_off',
  'prepare',
  // No spirit cards by default — miracle cards are earned by solving scripture (study at a fireplace).
]
