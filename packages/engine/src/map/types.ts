import type { AssetRef, CardDefId, DialogueId, DialogueNodeId, EdgeId, EncounterId, EventId, I18nKey, ItemId, NodeId, SceneId, StoryId } from '../types'

export type NodeType =
  | 'entrance'
  | 'combat'
  | 'elite'
  | 'boss'
  | 'shop'
  | 'fireplace'
  | 'rest'
  | 'event'
  | 'scene'
  | 'waypoint'
  | 'explore'
  | 'secret'

/** Node types that are "quiet" on revisit (no ambush): rest nodes and cleared combats. */
export const REST_TYPES: readonly NodeType[] = ['rest', 'fireplace']
export const COMBAT_TYPES: readonly NodeType[] = ['combat', 'elite', 'boss']

/** Tiny pure boolean DSL gating edges and node visibility against world flags/inventory/spirit. */
export type GateExpr =
  | { all: GateExpr[] }
  | { any: GateExpr[] }
  | { not: GateExpr }
  | { hasItem: string; count?: number }
  | { flag: string; eq?: boolean | number | string }
  | { spiritAtLeast: number }
  | { clearedNode: NodeId }
  | { always: true }

/** What fires the FIRST time the hero steps forward into a node. */
export type FixedEvent =
  | { kind: 'none' }
  | { kind: 'combat'; encounter: EncounterId }
  | { kind: 'boss'; encounter: EncounterId }
  | { kind: 'scene'; sceneId: SceneId }
  | { kind: 'event'; eventId: EventId }
  | { kind: 'dialogue'; dialogueId: DialogueId }
  | { kind: 'story'; storyId: StoryId }
  | { kind: 'fireplace' }
  | { kind: 'shop' }

export interface MapNode {
  id: NodeId
  type: NodeType
  nameKey: I18nKey
  /** layout for the scrollable map view (engine computes; UI renders) */
  pos: { x: number; y: number }
  /** distance from entrance; used for forward/backward classification + scaling */
  depth: number
  fixedEvent: FixedEvent
  sceneId?: SceneId
  /** node hidden until this gate is satisfied (secret/hidden nodes) */
  reveal?: GateExpr
  /** background for non-combat node screens (rest/fireplace) + map thumbnail */
  bgAsset?: AssetRef
  /** optional dedicated music track for this node; when unset the map music plays (ducked) */
  musicKey?: AssetRef
  tags: string[]
}

export interface MapEdge {
  id: EdgeId
  a: NodeId
  b: NodeId
  /** edge locked until the gate passes (then latched into edgesUnlocked) */
  gate?: GateExpr
  /** if set, the edge is only traversable toward this node */
  oneWay?: NodeId
}

/** A faint region name painted across the parchment at grid x (y sits in the band above the nodes). */
export interface MapRegion {
  key: I18nKey
  x: number
}

/** Immutable for a run (regenerable from seed). Lives in content; never serialized in the save. */
export interface WorldMap {
  worldId: string
  seed: string
  /** primary entry node (fallback when `entrances` is unset) */
  entrance: NodeId
  /** all places the pilgrim may START a run; the player picks one on the map. Defaults to [entrance]. */
  entrances?: NodeId[]
  bossId: NodeId
  /** optional closing narration shown once the boss is defeated (the map's outro story) */
  outroStoryId?: StoryId
  /** the adventure's overworld music track (played on the map; ducked/boosted by context) */
  musicKey?: AssetRef
  /** optional faint region labels painted on the parchment (omit for short maps like the tutorial) */
  regions?: MapRegion[]
  nodes: Record<NodeId, MapNode>
  edges: Record<EdgeId, MapEdge>
  adjacency: Record<NodeId, EdgeId[]>
}

/** Per-scene mutable progress (kept tiny; most state lives in world flags). */
export interface SceneRuntimeState {
  takenHotspots: string[]
  toggled: Record<string, boolean>
  dialogueSeen: string[]
}

/** A shop's stock, generated once on first entry (deterministic per node) and persisted per run so
 *  re-entry shows the same wares and sold-out items stay sold. */
export interface ShopCardOffer {
  defId: CardDefId
  price: number
  sold: boolean
}
export interface ShopItemOffer {
  itemId: ItemId
  price: number
  sold: boolean
}
export interface ShopState {
  cards: ShopCardOffer[]
  items: ShopItemOffer[]
  /** gold cost to remove one card from the run deck (repeatable) */
  removePrice: number
}

/** An in-progress conversation overlay. Additive state: the scene/map underneath stays mounted,
 *  so there is no movement/screen change while talking — only this cursor and the active id. */
export interface ActiveDialogue {
  dialogueId: DialogueId
  node: DialogueNodeId
}

/** An open story/narration overlay (additive, like a dialogue). */
export interface ActiveStory {
  storyId: StoryId
}

/** The movement/interaction state machine. */
export type MovementPhase =
  | { kind: 'idle' }
  | { kind: 'resolvingFixed'; node: NodeId }
  | { kind: 'inScene'; sceneId: SceneId }
  | { kind: 'inEvent'; eventId: EventId; node: NodeId; backward?: boolean }
  | { kind: 'inCombat'; encounter: EncounterId; node: NodeId; backward?: boolean }
  | { kind: 'locked'; reason: string }

/** Mutable run progress, separate from the immutable WorldMap. Uses arrays/records (JSON-safe). */
export interface WorldState {
  worldId: string
  current: NodeId
  visited: NodeId[]
  cleared: NodeId[]
  revealed: NodeId[]
  edgesUnlocked: EdgeId[]
  flags: Record<string, string | number | boolean>
  sceneStates: Record<SceneId, SceneRuntimeState>
  /** per-shop-node stock, generated lazily on first entry */
  shopStates: Record<NodeId, ShopState>
  movement: MovementPhase
  /** the active conversation overlay, if any (rendered on top of the current scene/map) */
  dialogue: ActiveDialogue | null
  /** the active story/narration overlay, if any */
  story: ActiveStory | null
  /** dedicated cursor for the revisit-ambush RNG sub-stream */
  ambushCursor: number
  bossDefeated: boolean
}

export const initialWorldState = (worldId: string, entrance: NodeId): WorldState => ({
  worldId,
  current: entrance,
  visited: [entrance],
  cleared: [],
  revealed: [],
  edgesUnlocked: [],
  flags: {},
  sceneStates: {},
  shopStates: {},
  movement: { kind: 'idle' },
  dialogue: null,
  story: null,
  ambushCursor: 0,
  bossDefeated: false,
})
