<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PlainContent from './components/PlainContent.vue'
import ContactForm from './components/ContactForm.vue'
import SectionPanel from './components/SectionPanel.vue'
import { sections, person, disclaimer, projects, skills, copyright } from './data/content.js'
import { audio } from './engine/audio.js'
import { hasWebGL, guessTier } from './engine/quality.js'

const route = useRoute()
const router = useRouter()

const SEEN_KEY = 'fj-booted'
const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)')
const forceReduced = new URLSearchParams(location.search).has('reduced')
const reduced = { matches: reducedQuery.matches || forceReduced }
const webgl = hasWebGL()

// phase: loading | stage | boot | title | menu | section | plain
const phase = ref('loading')
const loadFailed = ref(false)
const canvas = ref(null)
const fadeEl = ref(null)
const engine = shallowRef(null)
const logoVisible = ref(false)
const hasDisc = ref(false)
const cursor = ref(0)
const muted = ref(audio.muted)
const selectedDisc = ref(0)
const activeSkill = ref(-1)
const announce = ref('')
const menuButtons = ref([])
const clock = ref('')

// The router matches /Profile and /profile/ too, so compare a normalized path.
const path = computed(() => route.path.toLowerCase().replace(/\/+$/, '') || '/')
const currentSection = computed(() => sections.find((s) => s.path === path.value) || null)
const openId = computed(() => (phase.value === 'section' ? currentSection.value?.id : null))
const isPlainRoute = computed(() => path.value === '/plain')

function seen() {
  try {
    return localStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return false
  }
}
function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, '1')
  } catch {
    /* Storage blocked: the visitor just sees the opening again next time. */
  }
}

function tickClock() {
  clock.value = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}
let clockTimer = 0

let startToken = 0

async function start3D() {
  const token = ++startToken
  phase.value = 'loading'
  loadFailed.value = false
  await nextTick()
  const slow = setTimeout(() => {
    if (phase.value === 'loading') loadFailed.value = true // Offer a way out, don't strand anyone.
  }, 8000)
  try {
    const { Engine } = await import('./engine/index.js')
    if (token !== startToken) return // The visitor left for the plain version meanwhile.
    const e = new Engine(canvas.value, {
      tier: guessTier(),
      reduced: reduced.matches,
      fadeEl: fadeEl.value,
      onEvent: onEngineEvent
    })
    e.init()
    engine.value = e
    e.selectDisc(selectedDisc.value)
    clearTimeout(slow)
    enterInitialPhase()
  } catch (err) {
    clearTimeout(slow)
    if (token !== startToken) return
    console.warn('3D site unavailable, using the plain version.', err)
    usePlain()
  }
}

function enterInitialPhase() {
  const e = engine.value
  if (currentSection.value) {
    // Deep links go straight to the content.
    hasDisc.value = true
    cursor.value = sections.indexOf(currentSection.value)
    e.jumpTo(currentSection.value.id, true, currentSection.value.shape)
    phase.value = 'section'
    return
  }
  if (reduced.matches) {
    hasDisc.value = true
    e.jumpTo(null, true, sections[0].shape)
    phase.value = 'menu'
    nextTick(focusCursor)
    return
  }
  e.toStage()
  phase.value = 'stage'
}

function usePlain() {
  startToken++
  engine.value?.dispose()
  engine.value = null
  logoVisible.value = false
  phase.value = 'plain'
  if (!isPlainRoute.value) router.replace('/plain')
  announce.value = 'Plain version of the portfolio.'
  nextTick(() => document.querySelector('.plain h1')?.focus({ preventScroll: true }))
}

function onEngineEvent(name, data = {}) {
  switch (name) {
    case 'boot-start':
      hasDisc.value = data.disc
      phase.value = 'boot'
      announce.value = 'Booting. Press Skip to go straight in.'
      nextTick(() => document.querySelector('.skip')?.focus({ preventScroll: true }))
      break
    case 'boot-logo':
      logoVisible.value = true
      break
    case 'boot-end':
      logoVisible.value = false
      markSeen()
      hasDisc.value = data.disc
      phase.value = data.disc ? 'title' : 'menu'
      if (!data.disc) engine.value?.previewShape(sections[cursor.value].shape || 'discs')
      nextTick(() => (data.disc ? document.querySelector('.start')?.focus() : focusCursor()))
      announce.value = data.disc ? 'Title screen. Press start.' : 'System menu.'
      break
    case 'request-insert':
      insertDisc()
      break
    case 'disc-select':
      selectDisc(data.index)
      break
    case 'skill-hover':
      activeSkill.value = data.index
      break
    case 'failed':
      usePlain()
      break
  }
}

// --- Actions ---------------------------------------------------------------

function unlock() {
  audio.unlock()
  // Deep links arrive without the boot that normally starts the ambient bed.
  if (phase.value === 'menu' || phase.value === 'section') audio.padStart()
}

function insertDisc() {
  unlock()
  audio.lidOpen()
  engine.value?.insertDisc()
}
function powerOn() {
  unlock()
  engine.value?.powerOn()
}
function skipBoot() {
  unlock()
  const e = engine.value
  if (!e) return
  if (phase.value === 'stage') {
    // Skipping from the opening shot goes straight to the menu, as it promises.
    hasDisc.value = true
    e.jumpTo(null, true, sections[cursor.value].shape || 'discs')
    phase.value = 'menu'
    markSeen()
    announce.value = 'System menu.'
    audio.padStart()
    nextTick(focusCursor)
    return
  }
  e.mode = 'boot'
  e.finishBoot()
}
function pressStart() {
  unlock()
  audio.select()
  engine.value?.blocks.pulse(3)
  phase.value = 'menu'
  engine.value?.toMenu(sections[cursor.value].shape || 'discs')
  nextTick(focusCursor)
}
function moveCursor(i) {
  const n = sections.length
  const next = (i + n) % n
  if (next === cursor.value) return
  cursor.value = next
  audio.move()
  engine.value?.previewShape(sections[next].shape || 'discs')
  focusCursor()
}
function hoverCursor(i) {
  if (i === cursor.value) return
  cursor.value = i
  audio.move()
  engine.value?.previewShape(sections[i].shape || 'discs')
}
function focusCursor() {
  menuButtons.value[cursor.value]?.focus({ preventScroll: true })
}
function openSection(s) {
  unlock()
  audio.select()
  router.push(s.path)
}
function closeSection() {
  audio.back()
  router.push('/')
}
function ejectToStage() {
  audio.lidOpen()
  hasDisc.value = false
  router.push('/')
  engine.value?.toStage()
  phase.value = 'stage'
  announce.value = 'Back at the console. The disc is out.'
  nextTick(() => document.querySelector('.stage-title')?.focus({ preventScroll: true }))
}
function toggleMute() {
  unlock()
  muted.value = !muted.value
  audio.setMuted(muted.value)
  if (!muted.value) audio.select()
}
function selectDisc(i) {
  selectedDisc.value = i
  engine.value?.selectDisc(i)
  audio.move()
  announce.value = `${projects[i].title} selected.`
}
function focusSkill(i) {
  activeSkill.value = i
  engine.value?.setFocusSkill(i)
}
function kickSkill(i) {
  engine.value?.kickSkill(i)
  audio.select()
}
function plainVersion() {
  usePlain()
}
function enterFromPlain() {
  router.push('/').then(start3D)
}

// Route is the source of truth for which section is open, so Back/Forward work.
watch(path, (to) => {
  if (to === '/plain') {
    if (phase.value !== 'plain') usePlain()
    return
  }
  if (phase.value === 'plain') {
    if (webgl) start3D() // Back or Forward out of the plain version.
    return
  }
  const e = engine.value
  if (!e) return
  const s = sections.find((x) => x.path === to)
  if (s) {
    cursor.value = sections.indexOf(s)
    if (['menu', 'title', 'section', 'stage', 'boot'].includes(phase.value)) {
      if (phase.value === 'stage' || phase.value === 'boot') {
        // Arriving by history jumps past the boot, disc in.
        logoVisible.value = false
        hasDisc.value = true
        e.jumpTo(null, true, s.shape || 'discs')
        audio.padStart()
      }
      e.openSection(s.id, s.shape)
      phase.value = 'section'
    }
  } else if (to === '/' && phase.value === 'section') {
    e.toMenu(sections[cursor.value].shape || 'discs')
    phase.value = 'menu'
    nextTick(focusCursor)
  }
})

reducedQuery.addEventListener('change', (e) => {
  reduced.matches = e.matches || forceReduced
  engine.value?.setReduced(reduced.matches)
})

// --- Keyboard and gamepad: one input path ----------------------------------

function typing(el) {
  return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
}

/** Returns true only when the action did something, so other keys keep their default. */
function press(action) {
  switch (phase.value) {
    case 'stage':
      if (action === 'a') insertDisc()
      else if (action === 'start') powerOn()
      else return false
      return true
    case 'boot':
      if (action !== 'a' && action !== 'start' && action !== 'b') return false
      skipBoot()
      return true
    case 'title':
      if (action !== 'a' && action !== 'start') return false
      pressStart()
      return true
    case 'menu':
      if (action === 'up' || action === 'left') moveCursor(cursor.value - 1)
      else if (action === 'down' || action === 'right') moveCursor(cursor.value + 1)
      else if (action === 'a') openSection(sections[cursor.value])
      else return false
      return true
    case 'section':
      if (action === 'b') {
        closeSection()
        return true
      }
      if (openId.value === 'discs' && (action === 'left' || action === 'right')) {
        const step = action === 'left' ? -1 : 1
        selectDisc((selectedDisc.value + step + projects.length) % projects.length)
        return true
      }
      return false
    default:
      return false
  }
}

/** Gamepad only: in a panel, the stick scrolls and A presses what has focus. */
function pressPanelPad(action) {
  if (phase.value !== 'section') return
  const body = document.querySelector('.panel-body')
  if (action === 'up') body?.scrollBy({ top: -140, behavior: 'smooth' })
  if (action === 'down') body?.scrollBy({ top: 140, behavior: 'smooth' })
  if (action === 'a' && document.activeElement?.matches('a,button')) document.activeElement.click()
}

function onKeyDown(e) {
  // The plain version is a normal page, so every key keeps its normal job.
  if (phase.value === 'plain' || phase.value === 'loading') return
  if (e.key === 'z' || e.key === 'Z') {
    if (engine.value) engine.value.zHeld = true
  }
  // Leave browser shortcuts such as Alt+Left alone.
  if (e.altKey || e.ctrlKey || e.metaKey) return
  if (typing(e.target)) {
    if (e.key === 'Escape') e.target.blur()
    return
  }
  const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', Escape: 'b' }
  let action = map[e.key]
  const activate = e.key === 'Enter' || e.key === ' '
  // A held key must not chain through the boot, title and menu.
  if (e.repeat && (activate || e.key === 'Escape')) {
    e.preventDefault()
    return
  }
  // Enter and Space belong to the focused control, unless nothing is focused.
  const onControl = e.target?.closest?.('a,button,summary')
  if (activate && !onControl && phase.value !== 'section') action = 'a'
  if (!action) return
  if (['up', 'down'].includes(action) && phase.value === 'section') return // The panel scrolls itself.
  unlock()
  if (press(action)) e.preventDefault()
}
function onKeyUp(e) {
  if ((e.key === 'z' || e.key === 'Z') && engine.value) engine.value.zHeld = false
}

const UNLOCK_EVENTS = ['pointerup', 'touchend', 'click', 'keydown']
const unlockAudio = () => audio.unlock()

let padFrame = 0
const padPrev = {}
const startPad = () => {
  if (!padFrame) pollPad()
}
function pollPad() {
  padFrame = requestAnimationFrame(pollPad)
  const pad = [...(navigator.getGamepads?.() || [])].find(Boolean)
  if (!pad) return
  const axisX = pad.axes[0] || 0
  const axisY = pad.axes[1] || 0
  const states = {
    a: pad.buttons[0]?.pressed,
    b: pad.buttons[1]?.pressed,
    start: pad.buttons[9]?.pressed,
    up: pad.buttons[12]?.pressed || axisY < -0.6,
    down: pad.buttons[13]?.pressed || axisY > 0.6,
    left: pad.buttons[14]?.pressed || axisX < -0.6,
    right: pad.buttons[15]?.pressed || axisX > 0.6
  }
  for (const k in states) {
    if (states[k] && !padPrev[k]) {
      press(k)
      pressPanelPad(k)
    }
    padPrev[k] = states[k]
  }
  if (engine.value) engine.value.zHeld = !!pad.buttons[7]?.pressed
}

onMounted(() => {
  tickClock()
  clockTimer = setInterval(tickClock, 20000)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  // Only poll once a pad has actually been used, so nobody else pays for it.
  window.addEventListener('gamepadconnected', startPad)
  // A touch pointerdown can't start audio, but the release can. Catch every path.
  for (const type of UNLOCK_EVENTS) document.addEventListener(type, unlockAudio, { passive: true })
  router.isReady().then(() => {
    if (isPlainRoute.value || !webgl) {
      phase.value = 'plain'
      if (!isPlainRoute.value) router.replace('/plain')
    } else {
      start3D()
    }
  })
})
onBeforeUnmount(() => {
  clearInterval(clockTimer)
  cancelAnimationFrame(padFrame)
  window.removeEventListener('gamepadconnected', startPad)
  for (const type of UNLOCK_EVENTS) document.removeEventListener(type, unlockAudio)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  engine.value?.dispose()
})

const returning = seen()
</script>

<template>
  <!-- Outside both views, so it keeps announcing when they swap. -->
  <p class="sr-only" role="status">{{ announce }}</p>

  <PlainContent v-if="phase === 'plain'" :show-enter="webgl" @enter="enterFromPlain">
    <template #contact><ContactForm /></template>
  </PlainContent>

  <div v-else class="app" :class="`is-${phase}`" @pointerdown.capture="unlock">
    <canvas ref="canvas" class="gl" aria-hidden="true" />
    <div ref="fadeEl" class="fade" aria-hidden="true" />

    <div class="hud">
      <header class="topbar">
        <p class="brand">{{ person.name }}</p>
        <div class="topbar-right">
          <span v-if="phase === 'menu' || phase === 'section'" class="clock" aria-hidden="true">{{ clock }}</span>
          <button type="button" class="icon-btn" role="switch" :aria-checked="!muted" aria-label="Sound" @click="toggleMute">
            <span aria-hidden="true">{{ muted ? 'Sound off' : 'Sound on' }}</span>
          </button>
        </div>
      </header>

      <!-- Loading -->
      <div v-if="phase === 'loading'" class="loading" role="status">
        <p class="load-blocks" aria-hidden="true"><i /><i /><i /><i /></p>
        <p>Warming up</p>
        <button v-if="loadFailed" type="button" class="btn btn--quiet" @click="plainVersion">Taking a while? Read the plain version</button>
      </div>

      <!-- Opening shot -->
      <div v-if="phase === 'stage'" class="stage-ui">
        <div class="stage-copy">
          <h1 class="stage-title" tabindex="-1">{{ person.name }}</h1>
          <p class="stage-sub">{{ person.tagline }}</p>
          <p class="stage-hint">Drag the disc into the console to start.</p>
          <div class="actions">
            <button type="button" class="btn btn--primary" @click="insertDisc">
              <span class="glyph glyph--a" aria-hidden="true">A</span> Insert disc
            </button>
            <button type="button" class="btn btn--quiet" @click="powerOn">Power on, no disc</button>
          </div>
          <p class="stage-links">
            <button type="button" class="link" @click="skipBoot">{{ returning ? 'Skip to the menu' : 'Skip the intro' }}</button>
            <span aria-hidden="true">·</span>
            <button type="button" class="link" @click="plainVersion">Plain version</button>
            <span aria-hidden="true">·</span>
            <span>Best with sound on</span>
          </p>
          <p class="stage-legal">{{ copyright }} {{ disclaimer }}</p>
        </div>
      </div>

      <!-- Boot -->
      <div v-if="phase === 'boot'" class="boot-ui">
        <transition name="logo">
          <div v-if="logoVisible" class="wordmark">
            <p class="wordmark-name">{{ person.name }}</p>
            <p class="wordmark-sub">Interactive Portfolio</p>
          </div>
        </transition>
        <button type="button" class="btn btn--quiet skip" @click="skipBoot">Skip</button>
      </div>

      <!-- Title (disc path) -->
      <div v-if="phase === 'title'" class="title-ui">
        <h1 class="title-name">{{ person.name }}</h1>
        <p class="stage-sub">{{ person.tagline }}</p>
        <button type="button" class="btn btn--primary btn--big start" @click="pressStart">
          <span class="glyph glyph--a" aria-hidden="true">A</span> Press Start
        </button>
      </div>

      <!-- System menu -->
      <h1 v-if="phase === 'menu' || phase === 'section'" class="sr-only">{{ person.name }}</h1>
      <nav v-if="phase === 'menu' || phase === 'section'" class="menu" aria-label="Portfolio sections" :class="{ 'menu--tucked': phase === 'section' }">
        <p class="menu-status" aria-hidden="true">
          <span class="dot" :class="{ on: hasDisc }" />
          {{ hasDisc ? 'Portfolio Disc inserted' : 'No disc: system menu' }}
        </p>
        <ul>
          <li v-for="(s, i) in sections" :key="s.id">
            <button
              :ref="(el) => (menuButtons[i] = el)"
              type="button"
              class="menu-item"
              :class="{ active: cursor === i, open: openId === s.id }"
              :aria-current="openId === s.id ? 'page' : undefined"
              @mouseenter="hoverCursor(i)"
              @focus="hoverCursor(i)"
              @click="openSection(s)"
            >
              <span class="menu-label">{{ s.label }}</span>
              <span class="menu-blurb">{{ s.blurb }}</span>
            </button>
          </li>
        </ul>
        <p class="menu-foot">
          <button type="button" class="link" @click="ejectToStage">Back to console</button>
          <span aria-hidden="true">·</span>
          <button type="button" class="link" @click="plainVersion">Plain version</button>
        </p>
      </nav>

      <!-- Content -->
      <transition name="panel">
        <SectionPanel
          v-if="openId"
          :id="openId"
          :selected-disc="selectedDisc"
          :active-skill="activeSkill"
          @close="closeSection"
          @select-disc="selectDisc"
          @focus-skill="focusSkill"
          @kick-skill="kickSkill"
        />
      </transition>

      <!-- 3D skill label -->
      <p v-if="openId === 'skills' && activeSkill >= 0" class="skill-tag" aria-hidden="true">{{ skills[activeSkill].name }}</p>

      <footer v-if="phase === 'menu'" class="legal">{{ copyright }} {{ disclaimer }}</footer>
    </div>
  </div>
</template>
