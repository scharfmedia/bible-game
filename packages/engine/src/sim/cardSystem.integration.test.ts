import { describe, expect, it } from 'vitest'
import type { Command } from '../commands/command'
import { newGame, reduce } from '../commands/reduce'
import type { ContentBundle } from '../content/bundle'
import { heroMemberId } from '../state/character'
import type { GameState } from '../state/gameState'
import { testContent } from '../testing/fixtures'

const HERO = heroMemberId('h1')
const strikeA = `${HERO}#0`
const strikeB = `${HERO}#4`
const deckOf = (s: GameState) => s.run!.deckByMember[HERO] ?? []
const apply = (s: GameState, cmd: Command): GameState => reduce(s, cmd).state

/** Drive a fresh run through the first fight to the (pending) reward screen. */
function toBeastReward(content: ContentBundle, seed = 'cs-1'): GameState {
  let s = newGame()
  s = apply(s, { type: 'createHero', id: 'h1', name: 'Gideon' })
  s = apply(s, { type: 'startRun', characterId: 'h1', worldId: 'world-01', seed, content })
  s = apply(s, { type: 'world/chooseEntry', nodeId: 'n0' })
  s = apply(s, { type: 'world/move', target: 'n1' })
  s = apply(s, { type: 'world/enter' })
  s = apply(s, { type: 'world/sceneInteract', sceneId: 'forestHouse', hotspotId: 'drawer', verb: 'take' })
  s = apply(s, { type: 'world/leaveScene' })
  s = apply(s, { type: 'world/move', target: 'n2' })
  s = apply(s, { type: 'world/enter' })
  s = apply(s, { type: 'combat/playCard', iid: strikeA, targetId: 'wolf' })
  s = apply(s, { type: 'combat/playCard', iid: strikeB, targetId: 'wolf' })
  return s
}

const content = testContent()

describe('post-combat reward (spoils + card pick)', () => {
  it('offers a claimable gold spoil and a card pick sampled from the pool', () => {
    const s = toBeastReward(content)
    expect(s.screen).toBe('reward')
    expect(s.combat?.reward?.spoils).toEqual([{ id: 'money', kind: 'money', amount: 20, claimed: false }])
    expect((s.combat?.reward?.cardOptions ?? []).length).toBeGreaterThan(0)
  })

  it('claiming the gold grants currency once (double-claim rejected)', () => {
    let s = toBeastReward(content)
    const before = s.run!.inventory.currency
    s = apply(s, { type: 'combat/claimSpoil', spoilId: 'money' })
    expect(s.run!.inventory.currency).toBe(before + 20)
    const again = reduce(s, { type: 'combat/claimSpoil', spoilId: 'money' })
    expect(again.events).toContainEqual({ type: 'rejected', reason: 'already-claimed' })
    expect(again.state.run!.inventory.currency).toBe(before + 20)
  })

  it('taking a card adds it to the run deck; leaving returns to the map', () => {
    let s = toBeastReward(content)
    const pick = s.combat!.reward!.cardOptions![0]!
    const before = deckOf(s).length
    s = apply(s, { type: 'combat/takeCard', defId: pick })
    expect(deckOf(s)).toContain(pick)
    expect(deckOf(s).length).toBe(before + 1)
    s = apply(s, { type: 'combat/leaveReward' })
    expect(s.screen).toBe('map')
    expect(s.combat).toBeNull()
    expect(s.run!.world.cleared).toContain('n2')
  })

  it('is deterministic — the same seed yields the same card options', () => {
    const a = toBeastReward(content, 'seed-X').combat!.reward!.cardOptions
    const b = toBeastReward(content, 'seed-X').combat!.reward!.cardOptions
    expect(a).toEqual(b)
  })

  it('blocks the card pick when the deck is already at the cap', () => {
    const s = toBeastReward({ ...content, deckLimit: 5 }) // start deck is exactly 5
    expect(s.combat!.reward!.cardOptions).toEqual([])
    const r = reduce(s, { type: 'combat/takeCard', defId: 'brace' })
    expect(r.events).toContainEqual({ type: 'rejected', reason: 'no-such-card-option' })
  })
})

describe('fireplace card upgrade', () => {
  function toFireplace(): GameState {
    let s = toBeastReward(content)
    s = apply(s, { type: 'combat/skipCard' })
    s = apply(s, { type: 'combat/leaveReward' })
    s = apply(s, { type: 'world/move', target: 'n3' })
    s = apply(s, { type: 'world/enter' })
    return s
  }

  it('hones a chosen deck card into its + form (once per fire)', () => {
    let s = toFireplace()
    expect(s.screen).toBe('fireplace')
    expect(deckOf(s)[0]).toBe('strike')

    // a card with no upgradeTo cannot be honed
    const bad = reduce(s, { type: 'world/fireplace', action: 'upgrade', cardIndex: 2 }) // 'light'
    expect(bad.events).toContainEqual({ type: 'rejected', reason: 'not-upgradeable' })

    const r = reduce(s, { type: 'world/fireplace', action: 'upgrade', cardIndex: 0 })
    s = r.state
    expect(r.events).toContainEqual({ type: 'cardUpgraded', from: 'strike', to: 'strike_plus' })
    expect(deckOf(s)[0]).toBe('strike_plus')

    // spent for this fire
    const second = reduce(s, { type: 'world/fireplace', action: 'upgrade', cardIndex: 1 })
    expect(second.events).toContainEqual({ type: 'rejected', reason: 'already-upgraded' })
  })
})

describe('card-granting triggers (scene scripts)', () => {
  // a scene whose drawer also grants a card to the deck and unlocks one into the pool
  const base = testContent()
  const fh = base.scenes.forestHouse!
  const triggerContent: ContentBundle = {
    ...base,
    scenes: {
      ...base.scenes,
      forestHouse: {
        ...fh,
        hotspots: fh.hotspots.map((h) =>
          h.id === 'drawer'
            ? { ...h, interactions: { ...h.interactions, take: { script: [{ giveItem: 'key', count: 1 }, { grantCard: 'brace' }, { unlockCard: 'mend' }, { markTaken: 'drawer' }] } } }
            : h,
        ),
      },
    },
  }

  it('grantCard adds to the run deck and unlockCard adds to the persistent pool', () => {
    let s = newGame()
    s = apply(s, { type: 'createHero', id: 'h1', name: 'Gideon' })
    s = apply(s, { type: 'startRun', characterId: 'h1', worldId: 'world-01', seed: 'trig', content: triggerContent })
    s = apply(s, { type: 'world/chooseEntry', nodeId: 'n0' })
    s = apply(s, { type: 'world/move', target: 'n1' })
    s = apply(s, { type: 'world/enter' })
    const r = reduce(s, { type: 'world/sceneInteract', sceneId: 'forestHouse', hotspotId: 'drawer', verb: 'take' })
    s = r.state
    expect(deckOf(s)).toContain('brace')
    expect(s.profile.slots[0]!.character.pool).toContain('mend')
    expect(r.events).toContainEqual({ type: 'cardGranted', cardId: 'brace' })
    expect(r.events).toContainEqual({ type: 'cardUnlocked', cardId: 'mend' })
  })
})

describe('shop node', () => {
  // turn n1 into a shop so a fresh run reaches it immediately
  const base = testContent()
  const w = base.worlds['world-01']!
  const shopContent: ContentBundle = {
    ...base,
    worlds: {
      ...base.worlds,
      'world-01': {
        ...w,
        map: { ...w.map, nodes: { ...w.map.nodes, n1: { ...w.map.nodes.n1!, type: 'shop', fixedEvent: { kind: 'shop' } } } },
      },
    },
  }

  function toShop(): GameState {
    let s = newGame()
    s = apply(s, { type: 'createHero', id: 'h1', name: 'Gideon' })
    s = apply(s, { type: 'startRun', characterId: 'h1', worldId: 'world-01', seed: 'shop', content: shopContent })
    s = apply(s, { type: 'world/chooseEntry', nodeId: 'n0' })
    s = apply(s, { type: 'world/move', target: 'n1' })
    s = apply(s, { type: 'world/enter' })
    return s
  }

  it('generates stock on entry; buying needs gold; sold persists across re-entry', () => {
    let s = toShop()
    expect(s.screen).toBe('shop')
    const shop = s.run!.world.shopStates.n1!
    expect(shop).toBeDefined()
    expect(shop.cards.length).toBeGreaterThan(0)
    const offer = shop.cards[0]!

    // broke → rejected (spend the starter purse down to 0 first)
    s = { ...s, run: { ...s.run!, inventory: { ...s.run!.inventory, currency: 0 } } }
    expect(reduce(s, { type: 'world/shopBuyCard', nodeId: 'n1', defId: offer.defId }).events).toContainEqual({ type: 'rejected', reason: 'shop:too-poor' })

    // grant gold and buy
    s = { ...s, run: { ...s.run!, inventory: { ...s.run!.inventory, currency: 200 } } }
    const beforeBuy = deckOf(s).length
    s = apply(s, { type: 'world/shopBuyCard', nodeId: 'n1', defId: offer.defId })
    expect(deckOf(s)).toContain(offer.defId)
    expect(deckOf(s).length).toBe(beforeBuy + 1)
    expect(s.run!.inventory.currency).toBe(200 - offer.price)
    expect(s.run!.world.shopStates.n1!.cards[0]!.sold).toBe(true)

    // remove a card for gold
    const beforeRemove = deckOf(s).length
    const goldBeforeRemove = s.run!.inventory.currency
    const removePrice = s.run!.world.shopStates.n1!.removePrice
    s = apply(s, { type: 'world/shopRemoveCard', nodeId: 'n1', cardIndex: 0 })
    expect(deckOf(s).length).toBe(beforeRemove - 1)
    expect(s.run!.inventory.currency).toBe(goldBeforeRemove - removePrice)

    // leave and re-enter — stock persists, sold stays sold
    s = apply(s, { type: 'world/leaveShop' })
    expect(s.screen).toBe('map')
    s = apply(s, { type: 'world/enter' })
    expect(s.screen).toBe('shop')
    expect(s.run!.world.shopStates.n1!.cards[0]!.sold).toBe(true)
  })
})
