import { useEffect, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { assetBg } from '@bible/assets'
import { useGame } from '../store/gameStore'
import { selectMap } from '../selectors'
import { Hud } from '../components/Hud'

// Clean parchment-map glyphs (type at a glance): danger, rest, shop, event, home, waypoint.
const NODE_GLYPH: Record<string, string> = {
  entrance: '✦',
  combat: '!',
  elite: '!',
  boss: '‡',
  shop: '$',
  fireplace: '+',
  rest: '+',
  event: '?',
  scene: '⌂',
  explore: '⌂',
  waypoint: '•',
  secret: '✦',
}

const CELL_X = 200
const CELL_Y = 155
const PAD = 130

// stable per-edge curve direction so the mesh reads as organic arcs, never a straight grid
const hash = (s: string) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return h
}

// gold (open to you) draws last, on top of the trodden/untrodden web
const EDGE_Z: Record<string, number> = { untrodden: 0, trodden: 1, gated: 2, gold: 3 }

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
  const px = (p: { x: number; y: number }) => ({ x: PAD + p.x * CELL_X, y: PAD + p.y * CELL_Y })

  // a gentle quadratic arc between two node centres, bowed to one side by a hash-stable amount
  const arc = (ea: { x: number; y: number }, eb: { x: number; y: number }, id: string) => {
    const a = px(ea)
    const b = px(eb)
    const mx = (a.x + b.x) / 2
    const my = (a.y + b.y) / 2
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = Math.hypot(dx, dy) || 1
    const sign = hash(id) & 1 ? 1 : -1
    const k = 0.16 * len * sign
    const cx = mx + (-dy / len) * k
    const cy = my + (dx / len) * k
    return `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`
  }

  const edges = [...view.edges].sort((p, q) => (EDGE_Z[p.kind] ?? 0) - (EDGE_Z[q.kind] ?? 0))

  return (
    <div className="screen map">
      <Hud />
      <div className="map-scroll">
        <div className="map-canvas" style={{ width: W, height: H }}>
          <svg className="map-edges" width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
            {edges.map((e) => (
              <path key={e.id} d={arc(e.a, e.b, e.id)} className={`edge ${e.kind}`} />
            ))}
          </svg>

          {view.nodes.map((n) => {
            const p = px(n.pos)
            return (
              <motion.button
                key={n.id}
                ref={n.current ? currentRef : undefined}
                className={['map-node', `t-${n.type}`, n.current ? 'current' : '', n.cleared ? 'cleared' : '', n.movable ? 'movable' : 'locked'].join(' ')}
                style={{ left: p.x, top: p.y }}
                onClick={() => n.movable && dispatch({ type: 'world/move', target: n.id })}
                disabled={!n.movable}
                whileHover={n.movable ? { scale: 1.09 } : undefined}
                animate={n.current ? { boxShadow: ['0 0 0 0 rgba(244,231,161,0)', '0 0 22px 5px rgba(244,231,161,0.55)', '0 0 0 0 rgba(244,231,161,0)'] } : {}}
                transition={n.current ? { repeat: Infinity, duration: 2.4 } : { duration: 0.2 }}
              >
                <span className="node-disc" style={{ backgroundImage: assetBg(n.bgAsset) }} />
                <span className="node-glyph">{NODE_GLYPH[n.type] ?? '•'}</span>
                <span className="node-label">{t(n.nameKey)}</span>
              </motion.button>
            )
          })}
        </div>
      </div>

      <footer className="map-footer">
        <span className="muted small">{t('ui.map.legend')}</span>
        <button className="btn danger small" onClick={() => dispatch({ type: 'abandonRun' })}>
          {t('ui.map.abandon')}
        </button>
      </footer>
    </div>
  )
}
