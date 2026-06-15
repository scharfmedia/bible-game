import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { assetBg } from '@bible/assets'
import { useGame } from '../store/gameStore'
import { selectShop } from '../selectors'
import { CardFace } from '../components/CardFace'

export function ShopScreen() {
  const { t } = useTranslation()
  const state = useGame((s) => s.state)
  const view = useMemo(() => selectShop(state), [state])
  const dispatch = useGame((s) => s.dispatch)
  const [removing, setRemoving] = useState(false)
  if (!view) return null

  const buyCard = (defId: string) => dispatch({ type: 'world/shopBuyCard', nodeId: view.nodeId, defId })
  const buyItem = (itemId: string) => dispatch({ type: 'world/shopBuyItem', nodeId: view.nodeId, itemId })
  const remove = (cardIndex: number) => {
    dispatch({ type: 'world/shopRemoveCard', nodeId: view.nodeId, cardIndex })
    setRemoving(false)
  }

  return (
    <div className="screen shop centered" style={{ backgroundImage: assetBg(view.bgAsset) }}>
      <div className="scrim" />
      <div className="panel shop-panel">
        <h2>{t(view.nameKey)}</h2>
        <p className="muted">
          {t('ui.shop.gold', { amount: view.gold })}
          {view.deckFull && <span className="warn"> · {t('ui.shop.deckFull')}</span>}
        </p>

        {removing ? (
          <>
            <h3 className="reward-card-title">{t('ui.shop.removeTitle', { price: view.removePrice })}</h3>
            <div className="card-row">
              {view.deck.map((c) => (
                <CardFace
                  key={c.index}
                  cost={c.cost}
                  layer={c.layer}
                  nameKey={c.nameKey}
                  textKey=""
                  verse={c.verse}
                  disabled={!view.canRemove}
                  onClick={view.canRemove ? () => remove(c.index) : undefined}
                />
              ))}
            </div>
            <button className="btn block" onClick={() => setRemoving(false)}>
              {t('ui.shop.back')}
            </button>
          </>
        ) : (
          <>
            {/* cards for sale */}
            <h3 className="reward-card-title">{t('ui.shop.cards')}</h3>
            {view.cards.length === 0 ? (
              <p className="muted">{t('ui.shop.empty')}</p>
            ) : (
              <div className="card-row">
                {view.cards.map((c) => (
                  <div key={c.defId} className="shop-buy">
                    <CardFace
                      cost={c.cost}
                      layer={c.layer}
                      nameKey={c.nameKey}
                      textKey={c.textKey}
                      values={c.values}
                      verse={c.verse}
                      disabled={c.sold || !c.affordable}
                      onClick={!c.sold && c.affordable ? () => buyCard(c.defId) : undefined}
                    />
                    <span className="shop-price">{c.sold ? t('ui.shop.sold') : t('ui.shop.price', { amount: c.price })}</span>
                  </div>
                ))}
              </div>
            )}

            {/* items for sale */}
            {view.items.length > 0 && (
              <>
                <h3 className="reward-card-title">{t('ui.shop.items')}</h3>
                <div className="choices">
                  {view.items.map((it) => (
                    <button
                      key={it.itemId}
                      className="btn block"
                      disabled={it.sold || !it.affordable}
                      onClick={() => buyItem(it.itemId)}
                    >
                      {t(it.nameKey)} — {it.sold ? t('ui.shop.sold') : t('ui.shop.price', { amount: it.price })}
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="choices">
              <button className="btn block" disabled={view.deck.length === 0} onClick={() => setRemoving(true)}>
                {t('ui.shop.remove', { price: view.removePrice })}
              </button>
              <button className="btn primary block" onClick={() => dispatch({ type: 'world/leaveShop' })}>
                {t('ui.shop.leave')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
