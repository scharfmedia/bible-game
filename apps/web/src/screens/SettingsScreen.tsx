import { useTranslation } from 'react-i18next'
import type { AudioMode } from '@bible/engine'
import { useGame } from '../store/gameStore'

const MODE_LABEL: Record<AudioMode, string> = {
  on: 'ui.audio.mode.on',
  sfxOnly: 'ui.audio.mode.sfxOnly',
  off: 'ui.audio.mode.off',
}

export function SettingsScreen() {
  const { t } = useTranslation()
  const dispatch = useGame((s) => s.dispatch)
  const locale = useGame((s) => s.state.profile.settings.locale)
  const musicVolume = useGame((s) => s.state.profile.settings.musicVolume)
  const audioMode = useGame((s) => s.state.profile.settings.audioMode)
  const dynamicMusic = useGame((s) => s.state.profile.settings.dynamicMusic)
  const reducedMotion = useGame((s) => s.state.profile.settings.reducedMotion)
  const setLocale = useGame((s) => s.setLocale)
  const setMusicVolume = useGame((s) => s.setMusicVolume)
  const cycleAudioMode = useGame((s) => s.cycleAudioMode)

  return (
    <div className="screen centered">
      <div className="panel settings-panel">
        <h2>{t('ui.settings.title')}</h2>

        <div className="settings-row">
          <span className="settings-label">{t('ui.settings.language')}</span>
          <div className="row gap-sm">
            <button className={'btn small' + (locale === 'en' ? ' active' : '')} onClick={() => setLocale('en')}>EN</button>
            <button className={'btn small' + (locale === 'de' ? ' active' : '')} onClick={() => setLocale('de')}>DE</button>
          </div>
        </div>

        <div className="settings-row">
          <span className="settings-label">{t('ui.settings.musicVolume')}</span>
          <div className="row gap-sm volume-control">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={musicVolume}
              onChange={(e) => setMusicVolume(Number(e.target.value))}
              aria-label={t('ui.settings.musicVolume')}
            />
            <span className="muted volume-pct">{Math.round(musicVolume * 100)}%</span>
          </div>
        </div>

        <div className="settings-row">
          <span className="settings-label">{t('ui.settings.audio')}</span>
          <button className="btn small" onClick={() => cycleAudioMode()}>
            {t(MODE_LABEL[audioMode])}
          </button>
        </div>

        <div className="settings-row">
          <span className="settings-label">{t('ui.settings.dynamicMusic')}</span>
          <button
            className={'btn small' + (dynamicMusic ? ' active' : '')}
            onClick={() => dispatch({ type: 'updateSettings', settings: { dynamicMusic: !dynamicMusic } })}
          >
            {dynamicMusic ? t('ui.common.yes') : t('ui.common.no')}
          </button>
        </div>

        <div className="settings-row">
          <span className="settings-label">{t('ui.settings.reducedMotion')}</span>
          <button
            className={'btn small' + (reducedMotion ? ' active' : '')}
            onClick={() => dispatch({ type: 'updateSettings', settings: { reducedMotion: !reducedMotion } })}
          >
            {reducedMotion ? t('ui.common.yes') : t('ui.common.no')}
          </button>
        </div>

        <div className="row gap">
          <button className="btn primary" onClick={() => dispatch({ type: 'navigate', screen: 'start' })}>
            {t('ui.common.back')}
          </button>
        </div>
      </div>
    </div>
  )
}
