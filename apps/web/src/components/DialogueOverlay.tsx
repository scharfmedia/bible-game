import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { assetBg } from '@bible/assets'
import { useGame } from '../store/gameStore'
import { selectDialogue } from '../selectors'

// A Monkey-Island-style conversation rendered as an ADDITIVE overlay: the scene/map underneath
// stays mounted and visible. The NPC's lines are shown one at a time (click anywhere — or
// "Continue" — to advance); once the last line is reached the response choices appear. Picking a
// choice advances the conversation; "Leave" ends it. Driven entirely by selectDialogue(state).

export function DialogueOverlay() {
  const { t } = useTranslation()
  const state = useGame((s) => s.state)
  const view = useMemo(() => selectDialogue(state), [state])
  const dispatch = useGame((s) => s.dispatch)

  // Step through the speaker's lines; reset whenever the node (or conversation) changes.
  const [lineIdx, setLineIdx] = useState(0)
  const nodeKey = view ? `${view.dialogueId}:${view.nodeId}` : null
  useEffect(() => setLineIdx(0), [nodeKey])

  if (!view) return null
  const lines = view.lines.length ? view.lines : ['']
  const onLastLine = lineIdx >= lines.length - 1
  const advance = () => setLineIdx((i) => Math.min(i + 1, lines.length - 1))

  return (
    <div className="dialogue-overlay" onClick={() => !onLastLine && advance()}>
      {view.bgAsset && <div className="dialogue-bg" style={{ backgroundImage: assetBg(view.bgAsset) }} />}
      <motion.div
        className="dialogue-panel"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      >
        <div className="dialogue-portrait" aria-hidden>
          {view.portraitAsset ? (
            <span className="dialogue-portrait-img" style={{ backgroundImage: assetBg(view.portraitAsset) }} />
          ) : (
            <span className="dialogue-silhouette">🧍</span>
          )}
        </div>
        <div className="dialogue-body">
          {view.speaker && <div className="dialogue-speaker">{t(view.speaker)}</div>}
          <motion.p key={lineIdx} className="dialogue-line" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
            {t(lines[lineIdx]!)}
          </motion.p>

          {!onLastLine ? (
            <button className="btn dialogue-next" onClick={(e) => { e.stopPropagation(); advance() }}>
              {t('ui.dialogue.continue')} ▸
            </button>
          ) : (
            <div className="choices dialogue-choices">
              {view.choices.map((c) => (
                <button
                  key={c.id}
                  className="btn block"
                  disabled={!c.enabled}
                  onClick={(e) => {
                    e.stopPropagation()
                    dispatch({ type: 'world/dialogueChoice', dialogueId: view.dialogueId, nodeId: view.nodeId, choiceId: c.id })
                  }}
                >
                  {t(c.textKey)}
                </button>
              ))}
              <button className="btn dialogue-leave" onClick={(e) => { e.stopPropagation(); dispatch({ type: 'world/leaveDialogue' }) }}>
                {t('ui.dialogue.leave')}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
