import * as THREE from 'three'
import { discLabel } from './textures.js'

export const DISC_R = 0.68
const HOLE_R = 0.085
const DISC_T = 0.016

function discGeometry() {
  // A thin lathe with softly rounded edges so the rim catches a highlight.
  const pts = [
    [HOLE_R, -DISC_T / 2],
    [DISC_R - 0.006, -DISC_T / 2],
    [DISC_R, -DISC_T / 4],
    [DISC_R, DISC_T / 4],
    [DISC_R - 0.006, DISC_T / 2],
    [HOLE_R, DISC_T / 2],
    [HOLE_R, -DISC_T / 2]
  ].map(([x, y]) => new THREE.Vector2(x, y))
  return new THREE.LatheGeometry(pts, 128)
}

const sharedGeo = { body: null, label: null, hubRing: null }

function discMaterial() {
  const m = new THREE.MeshPhysicalMaterial({
    color: 0xd6dbe8,
    metalness: 1,
    roughness: 0.2,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    iridescence: 0.5,
    iridescenceIOR: 1.8,
    iridescenceThicknessMinimum: 180,
    iridescenceThicknessMaximum: 460,
    envMapIntensity: 1.25
  })
  m.userData.uBow = { value: 0 }
  m.userData.uStrength = { value: 1 }
  // Stock thin-film gives a wash of colour, not the bow-tie of light a real
  // disc throws. Add that as an explicit term, locked to the viewing angle so
  // it stays still in the world while the disc spins beneath it.
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uBow = m.userData.uBow
    shader.uniforms.uStrength = m.userData.uStrength
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vDiscPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvDiscPos = position;')
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec3 vDiscPos;\nuniform float uBow;\nuniform float uStrength;'
      )
      .replace(
        '#include <opaque_fragment>',
        `
        {
          float r = length(vDiscPos.xz);
          float a = atan(vDiscPos.z, vDiscPos.x);
          float wedge = pow(abs(cos(a - uBow)), 22.0);
          float soft = pow(abs(cos(a - uBow)), 4.0) * 0.16;
          float hue = r * 2.4 + (a - uBow) * 0.22;
          vec3 spectrum = 0.5 + 0.5 * cos(6.28318 * (hue + vec3(0.0, 0.33, 0.67)));
          float band = smoothstep(0.1, 0.2, r);
          // Hairline pressing rings at the lead-in and the outer edge.
          float ring = smoothstep(0.004, 0.0, abs(r - 0.205)) * 0.35 + smoothstep(0.003, 0.0, abs(r - 0.655)) * 0.2;
          outgoingLight += (spectrum * (wedge * 0.85 + soft) + ring) * band * uStrength;
        }
        #include <opaque_fragment>`
      )
  }
  m.customProgramCacheKey = () => 'disc-bow-v1'
  return m
}

/**
 * @param label {title, sub, colors, image}
 */
export function createDisc(label) {
  if (!sharedGeo.body) {
    sharedGeo.body = discGeometry()
    sharedGeo.label = new THREE.RingGeometry(0.22, DISC_R - 0.1, 128, 1)
    sharedGeo.label.rotateX(-Math.PI / 2)
    sharedGeo.hubRing = new THREE.RingGeometry(HOLE_R + 0.002, 0.2, 96, 1)
    sharedGeo.hubRing.rotateX(-Math.PI / 2)
  }
  const root = new THREE.Group() // position + tilt live here
  const spin = new THREE.Group() // spinning lives here, so the bow-tie can stay put
  root.add(spin)

  const mat = discMaterial()
  const body = new THREE.Mesh(sharedGeo.body, mat)
  body.castShadow = true
  spin.add(body)

  const labelTex = discLabel(label)
  const labelMesh = new THREE.Mesh(
    sharedGeo.label,
    new THREE.MeshPhysicalMaterial({
      map: labelTex,
      roughness: 0.42,
      clearcoat: 0.7,
      clearcoatRoughness: 0.2,
      polygonOffset: true,
      polygonOffsetFactor: -2
    })
  )
  // RingGeometry UVs are planar across the outer radius; the label maps cleanly.
  labelMesh.position.y = DISC_T / 2 + 0.0015
  spin.add(labelMesh)

  const hub = new THREE.Mesh(
    sharedGeo.hubRing,
    new THREE.MeshPhysicalMaterial({
      color: 0xe6e9f5,
      roughness: 0.3,
      transmission: 0,
      transparent: true,
      opacity: 0.55
    })
  )
  hub.position.y = DISC_T / 2 + 0.001
  spin.add(hub)

  const local = new THREE.Vector3()
  return {
    root,
    spin,
    hit: body,
    material: mat,
    /** Keep the light wedge fixed against the camera while the disc spins. */
    update(camera) {
      local.copy(camera.position)
      spin.worldToLocal(local)
      mat.userData.uBow.value = Math.atan2(local.z, local.x) + 0.55
    }
  }
}
