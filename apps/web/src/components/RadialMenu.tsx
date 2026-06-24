import { motion } from 'framer-motion'
import { DESIGN_W, DESIGN_H } from '../lib/appHeight'
import { viewportToStage } from '../lib/stageCoords'

// A generic radial "coin" menu: actions fan out around an anchor point with a staggered spring.
// Shared by the scene VerbFan (point-and-click verbs) and the inventory item-action fan.
// Anchors arrive in viewport coordinates; the wheel renders inside the scaled .stage, so map them
// into design space and clamp to the design canvas.

export interface RadialAction {
  id: string
  label: string
  icon: string
  disabled?: boolean
}

export function RadialMenu({
  x,
  y,
  actions,
  onPick,
  onClose,
}: {
  x: number
  y: number
  actions: RadialAction[]
  onPick: (id: string) => void
  onClose?: () => void
}) {
  const r = 82
  // Clamp the wheel's centre so all coins stay on-screen even when the target sits in a corner/edge
  // (e.g. the top-left HUD hero block, or a bag slot against the right edge).
  const margin = r + 32
  const p = viewportToStage(x, y)
  const cx = Math.min(Math.max(p.x, margin), DESIGN_W - margin)
  const cy = Math.min(Math.max(p.y, margin), DESIGN_H - margin)
  return (
    <div className="verb-fan" style={{ left: cx, top: cy }} onClick={(e) => { e.stopPropagation(); onClose?.() }}>
      {actions.map((a, i) => {
        const angle = (i / actions.length) * Math.PI * 2 - Math.PI / 2
        return (
          <motion.button
            key={a.id}
            className={`verb-coin${a.disabled ? ' disabled' : ''}`}
            title={a.label}
            style={{ left: Math.cos(angle) * r, top: Math.sin(angle) * r }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.025, type: 'spring', stiffness: 420, damping: 24 }}
            onClick={(e) => {
              e.stopPropagation()
              if (!a.disabled) onPick(a.id)
            }}
          >
            <span className="verb-icon">{a.icon}</span>
            <span className="verb-text">{a.label}</span>
          </motion.button>
        )
      })}
    </div>
  )
}
