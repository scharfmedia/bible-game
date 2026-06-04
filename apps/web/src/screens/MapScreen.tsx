import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useGame } from '../store/gameStore'
import { selectMap, type MapNodeView } from '../selectors'
import { Hud } from '../components/Hud'

const NODE_ICON: Record<string, string> = {
  entrance: '🌲',
  combat: '⚔️',
  elite: '☠️',
  boss: '👁️',
  shop: '🪙',
  fireplace: '🔥',
  event: '❓',
  scene: '🏚️',
  secret: '✨',
}

const pct = (v: number, span: number) => (span <= 0 ? 50 : (v / span) * 100)

export function MapScreen() {
  const { t } = useTranslation()
  const state = useGame((s) => s.state)
  const view = useMemo(() => selectMap(state), [state])
  const dispatch = useGame((s) => s.dispatch)
  if (!view) return null

  const sx = view.bounds.w - 1
  const sy = view.bounds.h - 1

  const place = (p: { x: number; y: number }) => ({ left: `${10 + pct(p.x, sx) * 0.8}%`, top: `${18 + pct(p.y, sy) * 0.62}%` })

  const onClick = (n: MapNodeView) => {
    if (n.movable) dispatch({ type: 'world/move', target: n.id })
  }

  return (
    <div className="screen map" style={{ backgroundImage: 'url(/assets/004-battlefield-open-crossroads.png)' }}>
      <div className="scrim" />
      <Hud />
      <div className="map-area">
        <svg className="map-edges" viewBox="0 0 100 100" preserveAspectRatio="none">
          {view.edges.map((e) => (
            <line
              key={e.id}
              x1={10 + pct(e.a.x, sx) * 0.8}
              y1={18 + pct(e.a.y, sy) * 0.62}
              x2={10 + pct(e.b.x, sx) * 0.8}
              y2={18 + pct(e.b.y, sy) * 0.62}
              className={e.gated ? 'edge gated' : 'edge'}
            />
          ))}
        </svg>
        {view.nodes.map((n) => (
          <motion.button
            key={n.id}
            className={[
              'map-node',
              n.current ? 'current' : '',
              n.cleared ? 'cleared' : '',
              n.movable ? `movable ${n.direction}` : 'locked',
            ].join(' ')}
            style={place(n.pos)}
            onClick={() => onClick(n)}
            disabled={!n.movable}
            whileHover={n.movable ? { scale: 1.08 } : undefined}
            animate={n.current ? { scale: [1, 1.06, 1] } : { scale: 1 }}
            transition={n.current ? { repeat: Infinity, duration: 2 } : { duration: 0.2 }}
          >
            <span className="node-icon">{NODE_ICON[n.type] ?? '•'}</span>
            <span className="node-label">{t(n.nameKey)}</span>
          </motion.button>
        ))}
      </div>
      <footer className="map-footer">
        <span className="muted small">▲ {t('ui.map.legend.forward')} · ▼ {t('ui.map.legend.back')}</span>
        <button className="btn danger small" onClick={() => dispatch({ type: 'abandonRun' })}>
          {t('ui.map.abandon')}
        </button>
      </footer>
    </div>
  )
}
