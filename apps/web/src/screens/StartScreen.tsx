import { useTranslation } from 'react-i18next'
import { useGame } from '../store/gameStore'

export function StartScreen() {
  const { t } = useTranslation()
  const slots = useGame((s) => s.state.profile.slots)
  const locale = useGame((s) => s.state.profile.settings.locale)
  const dispatch = useGame((s) => s.dispatch)
  const resume = useGame((s) => s.resume)
  const setLocale = useGame((s) => s.setLocale)

  return (
    <div className="screen start">
      <div className="vignette" />
      <h1 className="title">{t('ui.appTitle')}</h1>
      <p className="subtitle">{t('ui.appSubtitle')}</p>

      <div className="panel">
        <button className="btn primary block" onClick={() => dispatch({ type: 'navigate', screen: 'heroCreation' })}>
          {t('ui.start.new')}
        </button>

        {slots.length === 0 ? (
          <p className="muted">{t('ui.start.empty')}</p>
        ) : (
          <ul className="char-list">
            {slots.map((s) => (
              <li key={s.id} className="char-row">
                <span className="char-name">
                  {s.character.name}
                  <span className="muted"> · {t('ui.common.level')} {s.character.level}</span>
                </span>
                <span className="row-actions">
                  <button className="btn" onClick={() => void resume(s.id)}>{t('ui.start.continue')}</button>
                  <button className="btn danger" onClick={() => dispatch({ type: 'deleteHero', id: s.id })}>
                    {t('ui.common.delete')}
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="lang-toggle">
        <span className="muted">{t('ui.settings.language')}:</span>
        <button className={'btn small' + (locale === 'en' ? ' active' : '')} onClick={() => setLocale('en')}>EN</button>
        <button className={'btn small' + (locale === 'de' ? ' active' : '')} onClick={() => setLocale('de')}>DE</button>
      </div>
    </div>
  )
}
