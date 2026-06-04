import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useGame } from '../store/gameStore'
import { selectVerse } from '../selectors'

export function VerseModal({ challengeId }: { challengeId: string }) {
  const { t } = useTranslation()
  const state = useGame((s) => s.state)
  const view = useMemo(() => selectVerse(state, challengeId), [state, challengeId])
  const dispatch = useGame((s) => s.dispatch)
  const lastEvents = useGame((s) => s.lastEvents)
  const [answers, setAnswers] = useState<string[]>([])
  if (!view) return null

  const wrong = lastEvents.some((e) => e.type === 'verseRejected')
  const setAt = (i: number, v: string) => setAnswers((a) => { const n = [...a]; n[i] = v; return n })
  const submit = () => dispatch({ type: 'verse/submit', challengeId, answers })

  return (
    <div className="modal-overlay">
      <motion.div className="panel narrow verse" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <h3>📖 {t('ui.verse.title')}</h3>
        <p className="reference">{view.reference}</p>
        <p className="muted">{t('ui.verse.instructions')}</p>
        <blockquote className="verse-text">{view.gapped}</blockquote>
        <div className="verse-inputs">
          {Array.from({ length: view.blanks }).map((_, i) => (
            <input
              key={i}
              className="text-input small"
              placeholder={`${i + 1}`}
              value={answers[i] ?? ''}
              onChange={(e) => setAt(i, e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
          ))}
        </div>
        {wrong && <p className="warn">{t('ui.verse.wrong')}</p>}
        <button className="btn primary block" onClick={submit}>{t('ui.verse.submit')}</button>
      </motion.div>
    </div>
  )
}
