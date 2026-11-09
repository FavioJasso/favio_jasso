import * as THREE from 'three'
import { Reflector } from 'three/addons/objects/Reflector.js'
import { radialTexture } from './textures.js'

/** Studio built from glowing panels and baked once. No HDRI file is needed. */
export function bakeStudio(renderer) {
  const env = new THREE.Scene()
  env.background = new THREE.Color(0x05041a)
  const panel = (w, h, pos, color, power) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(color).multiplyScalar(power),
        side: THREE.DoubleSide,
        toneMapped: false
      })
    )
    m.position.set(...pos)
    m.lookAt(0, 0, 0)
    env.add(m)
  }
  panel(14, 6, [0, 12, 1], 0xeef0ff, 4.2) // overhead softbox: the long clean streak
  panel(3, 12, [-13, 3, 3], 0xdfe4ff, 9) // left strip
  panel(1.5, 12, [11, 3, 7], 0xffffff, 5) // right kicker
  panel(8, 8, [11, 4, -9], 0x7a5cff, 5) // violet rim
  panel(6, 1.6, [-8, 0.6, -13], 0xff8800, 2.2) // orange back glow
  panel(16, 8, [0, -9, 0], 0x1a1050, 1) // floor bounce
  panel(6, 2, [2, 2, 14], 0xffffff, 1.6) // low front fill

  const pm = new THREE.PMREMGenerator(renderer)
  const rt = pm.fromScene(env, 0.025)
  pm.dispose()
  env.traverse((o) => {
    if (o.isMesh) {
      o.geometry.dispose()
      o.material.dispose()
    }
  })
  return rt.texture
}

const FloorShader = {
  name: 'StageFloor',
  uniforms: {
    color: { value: null },
    tDiffuse: { value: null },
    textureMatrix: { value: null },
    uReflect: { value: 0.55 }
  },
  vertexShader: /* glsl */ `
    uniform mat4 textureMatrix;
    varying vec4 vUvP;
    varying vec3 vW;
    void main() {
      vUvP = textureMatrix * vec4(position, 1.0);
      vec4 w = modelMatrix * vec4(position, 1.0);
      vW = w.xyz;
      gl_Position = projectionMatrix * viewMatrix * w;
    }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uReflect;
    varying vec4 vUvP;
    varying vec3 vW;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec2 uv = vUvP.xy / vUvP.w;
      float d = length(vW.xz);
      // Blur widens away from the console, like a glossy but imperfect floor.
      float radius = 0.0016 + 0.0034 * smoothstep(1.0, 8.0, d);
      float n = hash(gl_FragCoord.xy) * 6.283;
      vec3 sum = vec3(0.0);
      for (int i = 0; i < 8; i++) {
        float a = n + float(i) * 2.399963;
        float r = sqrt(float(i) + 0.5) / 2.83 * radius;
        sum += texture2D(tDiffuse, uv + vec2(cos(a), sin(a) * 1.8) * r).rgb;
      }
      vec3 refl = sum / 8.0;
      vec3 V = normalize(cameraPosition - vW);
      float fres = 0.32 + 0.68 * pow(1.0 - clamp(V.y, 0.0, 1.0), 3.0);

      // Light pool under the console that falls off into the dark stage.
      float pool = exp(-d * d * 0.028);
      vec3 base = mix(vec3(0.0035, 0.003, 0.016), vec3(0.03, 0.024, 0.115), pool);
      vec3 col = base + refl * uReflect * fres * smoothstep(17.0, 2.0, d);
      // Dissolve into the background so the stage has no visible horizon.
      col = mix(col, vec3(0.0006, 0.0003, 0.0027), smoothstep(9.0, 24.0, d));
      gl_FragColor = vec4(col, 1.0);
    }`
}

export function createStage(scene, { tier = 'high' } = {}) {
  const group = new THREE.Group()
  scene.add(group)

  let floor
  if (tier === 'low') {
    floor = new THREE.Mesh(
      new THREE.CircleGeometry(40, 48),
      new THREE.MeshStandardMaterial({ color: 0x07051f, roughness: 0.32 })
    )
  } else {
    const res = tier === 'high' ? 768 : 512
    floor = new Reflector(new THREE.CircleGeometry(40, 48), {
      textureWidth: res,
      textureHeight: res,
      clipBias: 0.002,
      multisample: 0, // The floor shader blurs this anyway, so MSAA would be wasted.
      shader: FloorShader
    })
  }
  floor.rotation.x = -Math.PI / 2
  group.add(floor)

  // Painted contact shadow. Without grounding the console floats, however good
  // its shading is. Lives on layer 1 so the mirror pass does not see it.
  const contact = new THREE.Mesh(
    new THREE.PlaneGeometry(5.6, 5.6),
    new THREE.MeshBasicMaterial({
      map: radialTexture([
        [0, 'rgba(0,0,0,0.96)'],
        [0.44, 'rgba(0,0,0,0.88)'],
        [0.62, 'rgba(0,0,0,0.42)'],
        [1, 'rgba(0,0,0,0)']
      ]),
      transparent: true,
      depthWrite: false,
      toneMapped: false
    })
  )
  contact.rotation.x = -Math.PI / 2
  contact.position.y = 0.004
  contact.layers.set(1)
  group.add(contact)

  const shadowCatcher = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.ShadowMaterial({ opacity: 0.45 })
  )
  shadowCatcher.rotation.x = -Math.PI / 2
  shadowCatcher.position.y = 0.006
  shadowCatcher.receiveShadow = true
  shadowCatcher.layers.set(1)
  group.add(shadowCatcher)

  // Lights: one shadow-casting key, plus coloured rims that separate the shell
  // from the dark background and tie it to the site's palette.
  const key = new THREE.SpotLight(0xfff2e4, 95, 30, 0.5, 0.75, 1.6)
  key.position.set(-5, 10, 6)
  key.target.position.set(0, 1, 0)
  key.castShadow = tier !== 'low'
  key.shadow.mapSize.set(tier === 'high' ? 2048 : 1024, tier === 'high' ? 2048 : 1024)
  key.shadow.bias = -0.0002
  key.shadow.normalBias = 0.02
  key.shadow.radius = 6
  group.add(key, key.target)

  const rimViolet = new THREE.PointLight(0x7a5cff, 42, 22, 1.7)
  rimViolet.position.set(5.5, 4.2, -4.6)
  const rimOrange = new THREE.PointLight(0xff8800, 20, 18, 1.7)
  rimOrange.position.set(-5.5, 1.3, -3.6)
  group.add(rimViolet, rimOrange)

  return { group, floor, contact, key, rimViolet, rimOrange }
}
