// Deterministic enemy AI. Enemies telegraph an intent at round start (beginRound) and execute it on
// their turn (executeIntent). Pure: an intent depends only on the combatant and the round number.
//
// Most foes use `defaultIntent` (just attack). Bosses/elites set `aiProfileId` to select a coded
// multi-turn pattern with enrage — the patterns only emit intent kinds the combat core already
// executes (attack/attackMulti/block/buff/debuff), so this is a selection layer, not new execution.

import type { Combatant, Intent, IntentKind } from './types'

export interface AiContext {
  /** 1-based round number; patterns cycle on it. */
  round: number
}

const isBound = (e: Combatant): boolean => e.statuses.some((s) => s.id === 'bound' && s.stacks > 0)

export function pickIntent(enemy: Combatant, ctx: AiContext = { round: 1 }): Intent {
  // bound enemies waste their turn (executeIntent skips + decrements a stack) — must take precedence
  if (isBound(enemy)) return { kind: 'special', value: 0 }
  if (enemy.aiProfileId) return profileIntent(enemy, enemy.aiProfileId, ctx.round)
  return defaultIntent(enemy)
}

function defaultIntent(enemy: Combatant): Intent {
  return { kind: 'attack', value: Math.max(1, enemy.stats.attack) }
}

/** Default AI profile per enemy archetype. Applied at encounter-build time (encounterBuilder) so an
 *  enemy of a given kind behaves consistently with no per-template wiring. A template's explicit
 *  `aiProfileId` still wins — used to split the shared 'demon' archetype into greed vs accuser.
 *  Archetypes not listed (e.g. tutorial 'bandit') fall through to a plain attacker. Ally-buffs /
 *  screens are PERSISTENT POWERS (see ARCHETYPE_POWERS in encounterBuilder), not intents. */
export const ARCHETYPE_PROFILE: Record<string, string> = {
  robber: 'opportunist',
  thief: 'skirmisher',
  demon: 'tormentor',
  philistineSoldier: 'soldier',
  philistineArcher: 'archer',
  shieldBearer: 'shieldGuard',
  dagonZealot: 'zealot',
  idolSpirit: 'idol',
  spiritOfDread: 'dreadSpirit',
  philistineChampion: 'champion',
  goliath: 'goliath',
}

/** Coded boss/elite + per-archetype patterns. `round` is 1-based; "enrage" triggers below half HP.
 *  Every branch emits only intent kinds the combat core already executes (attack/attackMulti/block/
 *  buff=self-status/debuff=hero-status/clutter) — a SELECTION layer, not new execution. Continuous
 *  ally synergies (shield-bearer screen, war-leader rally) live in POWERS, not here. */
function profileIntent(enemy: Combatant, profileId: string, round: number): Intent {
  const enraged = enemy.hp * 2 < enemy.maxHp
  const atk = Math.max(1, enemy.stats.attack)
  const guard = Math.max(1, Math.round(atk * 0.75))
  const at = <T>(cycle: readonly T[]): T => cycle[(round - 1) % cycle.length]!

  switch (profileId) {
    case 'goliath': {
      // brace (gather strength) → wind-up smash (multi-hit) → guard; enraged, he drops the guard and
      // hammers — punishing a stalled, flesh-only game and rewarding spiritual burst before half HP.
      const cycle: IntentKind[] = enraged ? ['buff', 'attackMulti', 'attackMulti'] : ['buff', 'attackMulti', 'block']
      const kind = at(cycle)
      if (kind === 'buff') return { kind: 'buff', status: 'strength', stacks: enraged ? 3 : 2 }
      if (kind === 'attackMulti') return { kind: 'attackMulti', value: atk, hits: enraged ? 4 : 3 }
      return { kind: 'block', value: atk }
    }
    case 'champion': {
      // weaken the hero, then strike; enraged he makes you vulnerable and hits twice as hard. His
      // War-Leader power (ARCHETYPE_POWERS) rallies the line's Strength each round on top of this.
      const kind = at(['debuff', 'attack'] as const)
      if (kind === 'debuff') return { kind: 'debuff', status: enraged ? 'vulnerable' : 'weak', stacks: 2 }
      return { kind: 'attack', value: enraged ? atk * 2 : atk }
    }
    case 'dreadSpirit': {
      // a tormentor: sows intrusive "thorns" (clutter), curses you (vulnerability, then poison on later
      // cycles), then strikes into the opening. Enraged, it sows more thorns to bury you in clutter.
      const kind = at(['clutter', 'debuff', 'attack'] as const)
      if (kind === 'clutter') return { kind: 'clutter', value: enraged ? 2 : 1 }
      if (kind === 'debuff') {
        const poisonPass = Math.floor((round - 1) / 3) % 2 === 1 // alternate the curse each full cycle
        return poisonPass ? { kind: 'debuff', status: 'poison', stacks: 2 } : { kind: 'debuff', status: 'vulnerable', stacks: 1 }
      }
      return { kind: 'attack', value: atk }
    }
    case 'opportunist': {
      // jericho robber: mugs, mugs, then guards when it expects a counter; cornered it drops the guard.
      if (enraged) return { kind: 'attack', value: atk }
      return at(['attack', 'attack', 'block'] as const) === 'block' ? { kind: 'block', value: guard } : { kind: 'attack', value: atk }
    }
    case 'skirmisher': {
      // jericho thief: jabs and snatches (clutter) — its real threat is the demon it hides.
      return at(['attack', 'clutter'] as const) === 'clutter' ? { kind: 'clutter', value: 1 } : { kind: 'attack', value: atk }
    }
    case 'soldier': {
      // philistine soldier: gathers Strength, presses the attack, occasionally guards; enraged it leans in.
      const cycle = enraged ? (['buff', 'attack'] as const) : (['buff', 'attack', 'block'] as const)
      const kind = at(cycle)
      if (kind === 'buff') return { kind: 'buff', status: 'strength', stacks: 1 }
      if (kind === 'block') return { kind: 'block', value: guard }
      return { kind: 'attack', value: atk }
    }
    case 'archer': {
      // philistine archer (back row, half melee): pokes and MARKS the hero Vulnerable to set up the
      // brutes' hits (the archer→brute combo); enraged it marks more often.
      const cycle = enraged ? (['attack', 'debuff'] as const) : (['attack', 'attack', 'debuff'] as const)
      return at(cycle) === 'debuff' ? { kind: 'debuff', status: 'vulnerable', stacks: 1 } : { kind: 'attack', value: atk }
    }
    case 'shieldGuard': {
      // shield-bearer: braces (and screens the line each round via its Aegis power) then jabs; enraged
      // it braces harder. The line-screen synergy is the Aegis POWER, not this intent.
      return at(['block', 'attack'] as const) === 'block'
        ? { kind: 'block', value: enraged ? atk * 2 : Math.max(1, Math.round(atk * 1.25)) }
        : { kind: 'attack', value: atk }
    }
    case 'zealot': {
      // dagon zealot: aggressive melee whose danger is the Strength its bound idol feeds it.
      if (enraged) return { kind: 'attack', value: atk }
      return at(['attack', 'attack', 'block'] as const) === 'block' ? { kind: 'block', value: guard } : { kind: 'attack', value: atk }
    }
    case 'idol': {
      // idol-spirit (back row): poisons the hero and, via its War-Leader power, empowers its host's line.
      return at(['debuff', 'attack'] as const) === 'debuff' ? { kind: 'debuff', status: 'poison', stacks: 1 } : { kind: 'attack', value: atk }
    }
    case 'tormentor': {
      // generic demon: a curse engine — weakens, poisons, then strikes.
      const i = (round - 1) % 3
      if (i === 0) return { kind: 'debuff', status: 'weak', stacks: 1 }
      if (i === 1) return { kind: 'debuff', status: 'poison', stacks: 2 }
      return { kind: 'attack', value: atk }
    }
    case 'greed': {
      // greed demon: drains (weak) + poisons, then strikes. Enraged it BINDS instead of weakening
      // (steals a turn) — gated to the cycle's first step, never the same round it attacks.
      const i = (round - 1) % 3
      if (i === 0) return enraged ? { kind: 'debuff', status: 'bound', stacks: 1 } : { kind: 'debuff', status: 'weak', stacks: 1 }
      if (i === 1) return { kind: 'debuff', status: 'poison', stacks: 2 }
      return { kind: 'attack', value: atk }
    }
    case 'accuser': {
      // boss demon, the voice of condemnation: clutters, curses (vulnerable), strikes, poisons.
      const i = (round - 1) % 4
      if (i === 0) return { kind: 'clutter', value: enraged ? 2 : 1 }
      if (i === 1) return { kind: 'debuff', status: 'vulnerable', stacks: enraged ? 2 : 1 }
      if (i === 2) return { kind: 'attack', value: atk }
      return { kind: 'debuff', status: 'poison', stacks: 2 }
    }
    default:
      return defaultIntent(enemy)
  }
}
