import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { assetBg } from '@bible/assets'
import { useGame } from '../store/gameStore'
import { selectCombat, type CombatantView } from '../selectors'
import { CardView } from '../components/Card'
import { Hud } from '../components/Hud'

const INTENT_ICON: Record<string, string> = { attack: '⚔️', attackMulti: '⚔️', dread: '🌑', block: '🛡️', buff: '⬆️', debuff: '⬇️', special: '…', unknown: '❔' }

export function CombatScreen() {
  const { t } = useTranslation()
  const state = useGame((s) => s.state)
  const view = useMemo(() => selectCombat(state), [state])
  const dispatch = useGame((s) => s.dispatch)
  const lastEvents = useGame((s) => s.lastEvents)
  const tick = useGame((s) => s.tick)
  const [pending, setPending] = useState<{ kind: 'card'; iid: string } | { kind: 'grace'; ability: string } | null>(null)

  // transient damage flashes keyed by the dispatch tick
  const dmgByTarget = useMemo(() => {
    const m: Record<string, number> = {}
    for (const e of lastEvents) if (e.type === 'damageDealt' && e.amount > 0) m[e.targetId] = (m[e.targetId] ?? 0) + e.amount
    return m
  }, [lastEvents, tick])

  if (!view) return null
  const deciding = view.phase === 'partyDecision'

  const enemyTargetable = pending?.kind === 'card' || (pending?.kind === 'grace' && pending.ability === 'mercy')

  const clickCard = (iid: string, target: string) => {
    if (target === 'enemy') {
      setPending({ kind: 'card', iid })
    } else {
      dispatch({ type: 'combat/playCard', iid })
    }
  }
  const clickEnemy = (id: string, isHuman: boolean) => {
    if (pending?.kind === 'card') {
      dispatch({ type: 'combat/playCard', iid: pending.iid, targetId: id })
      setPending(null)
    } else if (pending?.kind === 'grace' && pending.ability === 'mercy' && isHuman) {
      dispatch({ type: 'combat/useGrace', ability: 'mercy', targetId: id })
      setPending(null)
    }
  }
  const useGraceAbility = (ability: string) => {
    if (ability === 'sight') dispatch({ type: 'combat/useGrace', ability: 'sight' })
    else setPending({ kind: 'grace', ability }) // mercy → pick a human
  }

  const Combatant = ({ c, side }: { c: CombatantView; side: 'party' | 'enemy' }) => {
    const hpPct = Math.max(0, (c.hp / c.maxHp) * 100)
    const targetable = side === 'enemy' && enemyTargetable
    return (
      <motion.div layout className={['combatant', side, c.row, targetable ? 'targetable' : '', c.isDemon ? 'demon' : ''].join(' ')}
        initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        onClick={() => side === 'enemy' && clickEnemy(c.id, c.isHuman)}
      >
        {side === 'enemy' && c.intentKind && (
          <div className="intent">{INTENT_ICON[c.intentKind] ?? '❔'}{c.intentValue ? <b>{c.intentValue}</b> : null}</div>
        )}
        <div className={'sprite ' + c.id}>{spriteGlyph(c)}</div>
        <AnimatePresence>
          {dmgByTarget[c.id] ? (
            <motion.div key={tick + c.id} className="dmg-float" initial={{ y: 0, opacity: 1 }} animate={{ y: -40, opacity: 0 }} transition={{ duration: 0.9 }}>
              -{dmgByTarget[c.id]}
            </motion.div>
          ) : null}
        </AnimatePresence>
        <div className="cbt-name">{c.displayName ?? t(c.nameKey)}</div>
        <div className="hp-bar small">
          <div className="hp-fill" style={{ width: `${hpPct}%` }} />
          <span className="hp-text">{c.hp}/{c.maxHp}</span>
        </div>
        <div className="badges">
          {c.block > 0 && <span className="badge block">🛡 {c.block}</span>}
          {c.ward > 0 && <span className="badge ward">✨ {c.ward}</span>}
          {c.row === 'back' && <span className="badge row">back</span>}
        </div>
      </motion.div>
    )
  }

  return (
    <div className="screen combat" style={{ backgroundImage: assetBg(view.battleBg) ?? 'url(/assets/004-battlefield-enchanted-forest.png)' }}>
      <div className="scrim" />
      <Hud />

      <div className="battlefield">
        <div className="side party">{view.party.filter((c) => c.alive).map((c) => <Combatant key={c.id} c={c} side="party" />)}</div>
        <div className="side enemies">{view.enemies.map((c) => <Combatant key={c.id} c={c} side="enemy" />)}</div>
      </div>

      {pending && <div className="targeting-hint">{t('ui.combat.pickTarget')}</div>}

      <div className="combat-bar">
        <div className="resources">
          <div className="orb energy">{view.energy.current}/{view.energy.max}<small>{t('ui.combat.energy')}</small></div>
          <div className="pile">{view.drawCount}<small>{t('ui.combat.draw')}</small></div>
          <div className="pile">{view.discardCount}<small>{t('ui.combat.discard')}</small></div>
          {view.grace.max > 0 && <div className="orb grace">{view.grace.current}/{view.grace.max}<small>{t('ui.combat.grace')}</small></div>}
        </div>

        <div className="hand">
          <AnimatePresence>
            {view.hand.map((card) => (
              <CardView
                key={card.iid}
                card={card}
                playable={!deciding && view.energy.current >= card.cost}
                selected={pending?.kind === 'card' && pending.iid === card.iid}
                onClick={() => clickCard(card.iid, card.target)}
              />
            ))}
          </AnimatePresence>
        </div>

        <div className="combat-actions">
          {deciding ? (
            <>
              <button className="btn primary" onClick={() => dispatch({ type: 'combat/beginAction' })}>▶</button>
              {view.canFlee && <button className="btn small" onClick={() => dispatch({ type: 'combat/flee' })}>{t('ui.combat.flee')}</button>}
            </>
          ) : (
            <>
              {[...new Set(view.graceAbilities)].map((g) => (
                <button key={g} className="btn grace small" onClick={() => useGraceAbility(g)}>{t(`grace.${g}.name`)}</button>
              ))}
              <button className="btn primary" onClick={() => dispatch({ type: 'combat/endTurn' })}>{t('ui.combat.endTurn')}</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function spriteGlyph(c: CombatantView): string {
  if (c.faction === 'party') return '🧍'
  if (c.isDemon) return '👹'
  if (c.isHuman) return '🗡️'
  return '🐺'
}
