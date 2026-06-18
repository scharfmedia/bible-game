import { useTranslation } from 'react-i18next'
import type { CardRarity } from '../selectors'

/**
 * A plain (motion-free) card face for menu contexts — reward picks, the fireplace upgrade picker,
 * and the shop. Reuses the combat card's CSS classes (.card / .card-cost / .card-art / .card-name /
 * .card-text) but without the fan/hover lift. `Card.tsx` stays the combat-specific fanned variant.
 */
export interface CardFaceProps {
  cost: number
  layer: 'flesh' | 'spirit' | 'both'
  nameKey: string
  textKey: string
  /** verse cards get the special frame */
  verse?: boolean
  /** drives the ornament-frame colour (starter/common/uncommon/rare); defaults to common */
  rarity?: CardRarity
  /** scaled values for interpolating the card text (dmg/block/heal/chance) */
  values?: Record<string, number>
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
}

export function CardFace({ cost, layer, nameKey, textKey, values, verse, rarity, selected, disabled, onClick }: CardFaceProps) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      className={['card', 'card-face', layer, 'rarity-' + (rarity ?? 'common'), selected ? 'selected' : '', verse ? 'verse' : ''].join(' ')}
      onClick={onClick}
      disabled={disabled || !onClick}
    >
      <div className="card-cost">{cost}</div>
      <div className="card-name">{t(nameKey)}</div>
      <div className={'card-art ' + layer} />
      <div className="card-text">{t(textKey, values)}</div>
    </button>
  )
}
