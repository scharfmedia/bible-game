import { useTranslation } from 'react-i18next'

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
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
}

export function CardFace({ cost, layer, nameKey, textKey, verse, selected, disabled, onClick }: CardFaceProps) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      className={['card', 'card-face', layer, selected ? 'selected' : '', verse ? 'verse' : ''].join(' ')}
      onClick={onClick}
      disabled={disabled || !onClick}
    >
      <div className="card-cost">{cost}</div>
      <div className={'card-art ' + layer} />
      <div className="card-name">{t(nameKey)}</div>
      <div className="card-text">{t(textKey)}</div>
    </button>
  )
}
