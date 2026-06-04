import { useTranslation } from 'react-i18next'
import { useGame } from '../store/gameStore'

export function FireplaceScreen() {
  const { t } = useTranslation()
  const run = useGame((s) => s.state.run)
  const dispatch = useGame((s) => s.dispatch)
  const lastEvents = useGame((s) => s.lastEvents)
  if (!run) return null

  const node = run.world.current
  const rested = Boolean(run.world.flags[`fireplace:${node}:rested`])
  const prayed = Boolean(run.world.flags[`fireplace:${node}:prayed`])
  const heroVerseOwned = new Set(
    run.party.flatMap((m) => (m.kind === 'hero' ? run.deckByMember[m.memberId]?.filter((c) => c.startsWith('verse_')) ?? [] : [])),
  )
  const verseAvailable = Object.values(run.content.verses).some((v) => !heroVerseOwned.has(v.cardDefId))
  const notice = lastEvents.flatMap((e) => (e.type === 'notice' ? [e.messageKey] : [])).at(-1)

  return (
    <div className="screen fireplace centered">
      <div className="firelight" />
      <div className="panel narrow">
        <h2>🔥 {t('ui.fireplace.title')}</h2>
        {notice && <p className="muted">{t(notice)}</p>}
        <div className="choices">
          <button className="btn block" disabled={rested} onClick={() => dispatch({ type: 'world/fireplace', action: 'rest' })}>
            {t('ui.fireplace.rest')}
          </button>
          <button className="btn block" disabled={prayed} onClick={() => dispatch({ type: 'world/fireplace', action: 'pray' })}>
            {t('ui.fireplace.pray')}
          </button>
          <button className="btn block" disabled={!verseAvailable} onClick={() => dispatch({ type: 'world/fireplace', action: 'study' })}>
            {t('ui.fireplace.study')}
          </button>
          <button className="btn primary block" onClick={() => dispatch({ type: 'world/fireplace', action: 'leave' })}>
            {t('ui.fireplace.leave')}
          </button>
        </div>
      </div>
    </div>
  )
}
