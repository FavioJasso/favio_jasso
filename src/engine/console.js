import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { grainNormal } from './textures.js'

// An original console design: the "FJ-01". It shares the era's spirit (a chunky,
// saturated, top-loading toy of a machine) but has its own proportions, a round
// smoked lid with an orange ring, two ports and an FJ block emblem.

const W = 2.5 // footprint
const H = 1.72
const LID_R = 0.86
export const SPINDLE_Y = H + 0.012 // where a seated disc rests
export const HINGE_Z = -LID_R - 0.1

function roundedRectShape(w, h, r) {
  const s = new THREE.Shape()
  const x = -w / 2
  const y = -h / 2
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0)
  s.lineTo(x + w, y + h - r)
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2)
  s.lineTo(x + r, y + h)
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI)
  s.lineTo(x, y + r)
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5)
  return s
}

function latheFrom(points, segments = 96) {
  return new THREE.LatheGeometry(
    points.map(([x, y]) => new THREE.Vector2(x, y)),
    segments
  )
}

/** Small round button: returns the pivot so it can travel when pressed. */
function button(radius, material) {
  const geo = latheFrom(
    [
      [0, 0.05],
      [radius * 0.82, 0.05],
      [radius * 0.96, 0.038],
      [radius, 0.012],
      [radius, 0]
    ],
    48
  )
  const m = new THREE.Mesh(geo, material)
  m.castShadow = true
  return m
}

export function createConsole({ tier = 'high' } = {}) {
  const root = new THREE.Group()
  const grain = grainNormal(256, 1.4)
  grain.repeat.set(5, 5)

  const plastic = new THREE.MeshPhysicalMaterial({
    color: 0x2a1cb0,
    roughness: 0.44,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.14,
    normalMap: grain,
    normalScale: new THREE.Vector2(0.09, 0.09),
    sheen: 0.5,
    sheenRoughness: 0.5,
    sheenColor: new THREE.Color(0x6a5cff)
  })
  const plasticDark = new THREE.MeshPhysicalMaterial({
    color: 0x120c4a,
    roughness: 0.56,
    clearcoat: 0.4,
    clearcoatRoughness: 0.35
  })
  const rubber = new THREE.MeshStandardMaterial({ color: 0x07051c, roughness: 0.92 })
  const well = new THREE.MeshStandardMaterial({ color: 0x0a0726, roughness: 0.74 })
  const metal = new THREE.MeshStandardMaterial({ color: 0xc9cce0, roughness: 0.25, metalness: 1 })
  const orange = new THREE.MeshPhysicalMaterial({
    color: 0xff8800,
    roughness: 0.28,
    clearcoat: 1,
    clearcoatRoughness: 0.08
  })
  const ledMat = new THREE.MeshStandardMaterial({
    color: 0x1a0a00,
    emissive: new THREE.Color(0xff8800),
    emissiveIntensity: 0.25,
    roughness: 0.3,
    toneMapped: false
  })
  const ringGlow = new THREE.MeshStandardMaterial({
    color: 0x1a0a00,
    emissive: new THREE.Color(0xff8800),
    emissiveIntensity: 0.9,
    roughness: 0.25,
    toneMapped: false
  })

  // --- Body: lower shell plus a top slab with a true recess for the disc. ---
  // The shell is square-shouldered where it meets the slab, so the two pieces
  // read as one moulding split by a fine groove rather than a lid on a box.
  const lowerGeo = new THREE.ExtrudeGeometry(roundedRectShape(W - 0.16, W - 0.16, 0.2), {
    depth: H - 0.42,
    bevelEnabled: true,
    bevelThickness: 0.07,
    bevelSize: 0.08,
    bevelSegments: 8,
    curveSegments: 32
  })
  lowerGeo.rotateX(-Math.PI / 2)
  const lower = new THREE.Mesh(lowerGeo, plastic)
  lower.position.y = 0.12
  lower.castShadow = true
  lower.receiveShadow = true
  root.add(lower)

  const slabShape = roundedRectShape(W - 0.1, W - 0.1, 0.24)
  const hole = new THREE.Path()
  hole.absarc(0, 0, LID_R - 0.05, 0, Math.PI * 2, true)
  slabShape.holes.push(hole)
  const slabGeo = new THREE.ExtrudeGeometry(slabShape, {
    depth: 0.2,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 8,
    curveSegments: 96
  })
  slabGeo.rotateX(-Math.PI / 2)
  const slab = new THREE.Mesh(slabGeo, plastic)
  slab.position.y = H - 0.25
  slab.castShadow = true
  slab.receiveShadow = true
  root.add(slab)

  // Parting line between shell and slab reads as a real two-piece moulding.
  const seam = new THREE.Mesh(new RoundedBoxGeometry(W - 0.04, 0.05, W - 0.04, 2, 0.02), rubber)
  seam.position.y = H - 0.28
  root.add(seam)

  // Disc well: dark bowl plus spindle.
  const bowl = new THREE.Mesh(
    latheFrom([
      [0, 0],
      [LID_R - 0.06, 0],
      [LID_R - 0.06, 0.26]
    ]),
    new THREE.MeshStandardMaterial({ color: 0x0a0726, roughness: 0.7, side: THREE.DoubleSide })
  )
  bowl.position.y = H - 0.26
  bowl.receiveShadow = true
  root.add(bowl)

  const hub = new THREE.Mesh(
    latheFrom(
      [
        [0, 0.27],
        [0.05, 0.27],
        [0.075, 0.25],
        [0.078, 0.2],
        [0.17, 0.19],
        [0.19, 0],
        [0, 0]
      ],
      48
    ),
    metal
  )
  hub.position.y = H - 0.26
  root.add(hub)

  // Ring of glow around the well; the signature detail.
  const ring = new THREE.Mesh(new THREE.TorusGeometry(LID_R + 0.035, 0.016, 12, 128), ringGlow)
  ring.rotation.x = Math.PI / 2
  ring.position.y = H + 0.002
  root.add(ring)

  // --- Lid, hinged at the back. Smoked glass with a raised rim. ---
  const lidPivot = new THREE.Group()
  lidPivot.position.set(0, H + 0.02, HINGE_Z)
  root.add(lidPivot)
  const lid = new THREE.Group()
  lid.position.z = -HINGE_Z
  lidPivot.add(lid)

  const rim = new THREE.Mesh(
    latheFrom([
      [LID_R - 0.14, 0.012],
      [LID_R - 0.1, 0.085],
      [LID_R - 0.05, 0.1],
      [LID_R - 0.01, 0.075],
      [LID_R, 0.02],
      [LID_R - 0.015, 0],
      [LID_R - 0.14, 0]
    ]),
    plastic
  )
  rim.castShadow = true
  lid.add(rim)

  const glass = new THREE.Mesh(
    new THREE.CircleGeometry(LID_R - 0.125, 96),
    new THREE.MeshPhysicalMaterial({
      color: 0x241a66,
      roughness: 0.06,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  )
  glass.rotation.x = -Math.PI / 2
  glass.position.y = 0.04
  lid.add(glass)

  // Latch tab at the front of the lid.
  const tab = new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.05, 0.14, 4, 0.024), orange)
  tab.position.set(0, 0.03, LID_R + 0.015)
  tab.castShadow = true
  lid.add(tab)

  // Hinge block at the back.
  const hinge = new THREE.Mesh(new RoundedBoxGeometry(0.72, 0.08, 0.13, 4, 0.035), plasticDark)
  hinge.position.set(0, H + 0.015, HINGE_Z)
  hinge.castShadow = true
  root.add(hinge)

  // --- Top controls: power and open, front-right and front-left corners. ---
  const powerBtn = button(0.1, orange)
  powerBtn.position.set(0.94, H, 0.94)
  root.add(powerBtn)
  const openBtn = button(0.1, plasticDark)
  openBtn.position.set(-0.94, H, 0.94)
  root.add(openBtn)
  for (const [x, z] of [
    [0.94, 0.94],
    [-0.94, 0.94]
  ]) {
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.112, 0.008, 8, 48), plasticDark)
    collar.rotation.x = Math.PI / 2
    collar.position.set(x, H + 0.002, z)
    root.add(collar)
  }

  // --- FJ block emblem on the slab, built from tiny cubes. ---
  const F = ['###', '#..', '##.', '#..', '#..']
  const J = ['..#', '..#', '..#', '#.#', '###']
  const emblemBoxes = []
  const u = 0.024
  const addGlyph = (rows, ox) =>
    rows.forEach((row, y) =>
      [...row].forEach((c, x) => {
        if (c === '#') {
          const b = new THREE.BoxGeometry(u * 0.86, 0.008, u * 0.86)
          b.translate(ox + x * u, 0, -0.06 + y * u)
          emblemBoxes.push(b)
        }
      })
    )
  addGlyph(F, -0.1)
  addGlyph(J, 0.0)
  const emblem = new THREE.Mesh(mergeGeometries(emblemBoxes), orange)
  emblem.position.set(-0.98, H + 0.003, -0.98)
  root.add(emblem)

  // --- Front face: ports, memory card doors, status LED, vents. ---
  const front = new THREE.Group()
  front.position.set(0, 0, W / 2)
  root.add(front)

  const portShape = roundedRectShape(0.44, 0.32, 0.1)
  const portGeo = new THREE.ExtrudeGeometry(portShape, {
    depth: 0.015,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 4,
    curveSegments: 24
  })
  const portInner = new THREE.ShapeGeometry(roundedRectShape(0.34, 0.22, 0.07), 24)
  for (const x of [-0.42, 0.42]) {
    const p = new THREE.Mesh(portGeo, plasticDark)
    p.position.set(x, 0.56, -0.008)
    front.add(p)
    const inner = new THREE.Mesh(portInner, rubber)
    inner.position.set(x, 0.56, 0.0215)
    front.add(inner)
    for (let i = 0; i < 3; i++) {
      const pin = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.006), metal)
      pin.position.set(x - 0.06 + i * 0.06, 0.56, 0.025)
      front.add(pin)
    }
  }

  // Memory card doors, flush rounded panels.
  for (const x of [-0.42, 0.42]) {
    const door = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.17, 0.03, 3, 0.012), plasticDark)
    door.position.set(x, 1.0, 0.002)
    front.add(door)
    const grip = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.016, 0.012, 2, 0.005), plastic)
    grip.position.set(x, 1.0, 0.019)
    front.add(grip)
  }

  const led = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.012, 24), ledMat)
  led.rotation.x = Math.PI / 2
  led.position.set(0, 0.56, 0.004)
  front.add(led)

  // Vent bars along the skirt.
  const ventBoxes = []
  for (let i = 0; i < 17; i++) {
    const b = new RoundedBoxGeometry(0.052, 0.13, 0.03, 2, 0.012)
    b.translate(-0.88 + i * 0.11, 0.23, 0)
    ventBoxes.push(b)
  }
  const vents = new THREE.Mesh(mergeGeometries(ventBoxes), rubber)
  front.add(vents)

  // Rubber feet.
  for (const x of [-0.95, 0.95]) {
    for (const z of [-0.95, 0.95]) {
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.06, 24), rubber)
      foot.position.set(x, 0.03, z)
      root.add(foot)
    }
  }

  if (tier === 'low') {
    // Clearcoat is the costliest term. Drop it everywhere but keep the look.
    plastic.clearcoat = 0.6
    plastic.sheen = 0
    plastic.normalMap = null
  }

  return {
    root,
    lidPivot,
    hitLid: rim,
    hitBody: [lower, slab],
    powerBtn,
    openBtn,
    led: ledMat,
    ring: ringGlow,
    height: H,
    /** 0 = closed, 1 = fully open */
    setLid(t) {
      lidPivot.rotation.x = -t * 1.92
    }
  }
}
