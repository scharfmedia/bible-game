import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { createContent } from '@bible/content'
import { newGame, reduce, type Command, type GameState } from '@bible/engine'
import { migrateSave } from './migrations'
import { CURRENT_SCHEMA_VERSION } from './schema'
import { SaveStore } from './store'

const content = createContent()
let keySeq = 0
const freshStore = () => new SaveStore(`test-save-${keySeq++}`)
const apply = (s: GameState, cmd: Command) => reduce(s, cmd).state

function profileWithHeroes(...names: string[]): GameState {
  let s = newGame()
  names.forEach((name, i) => (s = apply(s, { type: 'createHero', id: `h${i}`, name })))
  return s
}

function startedRun(): GameState {
  let s = apply(newGame(), { type: 'createHero', id: 'h0', name: 'Gideon' })
  s = apply(s, { type: 'startRun', characterId: 'h0', worldId: 'world-01', seed: 'persist-seed', content })
  // take a step so the run has some non-initial state
  s = apply(s, { type: 'world/move', target: 'n1' })
  s = apply(s, { type: 'world/leaveScene' })
  return s
}

describe('SaveStore', () => {
  it('round-trips the profile (multiple hero slots)', async () => {
    const store = freshStore()
    const s = profileWithHeroes('Abel', 'Deborah', 'Caleb')
    await store.persist(s)
    const loaded = await store.loadProfile()
    expect(loaded!.slots).toHaveLength(3)
    expect(loaded!.slots.map((x) => x.character.name)).toEqual(['Abel', 'Deborah', 'Caleb'])
  })

  it('persists and resumes an active run IDENTICALLY (mid-run boundary save)', async () => {
    const store = freshStore()
    const s = startedRun()
    expect(s.combat).toBeNull() // at a boundary
    await store.persist(s)
    const loaded = await store.loadRun('h0')
    expect(loaded).toEqual(s.run) // deep-equal (zod reorders keys; the data is identical)
  })

  it('does NOT overwrite the boundary run while mid-combat', async () => {
    const store = freshStore()
    const onMap = startedRun()
    await store.persist(onMap)
    // walk into a combat node, then try to persist mid-combat
    const s = apply(onMap, { type: 'world/move', target: 'n2' })
    expect(s.combat).not.toBeNull()
    await store.persist(s)
    const loaded = await store.loadRun('h0')
    expect(loaded!.world.current).toBe('n1') // still the pre-combat boundary
  })

  it('deletes a hero and its run', async () => {
    const store = freshStore()
    await store.persist(startedRun())
    expect(await store.loadRun('h0')).not.toBeNull()
    await store.deleteHero('h0')
    expect(await store.loadRun('h0')).toBeNull()
    expect((await store.loadProfile())?.slots ?? []).toHaveLength(0)
  })

  it('returns null when empty', async () => {
    const store = freshStore()
    expect(await store.load()).toBeNull()
    expect(await store.loadProfile()).toBeNull()
  })
})

describe('migrateSave', () => {
  it('validates a current-version save', () => {
    const file = { schemaVersion: CURRENT_SCHEMA_VERSION, profile: profileWithHeroes('A').profile, runs: {} }
    expect(migrateSave(file).profile.slots).toHaveLength(1)
  })

  it('refuses a newer version and rejects non-objects', () => {
    expect(() => migrateSave({ schemaVersion: 999, profile: profileWithHeroes().profile, runs: {} })).toThrow(/newer/)
    expect(() => migrateSave(42)).toThrow()
  })
})
