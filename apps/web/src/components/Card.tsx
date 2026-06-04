import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { HandCardView } from '../selectors'

export function CardView({
  card,
  playable,
  selected,
  onClick,
}: {
  card: HandCardView
  playable: boolean
  selected: boolean
  onClick: () => void
}) {
  const { t } = useTranslation()
  const verse = card.type === 'verse'
  return (
    <motion.button
      layout
      className={['card', card.layer, playable ? 'playable' : 'unplayable', selected ? 'selected' : '', verse ? 'verse' : ''].join(' ')}
      onClick={onClick}
      disabled={!playable}
      whileHover={playable ? { y: -18, scale: 1.05 } : undefined}
      whileTap={playable ? { scale: 0.98 } : undefined}
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
    >
      <div className="card-cost">{card.cost}</div>
      <div className={'card-art ' + card.layer} />
      <div className="card-name">{t(card.nameKey)}</div>
      <div className="card-text">{t(card.textKey)}</div>
    </motion.button>
  )
}
