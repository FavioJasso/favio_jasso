// Every sound on the site is synthesized here at runtime with Web Audio. There
// are no audio files, and the boot chime is an original melody written for this
// site, so nothing is sampled from or modelled on any console's audio.

const STORE_KEY = 'fj-muted'

class Audio {
  constructor() {
    this.ctx = null
    this.master = null
    this.muted = false
    this.whirNodes = null
    this.padNodes = null
    this.lastTick = 0
    try {
      this.muted = localStorage.getItem(STORE_KEY) === '1'
    } catch {
      /* Storage can be blocked; sound simply defaults to on. */
    }
  }

  /** Must run inside a user gesture. Safe to call repeatedly. */
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return
      this.ctx = new AC()
      this.master = this.ctx.createGain()
      this.master.gain.value = this.muted ? 0 : 0.8
      const comp = this.ctx.createDynamicsCompressor()
      this.master.connect(comp)
      comp.connect(this.ctx.destination)
      this.noiseBuf = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate)
      const d = this.noiseBuf.getChannelData(0)
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
      this.reverb = this.makeReverb()
      // iOS can park the context as 'interrupted' after a call or a tab switch.
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) this.ctx?.resume()
      })
    }
    if (this.ctx.state !== 'running') this.ctx.resume()
  }

  makeReverb() {
    const { ctx } = this
    const len = ctx.sampleRate * 1.8
    const buf = ctx.createBuffer(2, len, ctx.sampleRate)
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch)
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2)
    }
    const conv = ctx.createConvolver()
    conv.buffer = buf
    const wet = ctx.createGain()
    wet.gain.value = 0.3
    conv.connect(wet)
    wet.connect(this.master)
    return conv
  }

  setMuted(m) {
    this.muted = m
    try {
      localStorage.setItem(STORE_KEY, m ? '1' : '0')
    } catch {
      /* Not persisted; still applies for this visit. */
    }
    if (this.master) {
      this.master.gain.setTargetAtTime(m ? 0 : 0.8, this.ctx.currentTime, 0.02)
    }
  }

  get ready() {
    return !!this.ctx && this.ctx.state === 'running'
  }

  tone({ freq, to, type = 'sine', dur = 0.12, gain = 0.2, at = 0, attack = 0.003, wet = false }) {
    if (!this.ready) return
    const t = this.ctx.currentTime + at
    const o = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    o.type = type
    o.frequency.setValueAtTime(freq, t)
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(gain, t + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g)
    g.connect(this.master)
    if (wet) g.connect(this.reverb)
    o.start(t)
    o.stop(t + dur + 0.02)
  }

  noise({ dur = 0.08, gain = 0.2, freq = 2000, q = 1, type = 'bandpass', at = 0, to }) {
    if (!this.ready) return
    const t = this.ctx.currentTime + at
    const s = this.ctx.createBufferSource()
    s.buffer = this.noiseBuf
    s.loop = true
    const f = this.ctx.createBiquadFilter()
    f.type = type
    f.frequency.setValueAtTime(freq, t)
    if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur)
    f.Q.value = q
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(gain, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    s.connect(f)
    f.connect(g)
    g.connect(this.master)
    s.start(t, Math.random() * 0.5)
    s.stop(t + dur + 0.02)
  }

  /** FM bell, the voice of the chime. */
  bell(freq, at, dur = 1.5, gain = 0.16, ratio = 3.01) {
    if (!this.ready) return
    const t = this.ctx.currentTime + at
    const car = this.ctx.createOscillator()
    const mod = this.ctx.createOscillator()
    const modG = this.ctx.createGain()
    const g = this.ctx.createGain()
    car.frequency.value = freq
    mod.frequency.value = freq * ratio
    modG.gain.setValueAtTime(freq * 2.2, t)
    modG.gain.exponentialRampToValueAtTime(1, t + dur * 0.5)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(gain, t + 0.006)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    mod.connect(modG)
    modG.connect(car.frequency)
    car.connect(g)
    g.connect(this.master)
    g.connect(this.reverb)
    car.start(t)
    mod.start(t)
    car.stop(t + dur + 0.05)
    mod.stop(t + dur + 0.05)
  }

  // --- Interface ---
  move() {
    this.tone({ freq: 880, to: 1320, dur: 0.05, gain: 0.08, type: 'triangle' })
  }
  select() {
    this.tone({ freq: 660, dur: 0.09, gain: 0.13, type: 'triangle', wet: true })
    this.tone({ freq: 990, dur: 0.14, gain: 0.13, type: 'triangle', at: 0.06, wet: true })
  }
  back() {
    this.tone({ freq: 620, to: 400, dur: 0.12, gain: 0.12, type: 'triangle' })
  }
  error() {
    this.tone({ freq: 196, dur: 0.16, gain: 0.14, type: 'square' })
  }

  // --- Machine ---
  lidOpen() {
    this.noise({ dur: 0.03, gain: 0.4, freq: 2600, q: 2 })
    this.tone({ freq: 240, to: 130, dur: 0.1, gain: 0.25 })
    this.noise({ dur: 0.2, gain: 0.05, freq: 900, to: 3000, q: 1, at: 0.03 })
  }
  lidClose() {
    this.noise({ dur: 0.02, gain: 0.5, freq: 3200, q: 2 })
    this.tone({ freq: 170, to: 80, dur: 0.14, gain: 0.34 })
  }
  discSeat() {
    this.noise({ dur: 0.018, gain: 0.45, freq: 5200, q: 3 })
    this.tone({ freq: 1250, to: 720, dur: 0.05, gain: 0.08, type: 'triangle' })
  }
  button() {
    this.noise({ dur: 0.012, gain: 0.5, freq: 4200, q: 3 })
    this.tone({ freq: 300, to: 140, dur: 0.05, gain: 0.2 })
  }
  whirStart() {
    if (!this.ready || this.whirNodes) return
    const t = this.ctx.currentTime
    const o = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    const f = this.ctx.createBiquadFilter()
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(38, t)
    o.frequency.exponentialRampToValueAtTime(330, t + 1.6)
    f.type = 'bandpass'
    f.frequency.setValueAtTime(420, t)
    f.frequency.exponentialRampToValueAtTime(1800, t + 1.6)
    f.Q.value = 1.5
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.055, t + 0.7)
    o.connect(f)
    f.connect(g)
    g.connect(this.master)
    o.start(t)
    this.whirNodes = { o, g }
  }
  whirStop() {
    if (!this.whirNodes || !this.ctx) return
    const { o, g } = this.whirNodes
    const t = this.ctx.currentTime
    g.gain.cancelScheduledValues(t)
    g.gain.setTargetAtTime(0.0001, t, 0.12)
    o.stop(t + 0.7)
    this.whirNodes = null
  }

  /**
   * The boot chime: an original rising phrase in D Lydian, ending on an open
   * fifth. `alt` is the hidden variant played when Z is held during boot.
   */
  chime(alt = false) {
    if (!this.ready) return
    const D = 293.66
    const st = (n) => D * Math.pow(2, n / 12)
    const phrase = alt
      ? [
          [0, 0],
          [7, 0.11],
          [12, 0.22],
          [18, 0.33],
          [19, 0.44],
          [24, 0.66]
        ]
      : [
          [7, 0],
          [14, 0.13],
          [18, 0.26],
          [21, 0.46],
          [19, 0.66],
          [26, 0.86]
        ]
    phrase.forEach(([n, at]) => this.bell(st(n), at, 1.6, 0.13, alt ? 2.01 : 3.01))
    const end = alt ? 0.66 : 0.86
    ;[0, 7, 12].forEach((n) => this.bell(st(n - 12), end, 2.6, 0.09, 1.01))
    this.tone({ freq: st(-24), dur: 2.4, gain: 0.14, at: end, attack: 0.03, wet: true })
  }

  /** Blocks landing. Scheduled in one pass and rate-capped, or it turns to noise. */
  blockTicks(count) {
    if (!this.ready) return
    const now = this.ctx.currentTime
    if (now - this.lastTick < 1 / 18) return
    this.lastTick = now
    const f = 1500 + Math.random() * 1100
    this.tone({ freq: f, to: f * 0.7, dur: 0.025, gain: Math.min(0.05, 0.015 + count * 0.004), type: 'triangle' })
  }

  /** Quiet ambient bed for the menu. Slow enough to forget it is there. */
  padStart() {
    if (!this.ready || this.padNodes) return
    const t = this.ctx.currentTime
    const out = this.ctx.createGain()
    out.gain.setValueAtTime(0.0001, t)
    out.gain.exponentialRampToValueAtTime(0.045, t + 3)
    const lp = this.ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 650
    const lfo = this.ctx.createOscillator()
    const lfoG = this.ctx.createGain()
    lfo.frequency.value = 0.07
    lfoG.gain.value = 300
    lfo.connect(lfoG)
    lfoG.connect(lp.frequency)
    const oscs = [146.83, 220, 277.18, 329.63].map((f, i) => {
      const o = this.ctx.createOscillator()
      o.type = i % 2 ? 'triangle' : 'sine'
      o.frequency.value = f
      o.detune.value = (i - 1.5) * 4
      o.connect(lp)
      o.start(t)
      return o
    })
    lfo.start(t)
    lp.connect(out)
    out.connect(this.master)
    out.connect(this.reverb)
    this.padNodes = { out, oscs, lfo }
  }
  padStop() {
    if (!this.padNodes || !this.ctx) return
    const { out, oscs, lfo } = this.padNodes
    const t = this.ctx.currentTime
    out.gain.cancelScheduledValues(t)
    out.gain.setTargetAtTime(0.0001, t, 0.4)
    oscs.forEach((o) => o.stop(t + 2))
    lfo.stop(t + 2)
    this.padNodes = null
  }
}

export const audio = new Audio()
