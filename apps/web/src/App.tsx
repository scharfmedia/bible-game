import { useGame } from './store/gameStore'
import { StartScreen } from './screens/StartScreen'
import { HeroCreation } from './screens/HeroCreation'
import { WorldSelect } from './screens/WorldSelect'
import { MapScreen } from './screens/MapScreen'
import { CombatScreen } from './screens/CombatScreen'
import { SceneScreen } from './screens/SceneScreen'
import { EventScreen } from './screens/EventScreen'
import { RewardScreen } from './screens/RewardScreen'
import { FireplaceScreen } from './screens/FireplaceScreen'
import { GameOverScreen } from './screens/GameOverScreen'
import { VerseModal } from './components/VerseModal'

export function App() {
  const screen = useGame((s) => s.state.screen)
  const prompt = useGame((s) => s.state.prompt)

  return (
    <div className="app">
      {screen === 'start' && <StartScreen />}
      {screen === 'heroCreation' && <HeroCreation />}
      {screen === 'worldSelect' && <WorldSelect />}
      {screen === 'map' && <MapScreen />}
      {screen === 'combat' && <CombatScreen />}
      {screen === 'scene' && <SceneScreen />}
      {screen === 'event' && <EventScreen />}
      {screen === 'reward' && <RewardScreen />}
      {screen === 'fireplace' && <FireplaceScreen />}
      {screen === 'gameOver' && <GameOverScreen />}

      {prompt?.kind === 'verseChallenge' && <VerseModal challengeId={prompt.challengeId} />}
    </div>
  )
}
