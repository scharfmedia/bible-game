// The ContentBundle is the engine's view of game data (maps, encounters, cards, scenes, events,
// items, verses). The engine OWNS these types; the @bible/content package SUPPLIES conforming
// data (it cannot be imported by the engine — purity boundary). A run embeds its bundle
// (RunState.content) so saves are self-contained and reduce(state, cmd) stays pure. All fields
// are plain data (no functions) → fully serializable.

import type { CardDef } from '../cards/types'
import type { CombatFlags, FormationLayout, RewardOption, Row, Side, WinCondition } from '../combat/types'
import type { WorldMap } from '../map/types'
import type { EnemyScalingDef } from '../leveling/scaling'
import type { MoralEvent, Scene } from '../scene/types'
import type { ItemDef } from '../inventory/types'
import type { VerseChallenge } from '../verse/types'
import type { CardDefId, EncounterId, EventId, GraceAbilityId, I18nKey, ItemId, SceneId } from '../types'

/** A content-side enemy template; the encounter builder scales it to the hero's level/depth. */
export interface EnemyTemplate {
  id: string
  archetype: string
  nameKey: I18nKey
  isHuman: boolean
  isDemon?: boolean
  hidden?: boolean
  /** human → its bound demon id (revealed by Sight) */
  revealsId?: string
  /** demon → its host human id (flees when the host dies) */
  boundToId?: string
  scaling: EnemyScalingDef
  /** fixed (un-scaled) special attributes */
  dread?: number
  fleshDamageCap?: number
  spiritualArmor?: number
  side?: Side
  row?: Row
}

export interface EncounterDef {
  id: EncounterId
  enemies: EnemyTemplate[]
  formation?: FormationLayout
  flags: CombatFlags
  winCondition: WinCondition
  rewardOptions?: RewardOption[]
  rewardXp?: number
}

/** Backward-step encounter table (probabilities; remainder = nothing). Milestone-1 minimal. */
export interface BackwardEncounterTable {
  fight: number
  event: number
  fightEncounterId?: EncounterId
  eventId?: EventId
}

export interface WorldContent {
  map: WorldMap
  backwardTable: BackwardEncounterTable
}

export interface ContentBundle {
  heroStartDeck: CardDefId[]
  heroGraceAbilities: GraceAbilityId[]
  cards: Record<CardDefId, CardDef>
  encounters: Record<EncounterId, EncounterDef>
  scenes: Record<SceneId, Scene>
  events: Record<EventId, MoralEvent>
  items: Record<ItemId, ItemDef>
  verses: Record<string, VerseChallenge>
  worlds: Record<string, WorldContent>
}

export const worldMapOf = (content: ContentBundle, worldId: string): WorldMap | undefined =>
  content.worlds[worldId]?.map
