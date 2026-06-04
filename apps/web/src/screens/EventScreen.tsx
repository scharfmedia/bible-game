import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { assetBg } from '@bible/assets'
import { useGame } from '../store/gameStore'
import { selectEvent } from '../selectors'

export function EventScreen() {
  const { t } = useTranslation()
  const state = useGame((s) => s.state)
  const view = useMemo(() => selectEvent(state), [state])
  const dispatch = useGame((s) => s.dispatch)
  if (!view) return null

  return (
    <div className="screen event centered" style={{ backgroundImage: assetBg(view.bgAsset) }}>
      <div className="scrim" />
      <div className="panel narrow event-panel">
        <h2>{t(view.titleKey)}</h2>
        <p className="event-body">{t(view.bodyKey)}</p>
        <div className="choices">
          {view.choices.map((c) => (
            <button
              key={c.id}
              className="btn block"
              disabled={!c.enabled}
              onClick={() => dispatch({ type: 'world/eventChoice', eventId: view.eventId, choiceId: c.id })}
            >
              {t(c.labelKey)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
