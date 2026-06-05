import { useEffect, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { assetBg } from '@bible/assets'
import { useGame } from '../store/gameStore'
import { selectMap } from '../selectors'
import { Hud } from '../components/Hud'

const NODE_ICON: Record<string, string> = {
  entrance: '🚪',
  combat: '⚔️',
  elite: '☠️',
  boss: '👁️',
  shop: '🪙',
  fireplace: '🏕️',
  rest: '🏕️',
  event: '❗',
  scene: '🏚️',
  explore: '🏚️',
  waypoint: '🚶',
  secret: '✨',
}

const CELL_X = 210
const CELL_Y = 165
const PAD = 120

export function MapScreen() {
  const { t } = useTranslation()
  const state = useGame((s) => s.state)
  const view = useMemo(() => selectMap(state), [state])
  const dispatch = useGame((s) => s.dispatch)
  const currentRef = useRef<HTMLButtonElement | null>(null)

  // center the current node when the map opens / the hero moves
  const currentId = view?.nodes.find((n) => n.current)?.id
  useEffect(() => {
    currentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
  }, [currentId])

  if (!view) return null
  const W = view.bounds.w * CELL_X + PAD * 2
  const H = view.bounds.h * CELL_Y + PAD * 2
  const px = (p: { x: number; y: number }) => ({ left: PAD + p.x * CELL_X, top: PAD + p.y * CELL_Y })

  return (
    <div className="screen map">
      <Hud />
      <div className="map-scroll">
        <div className="map-canvas" style={{ width: W, height: H }}>
          <svg className="map-edges" width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            {view.edges.map((e) => {
              const a = px(e.a)
              const b = px(e.b)
              return <line key={e.id} x1={a.left} y1={a.top} x2={b.left} y2={b.top} className={e.gated ? 'edge gated' : 'edge'} />
            })}
          </svg>

          {view.nodes.map((n) => {
            const pos = px(n.pos)
            return (
              <motion.button
                key={n.id}
                ref={n.current ? currentRef : undefined}
                className={['map-node', n.current ? 'current' : '', n.cleared ? 'cleared' : '', n.movable ? `movable ${n.visit}` : 'locked'].join(' ')}
                style={{ left: pos.left, top: pos.top, backgroundImage: assetBg(n.bgAsset) }}
                onClick={() => n.movable && dispatch({ type: 'world/move', target: n.id })}
                disabled={!n.movable}
                whileHover={n.movable ? { scale: 1.07 } : undefined}
                animate={n.current ? { boxShadow: ['0 0 0px #f4e7a1', '0 0 26px #f4e7a1', '0 0 0px #f4e7a1'] } : {}}
                transition={n.current ? { repeat: Infinity, duration: 2.2 } : { duration: 0.2 }}
              >
                <span className="node-scrim" />
                <span className="node-icon">{NODE_ICON[n.type] ?? '•'}</span>
                <span className="node-label">{t(n.nameKey)}</span>
              </motion.button>
            )
          })}
        </div>
      </div>

      <footer className="map-footer">
        <span className="muted small">⊙ {t('ui.map.legend.forward')} · ↺ {t('ui.map.legend.back')}</span>
        <button className="btn danger small" onClick={() => dispatch({ type: 'abandonRun' })}>
          {t('ui.map.abandon')}
        </button>
      </footer>
    </div>
  )
}
