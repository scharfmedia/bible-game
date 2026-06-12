import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { assetBg } from '@bible/assets'
import { useGame } from '../store/gameStore'
import { selectReward } from '../selectors'
import { CardFace } from '../components/CardFace'

export function RewardScreen() {
  const { t } = useTranslation()
  const state = useGame((s) => s.state)
  const view = useMemo(() => selectReward(state), [state])
  const dispatch = useGame((s) => s.dispatch)
  const [stage, setStage] = useState<'spoils' | 'cards'>('spoils')
  if (!view) return null

  // Two stages: claim gold/items first, then pick a card. With no spoils, jump straight to the cards.
  const showSpoils = stage === 'spoils' && view.spoils.length > 0
  const canPickCard = !view.deckFull && view.cardOptions.length > 0

  // Taking a card (or declining) resolves the reward and returns to the map in one motion.
  const takeCard = (defId: string) => {
    dispatch({ type: 'combat/takeCard', defId })
    dispatch({ type: 'combat/leaveReward' })
  }
  const leave = () => dispatch({ type: 'combat/leaveReward' })

  return (
    <div className="screen reward centered" style={{ backgroundImage: assetBg(view.rewardBg) }}>
      <div className="vignette" />
      <div className="panel narrow">
        {showSpoils ? (
          <>
            <h2>{t('ui.reward.title')}</h2>
            {view.righteous && <p className="righteous">{t('ui.reward.righteous')}</p>}
            <p className="muted">{t('ui.reward.spoilsSubtitle')}</p>
            <div className="choices">
              {view.spoils.map((s) => (
                <button
                  key={s.id}
                  className="btn block reward-option"
                  disabled={s.claimed}
                  onClick={() => dispatch({ type: 'combat/claimSpoil', spoilId: s.id })}
                >
                  {s.claimed ? '✓ ' : ''}
                  {s.kind === 'money' ? t('ui.reward.money', { amount: s.label }) : t(s.label)}
                </button>
              ))}
            </div>
            <button className="btn primary block" onClick={() => setStage('cards')}>
              {t('ui.reward.continue')}
            </button>
          </>
        ) : (
          <>
            <h2>{t('ui.reward.cardTitle')}</h2>
            {canPickCard ? (
              <>
                <div className="card-row">
                  {view.cardOptions.map((c) => (
                    <CardFace
                      key={c.defId}
                      cost={c.cost}
                      layer={c.layer}
                      nameKey={c.nameKey}
                      textKey={c.textKey}
                      verse={c.verse}
                      onClick={() => takeCard(c.defId)}
                    />
                  ))}
                </div>
                <button className="btn block" onClick={leave}>
                  {t('ui.reward.skipCard')}
                </button>
              </>
            ) : (
              <>
                <p className="muted">{view.deckFull ? t('ui.reward.deckFull') : t('ui.reward.noCards')}</p>
                <button className="btn primary block" onClick={leave}>
                  {t('ui.reward.leave')}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
