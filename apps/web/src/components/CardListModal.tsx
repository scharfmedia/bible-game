import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { CardFace } from './CardFace'
import type { CardRarity } from '../selectors'

/**
 * A read-only modal listing a set of cards (a combat pile, or the run deck). Reuses the menu
 * `CardFace` + the shared `.modal-overlay` / `.panel` / `.card-row` chrome. Honed copies get a small
 * gold mark; clutter (unplayable) copies are dimmed. Clicking the backdrop or ✕ closes it.
 */
export interface ModalCard {
  iid?: string
  nameKey: string
  textKey: string
  cost: number
  layer: 'flesh' | 'spirit' | 'both'
  verse?: boolean
  rarity?: CardRarity
  values?: Record<string, number>
  honed?: boolean
  unplayable?: boolean
}

export function CardListModal({ titleKey, cards, onClose }: { titleKey: string; cards: ModalCard[]; onClose: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="panel world-panel deck-modal"
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="deck-modal-head">
          <h3>{t(titleKey)} <span className="muted">· {cards.length}</span></h3>
          <button className="hud-icon-btn" onClick={onClose} aria-label={t('ui.common.close')}>✕</button>
        </div>
        {cards.length === 0 ? (
          <p className="muted deck-modal-empty">{t('ui.deck.empty')}</p>
        ) : (
          <div className="card-row">
            {cards.map((c, i) => (
              <div
                key={c.iid ?? `${c.nameKey}-${i}`}
                className={['modal-card', c.honed ? 'honed' : '', c.unplayable ? 'unplayable' : ''].join(' ')}
              >
                <CardFace cost={c.cost} layer={c.layer} nameKey={c.nameKey} textKey={c.textKey} values={c.values} verse={c.verse} rarity={c.rarity} />
                {c.honed && <span className="modal-card-badge" title={t('ui.deck.honed')}>✦</span>}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
