import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { assetBg } from '@bible/assets'
import { useGame } from '../store/gameStore'
import { selectStory } from '../selectors'

// A Diablo-style long-form narration: a big, FIXED-SIZE centered panel. The passage reveals one
// character at a time (each letter fading in place) and the text crawls from the BOTTOM upward — it
// begins one screenful down (a measured top spacer), so each new line enters at the bottom edge and
// older lines rise out the top. Used when the game tells a longer tale: reading a wayside shrine, a
// teller's full story from a dialogue choice, or the closing narration after the boss falls. Click
// the text to reveal it all at once; "Continue" dismisses it (running the story's onEnd script).
//
// NOTE: the reveal re-renders this component every ~16ms, so the panel/attribution entrances use CSS
// animations (immune to re-render) rather than Framer, which would otherwise freeze mid-animation.

const STORY_TYPE_MS = 16 // per-character cadence (faster than dialogue — passages are long)

export function StoryScroll() {
  const { t } = useTranslation()
  const state = useGame((s) => s.state)
  const view = useMemo(() => selectStory(state), [state])
  const dispatch = useGame((s) => s.dispatch)
  const bodyRef = useRef<HTMLDivElement>(null)

  // join paragraphs with blank lines; white-space:pre-wrap turns the breaks into paragraphs
  const full = view ? view.paragraphs.map((p) => t(p)).join('\n\n') : ''
  const storyKey = view?.storyId ?? ''
  const [typed, setTyped] = useState(0)
  const [pad, setPad] = useState(0) // top spacer = one box-height, so text starts at the bottom edge
  useEffect(() => setTyped(0), [storyKey])
  useLayoutEffect(() => {
    if (bodyRef.current) setPad(bodyRef.current.clientHeight)
  }, [storyKey])

  const done = typed >= full.length

  // reveal one character at a time
  useEffect(() => {
    if (typed >= full.length) return
    const id = window.setTimeout(() => setTyped((n) => Math.min(n + 1, full.length)), STORY_TYPE_MS)
    return () => window.clearTimeout(id)
  }, [typed, full])

  // crawl upward: ease the scroll toward the bottom so newly-revealed text rises from the bottom
  // edge to the top (stops once fully revealed, leaving the reader free to scroll back up)
  useEffect(() => {
    if (done) return
    let raf = 0
    const step = () => {
      const el = bodyRef.current
      if (el) {
        const target = el.scrollHeight - el.clientHeight
        el.scrollTop += (target - el.scrollTop) * 0.05
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [done, storyKey])

  if (!view) return null
  const shown = full.slice(0, typed)

  return (
    <div className="story-overlay">
      {view.bgAsset && <div className="story-bg" style={{ backgroundImage: assetBg(view.bgAsset) }} />}
      <div className="story-panel">
        {view.titleKey && <h2 className="story-title">{t(view.titleKey)}</h2>}
        <div className="story-body" ref={bodyRef} style={{ overflowY: done ? 'auto' : 'hidden' }} onClick={() => !done && setTyped(full.length)}>
          <div className="story-spacer" style={{ height: pad }} aria-hidden />
          <p className="story-text">
            {shown.split('').map((ch, i) => (
              <span key={i} className="story-char">{ch}</span>
            ))}
          </p>
          {done && view.attributionKey && <p className="story-attribution">{t(view.attributionKey)}</p>}
          <div className="story-spacer" style={{ height: Math.round(pad * 0.4) }} aria-hidden />
        </div>
        <div className="story-actions">
          <button className="btn primary" onClick={() => dispatch({ type: 'world/dismissStory' })}>
            {t('ui.story.continue')}
          </button>
        </div>
      </div>
    </div>
  )
}
