import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { potencyTier } from '@bible/engine'
import { useGame } from '../store/gameStore'
import { heroSummary } from '../selectors'

// The hidden Spirit is surfaced ONLY diegetically: a small orb whose hue/glow follows the potency
// tier. No number is ever shown — the gradient is felt, not read.
const TIER_COLOR: Record<string, string> = {
  dim: '#5b5b66',
  faint: '#6f7d8c',
  steady: '#8aa0b8',
  bright: '#c9b063',
  radiant: '#f4e7a1',
}

export function Hud() {
  const { t } = useTranslation()
  const state = useGame((s) => s.state)
  const summary = useMemo(() => heroSummary(state), [state])
  const spirit = state.run?.spirit.spirit ?? 0
  if (!summary) return null
  const tier = potencyTier(spirit)
  const hpPct = Math.max(0, Math.min(100, (summary.hp / summary.maxHp) * 100))

  return (
    <header className="hud">
      <div className="hud-left">
        <div
          className="spirit-orb"
          title="spirit"
          style={{ background: `radial-gradient(circle at 35% 30%, ${TIER_COLOR[tier]}, #1a1a22)`, boxShadow: `0 0 ${tier === 'radiant' ? 22 : tier === 'bright' ? 14 : 6}px ${TIER_COLOR[tier]}` }}
        />
        <div className="hud-hero">
          <div className="hud-name">
            {summary.name} <span className="muted">· {t('ui.common.level')} {summary.level}</span>
          </div>
          <div className="hp-bar">
            <div className="hp-fill" style={{ width: `${hpPct}%` }} />
            <span className="hp-text">{summary.hp} / {summary.maxHp}</span>
          </div>
        </div>
      </div>
      <div className="hud-right">
        <span className="coin">🪙 {summary.gold}</span>
      </div>
    </header>
  )
}
