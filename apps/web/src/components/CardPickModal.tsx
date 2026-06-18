import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useGame } from '../store/gameStore'
import { selectCardPickCandidates } from '../selectors'
import { CardFace } from './CardFace'

// Title per pick kind. The card is only committed (played) once the player confirms a selection;
// cancelling leaves it in hand untouched.
const TITLE: Record<string, string> = {
  hone: 'ui.cardPick.hone',
  exhaustChosen: 'ui.cardPick.exhaust',
  topDeck: 'ui.cardPick.topDeck',
}

export interface PickSpec {
  kind: 'hone' | 'exhaustChosen' | 'topDeck'
  count: number
}

export function CardPickModal({ playedIid, pick, onClose }: { playedIid: string; pick: PickSpec; onClose: () => void }) {
  const { t } = useTranslation()
  const state = useGame((s) => s.state)
  const dispatch = useGame((s) => s.dispatch)
  const candidates = useMemo(() => selectCardPickCandidates(state, playedIid, pick.kind), [state, playedIid, pick.kind])
  const [sel, setSel] = useState<string[]>([])

  const toggle = (iid: string) =>
    setSel((s) => (s.includes(iid) ? s.filter((x) => x !== iid) : s.length < pick.count ? [...s, iid] : s))

  const confirm = () => {
    dispatch({ type: 'combat/playCard', iid: playedIid, cardTargetIids: sel })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="panel world-panel deck-modal"
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="deck-modal-head">
          <h3>{t(TITLE[pick.kind] ?? '')} <span className="muted">· {sel.length}/{pick.count}</span></h3>
          <button className="hud-icon-btn" onClick={onClose} aria-label={t('ui.common.cancel')}>✕</button>
        </div>
        {candidates.length === 0 ? (
          <p className="muted deck-modal-empty">{t('ui.cardPick.none')}</p>
        ) : (
          <div className="card-row">
            {candidates.map((c) => (
              <CardFace
                key={c.iid}
                cost={c.cost}
                layer={c.layer}
                nameKey={c.nameKey}
                textKey={c.textKey}
                values={c.values}
                verse={c.verse}
                rarity={c.rarity}
                selected={sel.includes(c.iid)}
                onClick={() => toggle(c.iid)}
              />
            ))}
          </div>
        )}
        <div className="row gap">
          <button className="btn block" onClick={onClose}>{t('ui.common.cancel')}</button>
          <button className="btn primary block" onClick={confirm} disabled={sel.length === 0}>{t('ui.cardPick.confirm')}</button>
        </div>
      </motion.div>
    </div>
  )
}
