import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { assetBg } from '@bible/assets'
import { useGame } from '../store/gameStore'
import { selectReward } from '../selectors'

export function RewardScreen() {
  const { t } = useTranslation()
  const state = useGame((s) => s.state)
  const view = useMemo(() => selectReward(state), [state])
  const dispatch = useGame((s) => s.dispatch)
  if (!view) return null

  return (
    <div className="screen reward centered" style={{ backgroundImage: assetBg(view.rewardBg) }}>
      <div className="vignette" />
      <div className="panel narrow">
        <h2>{t('ui.reward.title')}</h2>
        {view.righteous && <p className="righteous">{t('ui.reward.righteous')}</p>}
        <p className="muted">{t('ui.reward.subtitle')}</p>
        <div className="choices">
          {view.options.map((o) => (
            <button key={o.id} className="btn block reward-option" onClick={() => dispatch({ type: 'combat/chooseReward', optionId: o.id })}>
              {o.kind === 'money' ? t('ui.reward.money', { amount: o.label }) : t(o.label)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
