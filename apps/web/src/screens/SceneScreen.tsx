import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { assetBg } from '@bible/assets'
import { M1_VERBS, type Verb } from '@bible/engine'
import { useGame } from '../store/gameStore'
import { selectScene } from '../selectors'

export function SceneScreen() {
  const { t } = useTranslation()
  const state = useGame((s) => s.state)
  const view = useMemo(() => selectScene(state), [state])
  const dispatch = useGame((s) => s.dispatch)
  const lastEvents = useGame((s) => s.lastEvents)
  const [verb, setVerb] = useState<Verb>('observe')

  const line = lastEvents.flatMap((e) => (e.type === 'sceneLine' ? [e.lineKey] : [])).at(-1)
  if (!view) return null

  return (
    <div className="screen scene" style={{ backgroundImage: assetBg(view.bgAsset) }}>
      <div className="scrim soft" />
      <div className="scene-hotspots">
        {view.hotspots.map((h) =>
          h.rect ? (
            <button
              key={h.id}
              className="hotspot"
              style={{ left: `${h.rect.x * 100}%`, top: `${h.rect.y * 100}%`, width: `${h.rect.w * 100}%`, height: `${h.rect.h * 100}%` }}
              onClick={() => dispatch({ type: 'world/sceneInteract', sceneId: view.sceneId, hotspotId: h.id, verb })}
            >
              <span className="hotspot-label">{t(h.nameKey)}</span>
            </button>
          ) : null,
        )}
      </div>

      <div className="scene-dialog">{line ? t(line) : ''}</div>

      <div className="verb-bar">
        {M1_VERBS.map((v) => (
          <button key={v} className={'btn small' + (verb === v ? ' active' : '')} onClick={() => setVerb(v)}>
            {t(`verb.${v}`)}
          </button>
        ))}
        <span className="spacer" />
        <button className="btn primary" onClick={() => dispatch({ type: 'world/leaveScene' })}>
          {t('ui.scene.leave')}
        </button>
      </div>
    </div>
  )
}
