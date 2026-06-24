import { useTranslation } from 'react-i18next'
import { useGame } from '../store/gameStore'
import { useSw } from '../pwa/SwProvider'

/**
 * Non-intrusive top-center banner shown when a new build is waiting. Tapping "Reload" activates
 * the new service worker and reloads. Reload is disabled during combat — autosave doesn't run
 * mid-battle, so reloading there would discard the in-progress run; the banner persists until
 * combat ends.
 */
export function UpdateBanner() {
  const { t } = useTranslation()
  const { needRefresh, reload } = useSw()
  const inCombat = useGame((s) => s.state.screen === 'combat')
  if (!needRefresh) return null
  return (
    <div className="update-banner" role="status">
      <span>{t('ui.update.available')}</span>
      <button className="btn small primary" onClick={reload} disabled={inCombat}>
        {inCombat ? t('ui.update.finishBattle') : t('ui.update.reload')}
      </button>
    </div>
  )
}
