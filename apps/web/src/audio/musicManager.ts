// Imperative background-music engine. One looping <audio> element per track URL, its volume
// tweened toward a per-element target via requestAnimationFrame. A crossfade is just "incoming → its
// effective volume" + "everything else → 0"; a same-track level change is the same machinery with
// only the level differing. No Web Audio graph, no dependency — perceptually fine for slow ambient
// fades, and dead-simple autoplay-unlock (retry play() on the first user gesture).
//
// React never touches this directly: MusicController mirrors store state into apply()/setMaster()/
// setEnabled()/setReducedMotion(), and selectMusic() decides the track + level.

// Time for a full 0→1 volume sweep; partial changes (e.g. a 0.5→0.2 duck) take proportionally less.
// Kept long so map↔node↔battle transitions are slow and subtle rather than an abrupt swap.
const FADE_MS = 5000
const SETTLE = 0.001

const clamp01 = (v: number): number => (!Number.isFinite(v) ? 0 : v < 0 ? 0 : v > 1 ? 1 : v)

interface Track {
  el: HTMLAudioElement
  /** desired volume 0..1; the tween chases this every frame */
  target: number
}

class MusicManager {
  private tracks = new Map<string, Track>()
  private currentUrl: string | null = null
  private currentLevel = 0
  private master = 0.5
  private enabled = true
  private reducedMotion = false
  private rafId: number | null = null
  private lastTs: number | null = null
  private unlockBound = false

  /** Master music volume (the settings slider). */
  setMaster(v: number): void {
    this.master = clamp01(v)
    this.refresh()
  }

  /** Whether music may sound at all (audioMode === 'on'). When false, music fades out and pauses. */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    this.refresh()
  }

  /** When true, transitions are instant cuts instead of fades (accessibility). */
  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced
  }

  /** Make `url` the audible track at `level` (a 0..1 multiplier of master). null → fade all out. */
  apply(url: string | null, level: number): void {
    this.currentUrl = url
    this.currentLevel = clamp01(level)
    this.refresh()
  }

  /** Browsers block autoplay until a user gesture; (re)start the current track on the next one. */
  unlock(): void {
    if (this.unlockBound) return
    this.unlockBound = true
    const onGesture = () => this.playCurrent()
    window.addEventListener('pointerdown', onGesture)
    window.addEventListener('keydown', onGesture)
    window.addEventListener('touchstart', onGesture)
  }

  private effective(): number {
    return this.enabled ? this.currentLevel * this.master : 0
  }

  private getTrack(url: string): Track {
    let t = this.tracks.get(url)
    if (!t) {
      const el = new Audio(url)
      el.loop = true
      el.preload = 'auto'
      el.volume = 0
      t = { el, target: 0 }
      this.tracks.set(url, t)
    }
    return t
  }

  /** Recompute every track's target from current state, ensure the active one plays, then tween. */
  private refresh(): void {
    const eff = this.effective()
    for (const [url, t] of this.tracks) t.target = url === this.currentUrl ? eff : 0
    if (this.currentUrl) {
      const t = this.getTrack(this.currentUrl)
      t.target = eff
      if (eff > 0) this.play(t)
    }
    if (this.reducedMotion) this.snap()
    else this.startTween()
  }

  private playCurrent(): void {
    if (!this.currentUrl || this.effective() <= 0) return
    this.play(this.getTrack(this.currentUrl))
  }

  private play(t: Track): void {
    if (!t.el.paused) return
    const p = t.el.play()
    // autoplay blocked → swallow; the unlock listeners retry on the next gesture
    if (p && typeof p.catch === 'function') p.catch(() => {})
  }

  private snap(): void {
    for (const t of this.tracks.values()) {
      t.el.volume = clamp01(t.target)
      if (t.target <= 0 && !t.el.paused) t.el.pause()
    }
    this.stopTween()
  }

  private startTween(): void {
    if (this.rafId != null) return
    this.lastTs = null
    const step = (ts: number) => {
      if (this.lastTs == null) this.lastTs = ts
      const stepAmt = (ts - this.lastTs) / FADE_MS
      this.lastTs = ts
      let active = false
      for (const t of this.tracks.values()) {
        const cur = t.el.volume
        if (Math.abs(cur - t.target) < SETTLE) {
          t.el.volume = clamp01(t.target)
          if (t.target <= 0 && !t.el.paused) t.el.pause()
          continue
        }
        const dir = t.target > cur ? 1 : -1
        let next = cur + dir * stepAmt
        if ((dir > 0 && next > t.target) || (dir < 0 && next < t.target)) next = t.target
        t.el.volume = clamp01(next)
        if (next <= 0 && t.target <= 0 && !t.el.paused) t.el.pause()
        active = true
      }
      if (active) {
        this.rafId = requestAnimationFrame(step)
      } else {
        this.rafId = null
        this.lastTs = null
      }
    }
    this.rafId = requestAnimationFrame(step)
  }

  private stopTween(): void {
    if (this.rafId != null) cancelAnimationFrame(this.rafId)
    this.rafId = null
    this.lastTs = null
  }
}

export const musicManager = new MusicManager()
