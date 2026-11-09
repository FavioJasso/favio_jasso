import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

// The site's signature: a few hundred small cubes that assemble into the boot
// monogram and then re-form into an icon for each menu item. Everything is one
// InstancedMesh with hand-integrated springs, so it costs a single draw call.

const INDIGO = new THREE.Color(0x4a3ce0)
const DEEP = new THREE.Color(0x2b1f9c)
const ORANGE = new THREE.Color(0xff8800)
const LILAC = new THREE.Color(0x9b8cff)
const WHITE = new THREE.Color(0xf4f1ff)

/**
 * ASCII art -> voxels. `#` indigo, `o` orange, `+` lilac, `w` white.
 * Each pixel is split into smaller cubes when the budget allows, so every shape
 * still fits on low-end tiers. It just gets built from chunkier blocks there.
 */
function fromGrid(rows, { unit = 0.2, budget = 640 } = {}) {
  const pixels = rows.join('').replace(/[. ]/g, '').length
  const sub = pixels * 8 <= budget ? 2 : 1
  const depth = sub
  const out = []
  const h = rows.length
  const w = Math.max(...rows.map((r) => r.length))
  const s = unit / sub
  rows.forEach((row, y) => {
    ;[...row].forEach((ch, x) => {
      if (ch === '.' || ch === ' ') return
      const color = { '#': INDIGO, o: ORANGE, '+': LILAC, w: WHITE, d: DEEP }[ch] || INDIGO
      for (let sx = 0; sx < sub; sx++) {
        for (let sy = 0; sy < sub; sy++) {
          for (let sz = 0; sz < depth; sz++) {
            out.push({
              x: (x - w / 2 + 0.5) * unit + (sx - (sub - 1) / 2) * s,
              y: (h / 2 - y - 0.5) * unit + (sy - (sub - 1) / 2) * s,
              z: (sz - (depth - 1) / 2) * s,
              size: s * 0.93,
              color
            })
          }
        }
      }
    })
  })
  return out
}

function ringDisc(budget) {
  const out = []
  const s = budget >= 500 ? 0.1 : 0.2
  const R = 1.25
  const r = 0.28
  for (let x = -R; x <= R; x += s) {
    for (let y = -R; y <= R; y += s) {
      const d = Math.hypot(x, y)
      if (d > R || d < r) continue
      const t = (Math.atan2(y, x) + Math.PI) / (Math.PI * 2)
      // Bow-tie of colour across the blocks.
      const bow = Math.pow(Math.abs(Math.cos(t * Math.PI * 2 - 0.6)), 8)
      const color = d < 0.5 ? WHITE : bow > 0.5 ? ORANGE : d > 1.12 ? LILAC : INDIGO
      out.push({ x, y, z: 0, size: s * 0.93, color })
    }
  }
  return out
}

const GRIDS = {
  monogram: [
    '######...oooooo',
    '######...oooooo',
    '##..........oo.',
    '##..........oo.',
    '#####.......oo.',
    '#####.......oo.',
    '##......oo..oo.',
    '##......oo..oo.',
    '##.......oooo..',
    '##.......oooo..'
  ],
  profile: [
    '....+++++....',
    '...+++++++...',
    '...+++++++...',
    '...+++++++...',
    '....+++++....',
    '.............',
    '..#########..',
    '.###########.',
    '.###########.',
    '.####ooo####.'
  ],
  card: [
    '.#############.',
    '.#############.',
    '.##+++++++++##.',
    '.##+++++++++##.',
    '.##+++++++++##.',
    '.#############.',
    '.#############.',
    '.#o.o.o.o.o.o#.',
    '.#o.o.o.o.o.o#.',
    '.#############.'
  ],
  skills: [
    '###..ooo..###',
    '###..ooo..###',
    '###..ooo..###',
    '.............',
    '+++..###..+++',
    '+++..###..+++',
    '+++..###..+++',
    '.............',
    '###..+++..ooo',
    '###..+++..ooo',
    '###..+++..ooo'
  ],
  connect: [
    '.###########.',
    '#############',
    '#############',
    '###o##o##o###',
    '#############',
    '#############',
    '.###########.',
    '...###.......',
    '...##........',
    '...#.........'
  ]
}

function buildShapes(budget) {
  return {
    monogram: fromGrid(GRIDS.monogram, { unit: 0.21, budget }),
    profile: fromGrid(GRIDS.profile, { unit: 0.22, budget }),
    discs: ringDisc(budget),
    card: fromGrid(GRIDS.card, { unit: 0.2, budget }),
    skills: fromGrid(GRIDS.skills, { unit: 0.2, budget }),
    connect: fromGrid(GRIDS.connect, { unit: 0.22, budget })
  }
}

export function createBlocks({ count = 640, reduced = false } = {}) {
  const geo = new RoundedBoxGeometry(1, 1, 1, 2, 0.16)
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.3,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    metalness: 0
  })
  // A little self-illumination in each block's own colour, so the sculpture
  // reads as lit from inside and catches the bloom.
  mat.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
      #ifdef USE_INSTANCING_COLOR
        totalEmissiveRadiance += vColor.rgb * 0.26;
      #endif`
    )
  }
  const mesh = new THREE.InstancedMesh(geo, mat, count)
  mesh.castShadow = true
  mesh.frustumCulled = false
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)

  const shapes = buildShapes(count)
  const root = new THREE.Group()
  root.add(mesh)

  // Struct of arrays keeps the per-frame loop allocation-free.
  const px = new Float32Array(count)
  const py = new Float32Array(count)
  const pz = new Float32Array(count)
  const vx = new Float32Array(count)
  const vy = new Float32Array(count)
  const vz = new Float32Array(count)
  const tx = new Float32Array(count)
  const ty = new Float32Array(count)
  const tz = new Float32Array(count)
  const delay = new Float32Array(count)
  const size = new Float32Array(count)
  const sizeT = new Float32Array(count)
  const seed = new Float32Array(count)
  const col = []
  const colT = []
  const rnd = (() => {
    let s = 12345
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0
      return s / 4294967296
    }
  })()
  for (let i = 0; i < count; i++) {
    seed[i] = rnd()
    col.push(INDIGO.clone())
    colT.push(INDIGO.clone())
    mesh.setColorAt(i, col[i])
    px[i] = (rnd() - 0.5) * 16
    py[i] = rnd() * 7
    pz[i] = (rnd() - 0.5) * 16
  }

  const dummy = new THREE.Object3D()
  const pointer = new THREE.Vector3(1e3, 1e3, 1e3)
  const pointerLocal = new THREE.Vector3()
  let frequency = 2.1
  let zeta = 0.62
  let time = 0
  let current = null
  const onLand = { fn: null }
  let settling = 0

  function setShape(name, { stagger = 0.5, drop = false, freq = 2.1, damping = 0.62 } = {}) {
    current = name
    frequency = freq
    zeta = damping
    const pts = shapes[name] || []
    // Stable order so each block has one home per shape and the morph reads as
    // a single body rearranging, not noise.
    for (let i = 0; i < count; i++) {
      const p = pts[i % Math.max(pts.length, 1)]
      if (p && i < pts.length) {
        tx[i] = p.x
        ty[i] = p.y
        tz[i] = p.z
        sizeT[i] = p.size
        colT[i].copy(p.color)
      } else {
        // Spare blocks drift as dust around the stage.
        // They stay behind the console so none ever crosses in front of a subject.
        tx[i] = (seed[i] - 0.5) * 26
        ty[i] = -3 + seed[(i * 13) % count] * 11
        tz[i] = -5 - seed[(i * 7) % count] * 13
        sizeT[i] = 0.04 + seed[i] * 0.09
        colT[i].copy(seed[i] > 0.82 ? ORANGE : DEEP)
      }
      delay[i] = reduced ? 0 : seed[i] * stagger + (p ? (ty[i] + 1.5) * 0.04 : 0)
      if (drop && i < pts.length) {
        px[i] = tx[i] + (seed[i] - 0.5) * 1.2
        py[i] = 6.5 + seed[i] * 5
        pz[i] = tz[i] + (seed[(i * 3) % count] - 0.5) * 1.2
        vx[i] = vy[i] = vz[i] = 0
      }
    }
    settling = 2.5 + stagger
    if (reduced) snap()
  }

  function snap() {
    for (let i = 0; i < count; i++) {
      px[i] = tx[i]
      py[i] = ty[i]
      pz[i] = tz[i]
      vx[i] = vy[i] = vz[i] = 0
      size[i] = sizeT[i]
      delay[i] = 0
      col[i].copy(colT[i])
      mesh.setColorAt(i, col[i])
    }
    mesh.instanceColor.needsUpdate = true
  }

  /** A shockwave out of the sculpture; used on selection for tactile feedback. */
  function pulse(strength = 2.5) {
    if (reduced) return
    for (let i = 0; i < count; i++) {
      const len = Math.hypot(px[i], py[i], pz[i]) + 0.2
      vx[i] += (px[i] / len) * strength * (0.6 + seed[i])
      vy[i] += (py[i] / len) * strength * (0.6 + seed[i])
      vz[i] += (pz[i] / len) * strength * (0.6 + seed[i])
    }
  }

  function update(dt, camera) {
    time += dt
    settling = Math.max(0, settling - dt)
    const w = frequency * 2 * Math.PI
    const a = zeta * w
    const dd = w * Math.sqrt(1 - zeta * zeta)
    const e = Math.exp(-a * dt)
    const c = Math.cos(dd * dt)
    const s = Math.sin(dd * dt)
    root.worldToLocal(pointerLocal.copy(pointer))
    let colorsDirty = false
    let lands = 0

    for (let i = 0; i < count; i++) {
      if (delay[i] > 0) {
        const wasWaiting = delay[i]
        delay[i] -= dt
        if (wasWaiting > 0 && delay[i] <= 0) lands++
        size[i] += (sizeT[i] * 0.7 - size[i]) * Math.min(1, dt * 8)
      } else {
        // Exact under-damped integration per axis: the closed form of wobble()
        // in spring.js, written out because it runs hundreds of times a frame
        // and must not allocate.
        let j0 = px[i] - tx[i]
        let j1 = (vx[i] + a * j0) / dd
        px[i] = e * (j0 * c + j1 * s) + tx[i]
        vx[i] = e * ((j1 * dd - j0 * a) * c - (j0 * dd + j1 * a) * s)
        j0 = py[i] - ty[i]
        j1 = (vy[i] + a * j0) / dd
        py[i] = e * (j0 * c + j1 * s) + ty[i]
        vy[i] = e * ((j1 * dd - j0 * a) * c - (j0 * dd + j1 * a) * s)
        j0 = pz[i] - tz[i]
        j1 = (vz[i] + a * j0) / dd
        pz[i] = e * (j0 * c + j1 * s) + tz[i]
        vz[i] = e * ((j1 * dd - j0 * a) * c - (j0 * dd + j1 * a) * s)
        size[i] += (sizeT[i] - size[i]) * Math.min(1, dt * 7)
      }

      // Pointer pushes blocks aside, so the sculpture feels physical.
      const dx = px[i] - pointerLocal.x
      const dy = py[i] - pointerLocal.y
      const dz = (pz[i] - pointerLocal.z) * 0.4
      const d2 = dx * dx + dy * dy + dz * dz
      if (d2 < 1.1 && !reduced) {
        const f = (1.1 - d2) * 26 * dt
        const d = Math.sqrt(d2) + 0.05
        vx[i] += (dx / d) * f
        vy[i] += (dy / d) * f
        vz[i] += (dz / d) * f + f * 0.3
      }

      const bob = reduced ? 0 : Math.sin(time * 0.9 + seed[i] * 6.28) * 0.012
      dummy.position.set(px[i], py[i] + bob, pz[i])
      const motion = Math.min(1, Math.abs(vx[i]) + Math.abs(vy[i]) + Math.abs(vz[i]))
      dummy.rotation.set(motion * seed[i] * 3, motion * seed[i] * 4, motion * 2)
      dummy.scale.setScalar(size[i])
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)

      if (settling > 0) {
        col[i].lerp(colT[i], Math.min(1, dt * 5))
        mesh.setColorAt(i, col[i])
        colorsDirty = true
      }
    }
    mesh.instanceMatrix.needsUpdate = true
    if (colorsDirty && mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    if (lands && onLand.fn) onLand.fn(lands)
    void camera
  }

  return {
    root,
    mesh,
    setShape,
    snap,
    pulse,
    update,
    pointer,
    onLand,
    get shape() {
      return current
    }
  }
}
