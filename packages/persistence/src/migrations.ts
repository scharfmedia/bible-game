import { CURRENT_SCHEMA_VERSION, SaveFileSchema, type SaveFile } from './schema'

// Ordered migration steps vN → vN+1. None exist yet (v1 is the first), but the chain is in place
// so a future breaking change adds one step + a frozen-fixture test. Unknown future versions are
// refused rather than silently corrupting a save.

type Migration = (raw: Record<string, unknown>) => Record<string, unknown>

const MIGRATIONS: Record<number, Migration> = {
  // 1: (raw) => ({ ...raw, schemaVersion: 2, /* ... */ }),
}

export function migrateSave(raw: unknown): SaveFile {
  if (!raw || typeof raw !== 'object') throw new Error('save: not an object')
  let cur = raw as Record<string, unknown>
  let version = typeof cur.schemaVersion === 'number' ? cur.schemaVersion : 0

  if (version > CURRENT_SCHEMA_VERSION) {
    throw new Error(`save: version ${version} is newer than supported ${CURRENT_SCHEMA_VERSION}`)
  }
  while (version < CURRENT_SCHEMA_VERSION) {
    const step = MIGRATIONS[version]
    if (!step) throw new Error(`save: no migration from version ${version}`)
    cur = step(cur)
    version = cur.schemaVersion as number
  }

  return SaveFileSchema.parse(cur) as unknown as SaveFile
}
