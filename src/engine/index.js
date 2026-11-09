import * as THREE from 'three'
import gsap from 'gsap'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import {
  EffectComposer,
  RenderPass,
  EffectPass,
  BloomEffect,
  VignetteEffect,
  NoiseEffect,
  ChromaticAberrationEffect,
  ToneMappingEffect,
  ToneMappingMode,
  BlendFunction,
  SMAAEffect,
  SMAAPreset
} from 'postprocessing'
import { createConsole } from './console.js'
import { createDisc } from './disc.js'
import { createBlocks } from './blocks.js'
import { bakeStudio, createStage } from './stage.js'
import { damp, wobble, spring } from './spring.js'
import { FrameMonitor, TIERS } from './quality.js'
import { iconTile } from './textures.js'
import { audio } from './audio.js'
import { projects, skills as skillData } from '../data/content.js'

const SCULPT_Y = 3.72
const SCULPT_SCALE = 0.72

/** Camera framings per moment. The subject moves on screen to make room for UI. */
function poseFor(name, aspect) {
  const portrait = aspect < 1.15
  const P = (px, py, pz, lx, ly, lz) => ({ pos: new THREE.Vector3(px, py, pz), look: new THREE.Vector3(lx, ly, lz) })
  if (portrait) {
    // Narrower phones need more distance to keep the same subject in frame.
    const f = Math.min(1.5, Math.max(0.8, 0.5 / aspect))
    const far = (p) => {
      p.pos.sub(p.look).multiplyScalar(f).add(p.look)
      return p
    }
    switch (name) {
      case 'stage':
        return far(P(3.8, 4.3, 14.6, 0.3, 0.1, 0))
      case 'dive':
        return P(0, 6.2, 1.4, 0, 1.7, 0)
      case 'logo':
        return far(P(0, 3.2, 14.5, 0, 3.0, 0))
      case 'menu':
        // Sculpture and console share the top half; the list takes the bottom.
        return far(P(0.6, 3.2, 21, 0, -0.35, 0))
      default:
        // The sheet covers the lower 58%; frame the prop in the window above it.
        return far(P(0.3, 3.6, 15, 0, 1.3, 0))
    }
  }
  switch (name) {
    case 'stage':
      return P(3.7, 3.4, 8.9, -1.12, 1.36, 0)
    case 'dive':
      return P(0, 5.2, 1.2, 0, 1.7, 0)
    case 'logo':
      return P(0, 3.2, 10.5, 0, 3.2, 0)
    case 'menu':
      return P(-1.3, 3.2, 13.2, -2.55, 2.5, 0)
    default:
      // A section is open: the subject sits left, the panel takes the right.
      return P(0.4, 3.1, 13.4, 1.25, 2.55, 0)
  }
}

export class Engine {
  constructor(canvas, { tier, reduced, fadeEl, onEvent }) {
    this.canvas = canvas
    this.tier = tier
    this.reduced = reduced
    this.fadeEl = fadeEl
    this.emit = onEvent || (() => {})
    this.settings = TIERS[tier]
    this.mode = 'stage'
    this.section = null
    this.time = 0
    this.disposed = false
    this.timeline = null
    this.zHeld = false
    this.pointerNdc = new THREE.Vector2(0, 0)
    this.parallax = { x: spring(), y: spring() }
    this.camPos = { x: spring(), y: spring(), z: spring() }
    this.camLook = { x: spring(), y: spring(), z: spring() }
    this.camHalf = 0.42
    this.lid = spring(1)
    this.lidTarget = 1
    this.spinSpeed = 0.35
    this.spinTarget = 0.35
    this.heroHome = new THREE.Vector3(2.3, 1.14, 0.75)
    this.hero = {
      x: spring(this.heroHome.x),
      y: spring(this.heroHome.y),
      z: spring(this.heroHome.z),
      tilt: spring(0.9),
      seated: false,
      inFlight: false,
      dragging: false,
      target: this.heroHome.clone()
    }
    this.yaw = spring(0)
    this.yawDrag = null
    this.raycaster = new THREE.Raycaster()
    this.dragPlane = new THREE.Plane()
    this.tmp = new THREE.Vector3()
    this.tmp2 = new THREE.Vector3()
    this.bindHandlers()
  }

  /** Build everything. Throws if WebGL can't start, and the app falls back. */
  init() {
    const { canvas, settings } = this
    const renderer = new THREE.WebGLRenderer({
      canvas,
      powerPreference: 'high-performance',
      antialias: false,
      stencil: false,
      depth: false,
      alpha: false
    })
    this.renderer = renderer
    renderer.toneMapping = THREE.NoToneMapping
    renderer.shadowMap.enabled = this.tier !== 'low'
    renderer.shadowMap.type = THREE.PCFShadowMap
    this.maxDpr = Math.min(settings.dpr, window.devicePixelRatio || 1)
    renderer.setPixelRatio(this.maxDpr)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x020109)
    scene.environment = bakeStudio(renderer)
    scene.environmentIntensity = 0.82
    this.scene = scene

    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 80)
    this.camera.layers.enable(1)

    this.stage = createStage(scene, { tier: this.tier })
    this.console = createConsole({ tier: this.tier })
    scene.add(this.console.root)
    this.console.setLid(1)

    this.heroDisc = createDisc({
      title: 'Favio Jasso',
      sub: 'The Portfolio Disc',
      colors: ['#ff8800', '#ff5f6d', '#4a3ce0'],
      image: null
    })
    scene.add(this.heroDisc.root)

    this.blocks = createBlocks({ count: settings.blocks, reduced: this.reduced })
    this.blocks.root.position.set(0, SCULPT_Y, 0)
    this.blocks.root.scale.setScalar(SCULPT_SCALE)
    this.blocks.setShape('none', { stagger: 0 })
    this.blocks.snap()
    this.blocks.onLand.fn = (n) => {
      if (this.mode === 'boot') audio.blockTicks(n)
    }
    scene.add(this.blocks.root)

    this.buildProjectDiscs()
    this.buildSkillCubes()

    // Post stack. Tone mapping is the last effect so bloom sees unclamped HDR.
    // No MSAA here: multisampling a half-float buffer measured 3 fps against
    // 57 fps without it on an Apple M4. SMAA runs after tone mapping instead.
    const composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType })
    composer.addPass(new RenderPass(scene, this.camera))
    this.bloom = new BloomEffect({
      intensity: 0.62,
      luminanceThreshold: 0.82,
      luminanceSmoothing: 0.3,
      mipmapBlur: true,
      radius: 0.72
    })
    const effects = [this.bloom]
    if (settings.aberration) {
      effects.push(
        new ChromaticAberrationEffect({
          offset: new THREE.Vector2(0.00055, 0.00035),
          radialModulation: true,
          modulationOffset: 0.35
        })
      )
    }
    effects.push(new VignetteEffect({ offset: 0.3, darkness: 0.62 }))
    if (settings.grain) {
      const noise = new NoiseEffect({ blendFunction: BlendFunction.SOFT_LIGHT, premultiply: false })
      noise.blendMode.opacity.value = 0.14
      effects.push(noise)
    }
    // Khronos Neutral holds hue and saturation, so the indigo stays indigo.
    effects.push(new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }))
    composer.addPass(new EffectPass(this.camera, ...effects))
    if (settings.smaa) {
      const smaa = new EffectPass(this.camera, new SMAAEffect({ preset: SMAAPreset.HIGH }))
      smaa.dithering = true
      composer.addPass(smaa)
    }
    this.composer = composer

    this.resize()
    this.placeHeroHome()
    this.applyPose('stage', true)

    this.monitor = new FrameMonitor({
      start: this.maxDpr,
      max: this.maxDpr,
      onChange: (dpr) => {
        renderer.setPixelRatio(dpr)
        this.resize()
      }
    })

    // Compile up front so the first frame of the experience doesn't hitch.
    renderer.compile(scene, this.camera)
    this.heroDisc.root.position.copy(this.heroHome)

    canvas.addEventListener('webglcontextlost', this.onContextLost)
    window.addEventListener('resize', this.resize)
    window.addEventListener('pointermove', this.onPointerMove, { passive: true })
    canvas.addEventListener('pointerdown', this.onPointerDown)
    window.addEventListener('pointerup', this.onPointerUp)
    window.addEventListener('pointercancel', this.onPointerUp)
    document.addEventListener('visibilitychange', this.onVisibility)
    // Audio runs on a real clock, so the timeline must too. GSAP's default lag
    // smoothing would stretch the boot on slow machines and desync the chime.
    gsap.ticker.lagSmoothing(0)
    gsap.ticker.add(this.tick)
    if (import.meta.env.DEV) Object.assign(window, { __engine: this, __gsap: gsap })
  }

  bindHandlers() {
    this.tick = this.tick.bind(this)
    this.resize = this.resize.bind(this)
    this.onPointerMove = this.onPointerMove.bind(this)
    this.onPointerDown = this.onPointerDown.bind(this)
    this.onPointerUp = this.onPointerUp.bind(this)
    this.onVisibility = () => this.monitor?.hold()
    this.onContextLost = (e) => {
      e.preventDefault()
      this.emit('failed', { reason: 'context-lost' })
    }
  }

  buildProjectDiscs() {
    this.discGroup = new THREE.Group()
    this.discGroup.position.set(0, SCULPT_Y - 0.25, 0)
    this.discGroup.visible = false
    this.scene.add(this.discGroup)
    this.projectDiscs = projects.map((p) => {
      const d = createDisc({ title: p.title, sub: p.role, colors: p.colors, image: p.image })
      d.root.scale.setScalar(0.95)
      this.discGroup.add(d.root)
      return {
        ...d,
        spinV: 0.5,
        x: spring(0),
        y: spring(-4),
        z: spring(0),
        s: spring(0.2),
        tiltX: spring(1.2),
        tiltZ: spring(0),
        drag: 0
      }
    })
    this.selectedDisc = 0
    this.draggingDisc = null
  }

  buildSkillCubes() {
    this.skillGroup = new THREE.Group()
    this.skillGroup.position.set(0, SCULPT_Y - 0.4, 0)
    this.skillGroup.visible = false
    this.scene.add(this.skillGroup)
    const geo = new RoundedBoxGeometry(0.62, 0.62, 0.62, 3, 0.07)
    const cols = 5
    this.skillCubes = skillData.map((s, i) => {
      const mat = new THREE.MeshPhysicalMaterial({
        map: iconTile(s.icon, s.color),
        roughness: 0.34,
        clearcoat: 0.8,
        clearcoatRoughness: 0.15
      })
      const m = new THREE.Mesh(geo, mat)
      m.castShadow = true
      const row = Math.floor(i / cols)
      const home = new THREE.Vector3((i % cols) * 0.78 - 1.56, (1 - row) * 0.78, 0)
      m.position.set(home.x, home.y - 5, home.z)
      m.userData.index = i
      this.skillGroup.add(m)
      return {
        mesh: m,
        home,
        y: spring(home.y - 5),
        z: spring(0),
        rx: spring(0),
        ry: spring(0),
        hover: 0,
        kick: 0
      }
    })
    this.hoverSkill = -1
    this.focusSkill = -1
  }

  // ---------------------------------------------------------------------
  // Framing
  // ---------------------------------------------------------------------

  resize() {
    const w = window.innerWidth
    const h = window.innerHeight
    if (!this.renderer) return
    this.renderer.setSize(w, h, false)
    this.composer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    if (this.poseName) {
      if (this.mode === 'stage') this.placeHeroHome()
      this.applyPose(this.poseName)
    }
  }

  /** The disc waits beside the console, or in front of it on a narrow screen. */
  placeHeroHome() {
    if (this.camera.aspect < 1.15) this.heroHome.set(1.05, 0.62, 2.6)
    else this.heroHome.set(2.3, 1.14, 0.75)
    if (!this.hero.seated && !this.hero.inFlight && !this.hero.dragging) {
      this.hero.target.copy(this.heroHome)
      this.hero.x.x = this.heroHome.x
      this.hero.y.x = this.heroHome.y
      this.hero.z.x = this.heroHome.z
    }
  }

  applyPose(name, instant = false) {
    this.poseName = name
    const pose = poseFor(name, this.camera.aspect)
    this.poseTarget = pose
    if (instant || this.reduced) {
      this.camPos.x.x = pose.pos.x
      this.camPos.y.x = pose.pos.y
      this.camPos.z.x = pose.pos.z
      this.camLook.x.x = pose.look.x
      this.camLook.y.x = pose.look.y
      this.camLook.z.x = pose.look.z
      for (const s of [this.camPos.x, this.camPos.y, this.camPos.z, this.camLook.x, this.camLook.y, this.camLook.z]) s.v = 0
    }
  }

  fade(to, duration) {
    if (!this.fadeEl) return
    if (this.reduced || duration === 0) {
      this.fadeEl.style.opacity = to
      return
    }
    gsap.to(this.fadeEl, { opacity: to, duration, ease: 'power2.inOut', overwrite: true })
  }

  setLights(level, duration = 0) {
    const s = this.stage
    const apply = { env: 0.82 * level, key: 95 * level, violet: 42 * level, orange: 20 * level }
    if (duration === 0 || this.reduced) {
      this.scene.environmentIntensity = apply.env
      s.key.intensity = apply.key
      s.rimViolet.intensity = apply.violet
      s.rimOrange.intensity = apply.orange
      return
    }
    gsap.to(this.scene, { environmentIntensity: apply.env, duration })
    gsap.to(s.key, { intensity: apply.key, duration })
    gsap.to(s.rimViolet, { intensity: apply.violet, duration })
    gsap.to(s.rimOrange, { intensity: apply.orange, duration })
  }

  // ---------------------------------------------------------------------
  // The story: stage -> boot -> title/menu -> sections
  // ---------------------------------------------------------------------

  /** The opening shot: lid up, disc waiting. */
  toStage() {
    this.killTimeline()
    this.mode = 'stage'
    this.section = null
    this.console.root.visible = true
    this.heroDisc.root.visible = true
    this.hero.seated = false
    this.hero.inFlight = false
    this.hero.target.copy(this.heroHome)
    this.lidTarget = 1
    this.spinTarget = 0.35
    this.console.led.emissiveIntensity = 0.25
    this.console.ring.emissiveIntensity = 0.9
    this.blocks.root.position.y = SCULPT_Y
    this.blocks.root.scale.setScalar(SCULPT_SCALE)
    this.blocks.setShape('none', { stagger: 0.2 })
    this.hideSectionProps()
    this.setLights(1, 0)
    this.fade(0, 0.6)
    this.applyPose('stage')
    audio.padStop()
    audio.whirStop()
  }

  killTimeline() {
    if (this.timeline) {
      this.timeline.kill()
      this.timeline = null
    }
  }

  /** Insert path: the disc is pulled into the machine, then shared boot. */
  insertDisc() {
    if (this.mode !== 'stage') return
    this.mode = 'boot'
    this.bootHasDisc = true
    this.emit('boot-start', { disc: true })
    if (this.reduced) return this.finishBoot()
    this.hero.inFlight = true
    this.hero.dragging = false
    const H = this.console.height
    const seatY = H - 0.06
    const tl = gsap.timeline()
    this.timeline = tl
    const t = this.hero.target
    // Up first, then across, so the disc clears the corner of the console.
    tl.to(t, { y: H + 1.0, duration: 0.3, ease: 'power2.out' })
    tl.to(t, { x: 0, z: 0, duration: 0.5, ease: 'power2.inOut' }, 0.12)
    tl.to(t, { y: seatY, duration: 0.3, ease: 'power2.in' }, '>-0.02')
    tl.call(() => {
      audio.discSeat()
      this.hero.seated = true
      this.spinTarget = 1
    })
    tl.call(() => {
      this.lidTarget = 0
      audio.lidClose()
    }, null, '+=0.18')
    this.appendBoot(tl, '+=0.32')
  }

  /** No-disc path: press power with the lid shut. Same boot, different ending. */
  powerOn() {
    if (this.mode !== 'stage') return
    this.mode = 'boot'
    this.bootHasDisc = false
    this.emit('boot-start', { disc: false })
    if (this.reduced) return this.finishBoot()
    audio.button()
    const tl = gsap.timeline()
    this.timeline = tl
    if (this.lidTarget !== 0) {
      tl.call(() => {
        this.lidTarget = 0
        audio.lidClose()
      }, null, 0.05)
    }
    this.appendBoot(tl, '+=0.34')
  }

  appendBoot(tl, at) {
    tl.call(() => {
      this.console.led.emissiveIntensity = 4
      gsap.to(this.console.ring, { emissiveIntensity: 3.2, duration: 0.5 })
      this.spinTarget = this.hero.seated ? 18 : 0
      audio.whirStart()
      this.camHalf = 0.34
      this.applyPose('dive')
    }, null, at)
    tl.call(() => this.fade(1, 0.55), null, '+=0.95')
    tl.call(() => {
      audio.whirStop()
      this.console.root.visible = false
      this.heroDisc.root.visible = false
      this.setLights(0.34, 0)
      this.camHalf = 0.42
      this.applyPose('logo', true)
      this.blocks.root.position.y = 3.2
      this.blocks.root.scale.setScalar(1)
      this.blocks.setShape('monogram', { drop: true, stagger: 0.75, freq: 1.5, damping: 0.5 })
    }, null, '+=0.62')
    tl.call(() => this.fade(0, 0.3), null, '+=0.1')
    tl.call(() => {
      audio.chime(this.zHeld)
      this.bloom.intensity = 1.5
      gsap.to(this.bloom, { intensity: 0.62, duration: 1.6, ease: 'power2.out' })
      this.setLights(1, 1.0)
      this.emit('boot-logo')
    }, null, '+=1.05')
    tl.call(() => this.finishBoot(), null, '+=1.9')
  }

  /** Reachable from the timeline or from Skip, so it must be idempotent. */
  finishBoot() {
    this.killTimeline()
    audio.whirStop()
    gsap.killTweensOf(this.fadeEl)
    this.fade(0, this.reduced ? 0 : 0.35)
    this.console.root.visible = true
    this.heroDisc.root.visible = !!this.bootHasDisc
    this.hero.seated = !!this.bootHasDisc
    this.hero.inFlight = !!this.bootHasDisc
    const seatY = this.console.height - 0.06
    if (this.bootHasDisc) {
      this.hero.target.set(0, seatY, 0)
      this.hero.x.x = 0
      this.hero.y.x = seatY
      this.hero.z.x = 0
      this.spinTarget = 8
    }
    this.lidTarget = 0
    this.lid.x = 0
    this.lid.v = 0
    this.console.led.emissiveIntensity = 4
    this.console.ring.emissiveIntensity = 1.7
    this.setLights(1, 0)
    this.bloom.intensity = 0.62
    audio.padStart()
    this.mode = this.bootHasDisc ? 'title' : 'menu'
    if (this.bootHasDisc) {
      this.toTitle()
    } else {
      this.toMenu()
    }
    this.emit('boot-end', { disc: !!this.bootHasDisc })
  }

  /** Disc path's reward: the "game" title screen with the monogram standing tall. */
  toTitle() {
    this.mode = 'title'
    this.blocks.root.position.y = SCULPT_Y
    this.moveBlocksTo(SCULPT_Y, SCULPT_SCALE)
    this.blocks.setShape('monogram', { stagger: 0.1 })
    this.applyPose('menu')
  }

  toMenu(shape = 'profile') {
    this.mode = 'menu'
    this.section = null
    this.hideSectionProps()
    this.moveBlocksTo(SCULPT_Y, SCULPT_SCALE)
    this.blocks.setShape(shape, { stagger: 0.35 })
    this.applyPose('menu')
  }

  /** Go straight to a deep link, without any boot. */
  jumpTo(sectionId, hasDisc = true, shape = 'profile') {
    this.killTimeline()
    this.bootHasDisc = hasDisc
    this.finishBootQuiet()
    if (sectionId) this.openSection(sectionId, shape, true)
    else this.toMenu(shape)
    if (sectionId || this.reduced) this.blocks.snap()
  }

  finishBootQuiet() {
    this.console.root.visible = true
    this.heroDisc.root.visible = !!this.bootHasDisc
    this.hero.seated = !!this.bootHasDisc
    this.hero.inFlight = !!this.bootHasDisc
    if (this.bootHasDisc) {
      const seatY = this.console.height - 0.06
      this.hero.target.set(0, seatY, 0)
      this.hero.x.x = 0
      this.hero.y.x = seatY
      this.hero.z.x = 0
      this.spinTarget = 8
    }
    this.lid.x = 0
    this.lidTarget = 0
    this.console.led.emissiveIntensity = 4
    this.console.ring.emissiveIntensity = 1.7
    this.setLights(1, 0)
    this.fade(0, 0)
  }

  moveBlocksTo(y, scale) {
    if (this.reduced) {
      this.blocks.root.position.y = y
      this.blocks.root.scale.setScalar(scale)
      return
    }
    gsap.to(this.blocks.root.position, { y, duration: 0.9, ease: 'power3.inOut' })
    gsap.to(this.blocks.root.scale, { x: scale, y: scale, z: scale, duration: 0.9, ease: 'power3.inOut' })
  }

  /** Menu cursor moved: the sculpture re-forms into that item's icon. */
  previewShape(shape) {
    if (this.mode !== 'menu') return
    this.blocks.setShape(shape, { stagger: 0.28 })
  }

  hideSectionProps() {
    this.discGroupOn = false
    this.skillGroupOn = false
  }

  openSection(id, shape, instant = false) {
    this.mode = 'section'
    this.section = id
    this.discGroupOn = id === 'discs'
    this.skillGroupOn = id === 'skills'
    if (this.discGroupOn) this.discGroup.visible = true
    if (this.skillGroupOn) this.skillGroup.visible = true
    this.monitor?.hold()
    // These two replace the sculpture with real props; its blocks become dust.
    const sculpture = id === 'discs' || id === 'skills' ? 'none' : shape
    this.moveBlocksTo(SCULPT_Y, SCULPT_SCALE)
    this.blocks.setShape(sculpture, { stagger: 0.25 })
    if (!instant) this.blocks.pulse(1.8)
    this.applyPose('section', instant)
  }

  selectDisc(i) {
    this.selectedDisc = i
  }
  setFocusSkill(i) {
    this.focusSkill = i
  }

  // ---------------------------------------------------------------------
  // Pointer
  // ---------------------------------------------------------------------

  rayFrom(e) {
    const r = this.canvas.getBoundingClientRect()
    this.pointerNdc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    this.raycaster.setFromCamera(this.pointerNdc, this.camera)
    // setFromCamera copies the camera's mask; only layer 0 objects are pickable.
    this.raycaster.layers.set(0)
  }

  pick(objects) {
    return this.raycaster.intersectObjects(objects, false)[0] || null
  }

  onPointerMove(e) {
    if (!this.renderer || !(e.target === this.canvas || this.hero.dragging || this.draggingDisc || this.yawDrag !== null)) {
      if (this.blocks) this.blocks.pointer.set(1e3, 1e3, 1e3)
      if (this.hoverSkill !== -1) this.setHoverSkill(-1)
      return
    }
    this.rayFrom(e)

    if (this.hero.dragging) {
      if (this.raycaster.ray.intersectPlane(this.dragPlane, this.tmp)) {
        this.hero.target.copy(this.tmp)
        this.hero.target.y = Math.max(this.hero.target.y, 0.3)
      }
      return
    }
    if (this.yawDrag !== null) {
      this.yaw.x += (e.clientX - this.yawDrag) * 0.009
      this.yaw.v = (e.clientX - this.yawDrag) * 0.5
      this.yawDrag = e.clientX
      return
    }
    if (this.draggingDisc) {
      const d = this.draggingDisc
      const dx = e.clientX - d.lastX
      d.lastX = e.clientX
      d.disc.spinV = dx * 0.35
      return
    }

    // Blocks lean away from the pointer.
    if (this.blocks.root.scale.x > 0.01) {
      const planeZ = this.tmp2.set(0, 0, 1)
      const plane = this.dragPlane
      plane.setFromNormalAndCoplanarPoint(planeZ, this.blocks.root.position)
      if (this.raycaster.ray.intersectPlane(plane, this.tmp)) this.blocks.pointer.copy(this.tmp)
    }

    let cursor = ''
    if (this.mode === 'stage') {
      const hits = [this.heroDisc.hit, this.console.hitLid, this.console.powerBtn, ...this.console.hitBody]
      const hit = this.pick(hits)
      if (hit) cursor = hit.object === this.heroDisc.hit || this.console.hitBody.includes(hit.object) ? 'grab' : 'pointer'
    } else if (this.mode === 'section' && this.section === 'skills') {
      const hit = this.pick(this.skillCubes.map((c) => c.mesh))
      this.setHoverSkill(hit ? hit.object.userData.index : -1)
      if (hit) cursor = 'pointer'
    } else if (this.mode === 'section' && this.section === 'discs') {
      if (this.pick(this.projectDiscs.map((d) => d.hit))) cursor = 'grab'
    }
    this.canvas.style.cursor = cursor
  }

  setHoverSkill(i) {
    if (i === this.hoverSkill) return
    this.hoverSkill = i
    if (i >= 0) audio.move()
    this.emit('skill-hover', { index: i })
  }

  onPointerDown(e) {
    audio.unlock()
    this.rayFrom(e)
    this.downAt = { x: e.clientX, y: e.clientY, t: performance.now() }
    if (this.mode === 'stage') {
      if (!this.hero.seated && !this.hero.inFlight && this.pick([this.heroDisc.hit])) {
        this.hero.dragging = true
        this.canvas.setPointerCapture?.(e.pointerId)
        this.canvas.style.cursor = 'grabbing'
        // Drag on a camera-facing plane through the disc, so it tracks the hand.
        this.camera.getWorldDirection(this.tmp2).negate()
        this.dragPlane.setFromNormalAndCoplanarPoint(this.tmp2, this.heroDisc.root.position)
        audio.move()
        this.lidTarget = 1
        return
      }
      if (this.pick([this.console.powerBtn])) {
        this.powerOn()
        return
      }
      if (this.pick([this.console.hitLid])) {
        this.lidTarget = this.lidTarget > 0.5 ? 0 : 1
        if (this.lidTarget) audio.lidOpen()
        else audio.lidClose()
        return
      }
    }
    // Grab the machine and turn it; it swings back to face you on release.
    if (!this.reduced && this.console.root.visible && this.pick(this.console.hitBody)) {
      this.yawDrag = e.clientX
      this.canvas.setPointerCapture?.(e.pointerId)
      this.canvas.style.cursor = 'grabbing'
      return
    }
    if (this.mode === 'section' && this.section === 'discs') {
      const hit = this.pick(this.projectDiscs.map((d) => d.hit))
      if (hit) {
        const i = this.projectDiscs.findIndex((d) => d.hit === hit.object)
        this.draggingDisc = { disc: this.projectDiscs[i], lastX: e.clientX, index: i }
        this.canvas.setPointerCapture?.(e.pointerId)
        if (i !== this.selectedDisc) {
          this.emit('disc-select', { index: i })
        }
        audio.move()
      }
    }
    if (this.mode === 'section' && this.section === 'skills') {
      const hit = this.pick(this.skillCubes.map((c) => c.mesh))
      if (hit) {
        const c = this.skillCubes[hit.object.userData.index]
        c.ry.v += 26
        c.z.v += 5
        audio.select()
        this.emit('skill-hover', { index: hit.object.userData.index, pinned: true })
      }
    }
  }

  onPointerUp(e) {
    if (this.yawDrag !== null) {
      this.yawDrag = null
      this.canvas.style.cursor = ''
    }
    if (this.draggingDisc) this.draggingDisc = null
    if (!this.hero.dragging) return
    this.hero.dragging = false
    this.canvas.style.cursor = ''
    const moved = this.downAt ? Math.hypot(e.clientX - this.downAt.x, e.clientY - this.downAt.y) : 99
    const p = this.heroDisc.root.position
    const near = Math.hypot(p.x, p.z) < 1.25 && p.y > 0.9
    if (moved < 6 || near) {
      // A plain tap is a valid way to insert it too.
      this.emit('request-insert')
    } else {
      this.hero.target.copy(this.heroHome)
      audio.back()
    }
  }

  // ---------------------------------------------------------------------
  // Frame
  // ---------------------------------------------------------------------

  tick() {
    if (this.disposed) return
    const realDt = gsap.ticker.deltaRatio(60) / 60
    const dt = Math.min(realDt, 1 / 20)
    this.time += dt
    this.monitor.tick(realDt)

    // While a panel is open and the visitor is reading, half the frame rate
    // saves battery. Nothing there depends on being silky.
    this.frameFlip = !this.frameFlip
    const reading = this.mode === 'section' && !this.discGroupOn && !this.skillGroupOn && dt < 1 / 40
    this.updateConsole(dt)
    this.updateHero(dt)
    this.updateCamera(dt)
    this.blocks.update(dt, this.camera)
    this.updateDiscs(dt)
    this.updateSkills(dt)
    if (reading && this.frameFlip) return
    this.composer.render(dt)
  }

  updateConsole(dt) {
    wobble(this.lid, this.lidTarget, 1.6, 0.56, dt)
    if (this.yawDrag === null) {
      // Take the shortest way home, even after several full turns.
      const home = Math.round(this.yaw.x / (Math.PI * 2)) * Math.PI * 2
      wobble(this.yaw, home, 0.75, 0.42, dt)
    }
    this.console.root.rotation.y = this.yaw.x
    this.console.setLid(Math.max(0, this.lid.x))
    if (this.mode === 'stage') {
      this.console.ring.emissiveIntensity = this.reduced ? 1 : 0.8 + Math.sin(this.time * 1.5) * 0.28
    }
  }

  updateHero(dt) {
    const h = this.hero
    const { root, spin } = this.heroDisc
    const inStage = !h.seated && !h.inFlight && !h.dragging && !this.reduced
    const bobY = inStage ? Math.sin(this.time * 1.25) * 0.075 : 0
    const halflife = h.dragging ? 0.05 : h.inFlight ? 0.05 : 0.14
    root.position.set(
      damp(h.x, h.target.x, halflife, dt),
      damp(h.y, h.target.y + bobY, halflife, dt),
      damp(h.z, h.target.z, halflife, dt)
    )
    const tiltTarget = h.seated || h.inFlight ? 0 : h.dragging ? 0.4 : 0.92
    damp(h.tilt, tiltTarget, 0.13, dt)
    root.rotation.set(h.tilt.x, 0, inStage ? Math.sin(this.time * 0.8) * 0.06 - 0.2 : -h.x.v * 0.04)

    this.spinSpeed += (this.spinTarget - this.spinSpeed) * Math.min(1, dt * 1.4)
    spin.rotation.y += this.spinSpeed * dt * (this.reduced ? 0 : 1)
    this.heroDisc.update(this.camera)
  }

  updateCamera(dt) {
    const pose = this.poseTarget
    const half = this.camHalf
    const camX = damp(this.camPos.x, pose.pos.x, half, dt)
    const camY = damp(this.camPos.y, pose.pos.y, half, dt)
    const camZ = damp(this.camPos.z, pose.pos.z, half, dt)
    const lookX = damp(this.camLook.x, pose.look.x, half, dt)
    const lookY = damp(this.camLook.y, pose.look.y, half, dt)
    const lookZ = damp(this.camLook.z, pose.look.z, half, dt)

    // A tiny parallax range is what makes a held shot feel alive.
    const dragging = this.hero.dragging || this.draggingDisc
    const px = this.reduced || dragging ? 0 : this.pointerNdc.x
    const py = this.reduced || dragging ? 0 : this.pointerNdc.y
    const amount = this.poseName === 'dive' || this.poseName === 'logo' ? 0.05 : 0.34
    damp(this.parallax.x, px * amount, 0.35, dt)
    damp(this.parallax.y, py * amount * 0.5, 0.35, dt)

    this.camera.position.set(camX + this.parallax.x.x, camY + this.parallax.y.x, camZ)
    this.camera.lookAt(lookX, lookY, lookZ)
  }

  updateDiscs(dt) {
    if (!this.discGroup.visible) return
    const on = this.discGroupOn
    const sel = this.selectedDisc
    const portrait = this.camera.aspect < 1.15
    const n = this.projectDiscs.length
    let settled = !on
    this.projectDiscs.forEach((d, i) => {
      // Selected disc comes forward; the others wait behind on either side.
      const rel = ((i - sel + n + 1) % n) - 1 // -1, 0, 1
      const tx = on ? rel * (portrait ? 1.28 : 1.6) : rel * 1.2
      const ty = on ? (rel === 0 ? 0.28 : -0.42) : -5
      const tz = on ? (rel === 0 ? 1.4 : -0.7) : 0
      const ts = on ? (rel === 0 ? (portrait ? 1.4 : 1.85) : portrait ? 0.72 : 0.98) : 0.2
      d.root.position.set(damp(d.x, tx, 0.17, dt), damp(d.y, ty, 0.17, dt), damp(d.z, tz, 0.17, dt))
      d.root.scale.setScalar(damp(d.s, ts, 0.17, dt))
      const tTilt = rel === 0 ? 1.13 + this.pointerNdc.y * 0.13 : 1.2
      d.root.rotation.x = damp(d.tiltX, this.reduced ? 1.25 : tTilt, 0.2, dt)
      d.root.rotation.z = damp(d.tiltZ, rel === 0 ? -this.pointerNdc.x * 0.16 : rel * 0.26, 0.2, dt)
      if (!(this.draggingDisc && this.draggingDisc.disc === d)) {
        const idle = this.reduced ? 0 : rel === 0 ? 0.3 : 0.16
        d.spinV += (idle - d.spinV) * Math.min(1, dt * 1.6)
      }
      d.spin.rotation.y += d.spinV * dt * (this.reduced ? 0 : 1)
      d.update(this.camera)
      if (on || Math.abs(d.y.x - ty) > 0.05) settled = false
    })
    if (settled) this.discGroup.visible = false
  }

  updateSkills(dt) {
    if (!this.skillGroup.visible) return
    const on = this.skillGroupOn
    let visible = on
    this.skillGroup.scale.setScalar(this.camera.aspect < 1.15 ? 0.78 : 1)
    this.skillCubes.forEach((c, i) => {
      const hot = i === this.hoverSkill || i === this.focusSkill
      const baseY = on ? c.home.y : c.home.y - 5.5
      c.mesh.position.x = c.home.x
      c.mesh.position.y = wobble(c.y, baseY + (hot ? 0.06 : 0), 1.6, 0.6, dt)
      c.mesh.position.z = wobble(c.z, hot ? 0.34 : 0, 2.2, 0.55, dt)
      const rxT = this.reduced ? 0 : -this.pointerNdc.y * 0.3 + (hot ? -0.08 : 0)
      const ryT = this.reduced ? 0 : this.pointerNdc.x * 0.4
      c.mesh.rotation.x = damp(c.rx, rxT, 0.14, dt)
      // Kicked cubes spin freely until they find the nearest forward face.
      const nearest = Math.round(c.ry.x / (Math.PI * 2)) * Math.PI * 2 + ryT
      c.mesh.rotation.y = wobble(c.ry, nearest, 0.8, 0.45, dt)
      const scale = hot ? 1.14 : 1
      c.mesh.scale.setScalar(c.mesh.scale.x + (scale - c.mesh.scale.x) * Math.min(1, dt * 12))
      if (!on && c.y.x > -4) visible = true
    })
    this.skillGroup.visible = visible
  }

  /** Eject: from a booted machine back to the opening shot. */
  backToStage() {
    this.toStage()
  }

  dispose() {
    this.disposed = true
    gsap.ticker.remove(this.tick)
    this.killTimeline()
    window.removeEventListener('resize', this.resize)
    window.removeEventListener('pointermove', this.onPointerMove)
    window.removeEventListener('pointerup', this.onPointerUp)
    window.removeEventListener('pointercancel', this.onPointerUp)
    document.removeEventListener('visibilitychange', this.onVisibility)
    this.canvas?.removeEventListener('webglcontextlost', this.onContextLost)
    this.canvas?.removeEventListener('pointerdown', this.onPointerDown)
    audio.padStop()
    audio.whirStop()
    this.composer?.dispose()
    this.renderer?.dispose()
  }
}
