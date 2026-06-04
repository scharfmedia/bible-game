import { useTranslation } from 'react-i18next'
import { useGame } from '../store/gameStore'

export function GameOverScreen() {
  const { t } = useTranslation()
  const dispatch = useGame((s) => s.dispatch)

  return (
    <div className="screen gameover centered">
      <div className="vignette dark" />
      <div className="panel narrow">
        <h2>{t('ui.gameOver.title')}</h2>
        <p className="muted">{t('ui.gameOver.flavor')}</p>
        <button className="btn primary block" onClick={() => dispatch({ type: 'abandonRun' })}>
          {t('ui.gameOver.restart')}
        </button>
      </div>
    </div>
  )
}
