import type { Command } from '../commands/command'
import type { GameEvent, ReduceResult } from '../events/event'
import { applySpiritEvent } from '../spirit/spirit'
import type { GameState } from '../state/gameState'
import { checkVerseAnswers } from './verseGapFill'

const reject = (state: GameState, reason: string): ReduceResult => ({ state, events: [{ type: 'rejected', reason }] })

/**
 * Verse gap-fill sub-reducer. Validates the player's words against the real verse (current
 * locale); on success the verse card materializes into the permanent collection + the run deck
 * and Spirit rises (earnVerse). Teaching-first: wrong answers just don't grant — no punishment.
 */
export function reduceVerse(state: GameState, cmd: Command): ReduceResult {
  if (cmd.type !== 'verse/submit') return reject(state, 'unknown-verse-command')
  const run = state.run
  if (!run) return reject(state, 'no-run')
  if (state.prompt?.kind !== 'verseChallenge' || state.prompt.challengeId !== cmd.challengeId) {
    return reject(state, 'no-active-verse-challenge')
  }

  const challenge = run.content.verses[cmd.challengeId]
  if (!challenge) return reject(state, 'no-such-challenge')

  const locale = state.profile.settings.locale
  const data = challenge.byLocale[locale]
  const result = checkVerseAnswers(data, locale, cmd.answers)
  if (!result.correct) {
    return { state, events: [{ type: 'verseRejected', challengeId: cmd.challengeId }] }
  }

  // success: grant the card permanently + into the run deck, raise Spirit, clear the prompt
  const cardId = challenge.cardDefId
  const characterId = run.party.find((m) => m.memberId === run.heroMemberId)?.characterId
  const idx = state.profile.slots.findIndex((s) => s.id === characterId)
  const slot = state.profile.slots[idx]

  let profile = state.profile
  if (slot && !slot.character.ownedVerseCardIds.includes(cardId)) {
    const character = { ...slot.character, ownedVerseCardIds: [...slot.character.ownedVerseCardIds, cardId] }
    profile = { ...profile, slots: profile.slots.map((s, i) => (i === idx ? { ...s, character } : s)) }
  }

  const heroDeck = run.deckByMember[run.heroMemberId] ?? []
  const deckByMember = heroDeck.includes(cardId)
    ? run.deckByMember
    : { ...run.deckByMember, [run.heroMemberId]: [...heroDeck, cardId] }

  const out = applySpiritEvent(run.spirit, { kind: 'earnVerse' })
  const newRun = { ...run, deckByMember, spirit: out.state }

  const events: GameEvent[] = [
    { type: 'verseEarned', cardDefId: cardId },
    { type: 'spiritShifted', delta: out.delta, reason: out.reason },
  ]
  return { state: { ...state, profile, run: newRun, prompt: null }, events }
}
