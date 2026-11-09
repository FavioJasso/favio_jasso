/** Can this browser draw the 3D site at all? */
export function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!c.getContext('webgl2')
  } catch {
    return false
  }
}

/**
 * Starting guess only. GPU detection is unreliable, so runtime frame timing
 * (see FrameMonitor) has the final say.
 */
export function guessTier() {
  const params = new URLSearchParams(location.search)
  const forced = params.get('quality')
  if (['low', 'mid', 'high'].includes(forced)) return forced

  const coarse = matchMedia('(pointer: coarse)').matches
  const cores = navigator.hardwareConcurrency || 4
  const memory = navigator.deviceMemory || 8
  if (cores <= 4 || memory <= 3) return 'low'
  if (coarse) return 'mid'
  return 'high'
}

export const TIERS = {
  low: { dpr: 1, smaa: true, grain: false, aberration: false, blocks: 360 },
  mid: { dpr: 1.5, smaa: true, grain: true, aberration: false, blocks: 560 },
  high: { dpr: 2, smaa: true, grain: true, aberration: true, blocks: 640 }
}

/**
 * Lowers (and carefully restores) pixel ratio from real frame times. Hysteresis
 * and a flip limit stop it oscillating, which would look worse than either level.
 */
export class FrameMonitor {
  constructor({ start, min = 0.75, max, onChange }) {
    this.dpr = start
    this.min = min
    this.max = max
    this.onChange = onChange
    this.acc = 0
    this.frames = 0
    this.flips = 0
    this.lastDir = 0
    this.trial = null
    this.locked = false
    this.warmup = 2 // Ignore shader compile hitches right after a scene change.
  }

  hold(seconds = 1.5) {
    this.warmup = Math.max(this.warmup, seconds)
    this.acc = 0
    this.frames = 0
  }

  /** @param dt real seconds since the last frame, not clamped. */
  tick(dt) {
    // A long gap means the browser throttled or paused the tab. That says
    // nothing about the GPU, so it must not count against the quality level.
    if (dt > 0.25) {
      this.acc = 0
      this.frames = 0
      return
    }
    if (this.warmup > 0) {
      this.warmup -= dt
      return
    }
    this.acc += dt
    this.frames++
    if (this.acc < 1.25) return
    const fps = this.frames / this.acc
    this.acc = 0
    this.frames = 0

    // Did the last step down help? If not, the browser is capping the rate (Low
    // Power Mode, a 30 Hz display), not the GPU. Put the sharpness back and stop.
    if (this.trial) {
      const { fpsBefore, dprBefore } = this.trial
      this.trial = null
      if (fps < fpsBefore * 1.08) {
        this.locked = true
        this.dpr = dprBefore
        this.onChange(this.dpr)
        return
      }
    }
    if (this.locked) return

    let dir = 0
    if (fps < 46 && this.dpr > this.min) dir = -1
    else if (fps > 58 && this.dpr < this.max && this.flips < 3) dir = 1
    if (!dir) return
    if (dir !== this.lastDir && this.lastDir !== 0) this.flips++
    this.lastDir = dir
    if (dir < 0) this.trial = { fpsBefore: fps, dprBefore: this.dpr }
    this.dpr = Math.min(this.max, Math.max(this.min, this.dpr + dir * (dir < 0 ? 0.25 : 0.125)))
    this.onChange(this.dpr)
  }
}
