import { useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { resolveAsset } from '@bible/assets'
import { useGame } from '../store/gameStore'
import { selectMusic } from '../audio/selectMusic'
import { musicManager } from '../audio/musicManager'

// Renders nothing — it's the bridge that mirrors store state into the imperative MusicManager.
// Mounted once at the App root (outside the keyed screen layer) so it persists across screen changes
// and the autoplay-unlock listener is registered exactly once.
export function MusicController() {
  // useShallow so this only re-runs when the *cue* changes, not on every dispatch (selectMusic
  // returns a fresh object each call).
  const { ref, level } = useGame(useShallow((s) => selectMusic(s.state)))
  const musicVolume = useGame((s) => s.state.profile.settings.musicVolume)
  const audioMode = useGame((s) => s.state.profile.settings.audioMode)
  const reducedMotion = useGame((s) => s.state.profile.settings.reducedMotion)

  useEffect(() => {
    musicManager.unlock()
  }, [])

  useEffect(() => {
    musicManager.setMaster(musicVolume)
  }, [musicVolume])

  useEffect(() => {
    musicManager.setEnabled(audioMode === 'on')
  }, [audioMode])

  useEffect(() => {
    musicManager.setReducedMotion(reducedMotion)
  }, [reducedMotion])

  useEffect(() => {
    musicManager.apply(resolveAsset(ref ?? undefined) ?? null, level)
  }, [ref, level])

  return null
}
