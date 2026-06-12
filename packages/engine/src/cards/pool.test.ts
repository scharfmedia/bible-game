import { describe, expect, it } from 'vitest'
import { createCharacter, type Character } from '../state/character'
import { seedRng } from '../rng/rng'
import { testContent } from '../testing/fixtures'
import { effectivePool, sampleCards, unlocksUpToLevel } from './pool'

const content = testContent()
const charAt = (level: number, pool: string[] = []): Character => ({ ...createCharacter('h', 'Hero', 1), level, pool })

describe('unlocksUpToLevel', () => {
  it('returns nothing below the first unlock level', () => {
    expect(unlocksUpToLevel(content, 1)).toEqual([])
  })
  it('includes a level once reached (string keys coerced to numbers)', () => {
    expect(unlocksUpToLevel(content, 2)).toContain('mend')
    expect(unlocksUpToLevel(content, 9)).toContain('mend')
  })
})

describe('effectivePool', () => {
  it('is the base pool at level 1 (sorted, deduped)', () => {
    expect(effectivePool(charAt(1), content)).toEqual(['brace', 'guard'])
  })
  it('adds level unlocks once reached', () => {
    expect(effectivePool(charAt(2), content)).toEqual(['brace', 'guard', 'mend'])
  })
  it('folds in the character pool extras and dedupes', () => {
    expect(effectivePool(charAt(1, ['mend', 'brace']), content)).toEqual(['brace', 'guard', 'mend'])
  })
  it("excludes '+' upgrade targets (they are made by honing, never offered)", () => {
    // strike.upgradeTo === 'strike_plus'; even if forced into the pool it must not appear
    expect(effectivePool(charAt(1, ['strike_plus']), content)).not.toContain('strike_plus')
  })
})

describe('sampleCards', () => {
  it('is deterministic for a fixed rng', () => {
    const pool = ['brace', 'guard', 'mend']
    const [a] = sampleCards(pool, 2, seedRng('s'))
    const [b] = sampleCards(pool, 2, seedRng('s'))
    expect(a).toEqual(b)
    expect(a).toHaveLength(2)
  })
  it('returns the whole (distinct) pool when n exceeds its size', () => {
    const [picks] = sampleCards(['brace', 'guard'], 5, seedRng('x'))
    expect([...picks].sort()).toEqual(['brace', 'guard'])
  })
})
