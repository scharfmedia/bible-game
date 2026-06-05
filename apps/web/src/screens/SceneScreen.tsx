import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { assetBg } from '@bible/assets'
import { M1_VERBS, type Verb } from '@bible/engine'
import { useGame } from '../store/gameStore'
import { selectScene } from '../selectors'

// Discovery-first point-and-click: hotspots are invisible. Resting the cursor still over a zone
// for ~1s makes a soft highlight BLOOM (you sense something is there, but not what). Clicking it
// reveals the hint (the verb's line). No hover outlines, no spoiler labels — the cursor is an eye.

export function SceneScreen() {
  const { t } = useTranslation()
  const state = useGame((s) => s.state)
  const view = useMemo(() => selectScene(state), [state])
  const dispatch = useGame((s) => s.dispatch)
  const lastEvents = useGame((s) => s.lastEvents)
  const [verb, setVerb] = useState<Verb>('observe')
  const [bloom, setBloom] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const line = lastEvents.flatMap((e) => (e.type === 'sceneLine' ? [e.lineKey] : [])).at(-1)
  if (!view) return null

  // (re)start the dwell timer on any movement; it fires once the cursor has been still for a beat
  const dwell = (id: string) => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setBloom(id), 900)
  }
  const endDwell = (id: string) => {
    window.clearTimeout(timer.current)
    setBloom((b) => (b === id ? null : b))
  }

  return (
    <div className="screen scene eye-cursor" style={{ backgroundImage: assetBg(view.bgAsset) }}>
      <div className="scrim soft" />
      <div className="scene-hotspots">
        {view.hotspots.map((h) =>
          h.rect ? (
            <button
              key={h.id}
              className="hotspot"
              style={{ left: `${h.rect.x * 100}%`, top: `${h.rect.y * 100}%`, width: `${h.rect.w * 100}%`, height: `${h.rect.h * 100}%` }}
              onMouseEnter={() => dwell(h.id)}
              onMouseMove={() => dwell(h.id)}
              onMouseLeave={() => endDwell(h.id)}
              onClick={() => {
                setBloom(null)
                dispatch({ type: 'world/sceneInteract', sceneId: view.sceneId, hotspotId: h.id, verb })
              }}
            >
              {bloom === h.id && (
                <motion.span
                  className="bloom"
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.55, ease: 'easeOut' }}
                />
              )}
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
