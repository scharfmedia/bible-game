import { useMemo } from 'react'
import { useGame } from '../store/gameStore'
import { selectRunDeck } from '../selectors'
import { CardListModal } from './CardListModal'

/** The top-bar Deck viewer: the hero's static run deck. Mounted at the App root so the HUD button
 *  opens it from both the map and combat. */
export function DeckModal() {
  const state = useGame((s) => s.state)
  const setDeckOpen = useGame((s) => s.setDeckOpen)
  const cards = useMemo(() => selectRunDeck(state), [state])
  return <CardListModal titleKey="ui.deck.title" cards={cards} onClose={() => setDeckOpen(false)} />
}
