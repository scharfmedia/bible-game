import { z } from 'zod'
import type { ProfileState, RunState } from '@bible/engine'

// The SaveFile envelope is zod-validated on load (untrusted JSON from IndexedDB). The profile is
// validated structurally; run snapshots are validated shallowly (we produced them via the engine
// and they embed a large self-describing ContentBundle — deep mirroring would be brittle).

export const CURRENT_SCHEMA_VERSION = 1

const SettingsSchema = z.object({
  locale: z.enum(['en', 'de']),
  audioVolume: z.number(),
  reducedMotion: z.boolean(),
})

const CharacterSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.number(),
  xp: z.number(),
  allocated: z.record(z.string(), z.number()),
  unspentPoints: z.number(),
  ownedVerseCardIds: z.array(z.string()),
  createdSeq: z.number(),
})

const SlotSchema = z.object({ id: z.string(), character: CharacterSchema })

export const ProfileSchema = z.object({
  slots: z.array(SlotSchema),
  settings: SettingsSchema,
  lastSelectedId: z.string().nullable(),
  nextCreateSeq: z.number(),
})

// Run snapshots: validate just enough to trust the envelope; the body is engine-produced and
// embeds a large self-describing ContentBundle, so the rest passes through untouched.
const RunSchema = z.object({ seed: z.string(), worldId: z.string(), heroMemberId: z.string() }).passthrough()

export const SaveFileSchema = z.object({
  schemaVersion: z.number(),
  profile: ProfileSchema,
  runs: z.record(z.string(), RunSchema.nullable()),
})

// The authoritative type is the SaveFile interface below; zod validates the envelope structurally.
export type ValidatedProfile = ProfileState

export interface SaveFile {
  schemaVersion: number
  profile: ProfileState
  runs: Record<string, RunState | null>
}

export const emptySaveFile = (profile: ProfileState): SaveFile => ({
  schemaVersion: CURRENT_SCHEMA_VERSION,
  profile,
  runs: {},
})
