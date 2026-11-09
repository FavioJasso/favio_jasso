// Exact, frame-rate independent springs (after Daniel Holden's "Spring-It-On").
// They stay stable under frame drops, which matters because adaptive quality
// changes the frame rate at runtime.

const LN2 = 0.69314718056

/** Critically damped: settles without overshoot. Writes back into `s` {x, v}. */
export function damp(s, target, halflife, dt) {
  const y = (2 * LN2) / Math.max(halflife, 1e-4)
  const j0 = s.x - target
  const j1 = s.v + j0 * y
  const e = Math.exp(-y * dt)
  s.x = e * (j0 + j1 * dt) + target
  s.v = e * (s.v - j1 * y * dt)
  return s.x
}

/**
 * Under-damped, for things that should wobble (a lid, a dropped disc).
 * `frequency` is in Hz, `zeta` < 1 overshoots.
 */
export function wobble(s, target, frequency, zeta, dt) {
  const w = frequency * 2 * Math.PI
  const a = zeta * w
  const d = w * Math.sqrt(Math.max(1 - zeta * zeta, 1e-4))
  const j0 = s.x - target
  const j1 = (s.v + a * j0) / d
  const e = Math.exp(-a * dt)
  const c = Math.cos(d * dt)
  const si = Math.sin(d * dt)
  s.x = e * (j0 * c + j1 * si) + target
  s.v = e * ((j1 * d - j0 * a) * c - (j0 * d + j1 * a) * si)
  return s.x
}

export const spring = (x = 0) => ({ x, v: 0 })
