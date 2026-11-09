<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PlainContent from './components/PlainContent.vue'
import ContactForm from './components/ContactForm.vue'
import SectionPanel from './components/SectionPanel.vue'
import { sections, person, disclaimer, projects, skills } from './data/content.js'
import { audio } from './engine/audio.js'
import { hasWebGL, guessTier } from './engine/quality.js'

const route = useRoute()
const router = useRouter()

const SEEN_KEY = 'fj-booted'
const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)')
const reduced = { matches: reducedQuery.matches || new URLSearchParams(location.search).has('reduced') }

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
const zHint = ref(false)
const announce = ref('')
const menuButtons = ref([])
const clock = ref('')

const currentSection = computed(() => sections.find((s) => s.path === route.path) || null)
const openId = computed(() => (phase.value === 'section' ? currentSection.value?.id : null))
const isPlainRoute = computed(() => route.path === '/plain')

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

async function start3D() {
  phase.value = 'loading'
  loadFailed.value = false
  await nextTick()
  const slow = setTimeout(() => {
    if (phase.value === 'loading') loadFailed.value = true // Offer a way out, don't strand anyone.
  }, 8000)
  try {
    const { Engine } = await import('./engine/index.js')
    const e = new Engine(canvas.value, {
      tier: guessTier(),
      reduced: reduced.matches,
      fadeEl: fadeEl.value,
      onEvent: onEngineEvent
    })
    e.init()
    engine.value = e
    clearTimeout(slow)
    enterInitialPhase()
  } catch (err) {
    clearTimeout(slow)
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
  engine.value?.dispose()
  engine.value = null
  phase.value = 'plain'
  if (route.path !== '/plain') router.replace('/plain')
}

function onEngineEvent(name, data = {}) {
  switch (name) {
    case 'boot-start':
      hasDisc.value = data.disc
      phase.value = 'boot'
      announce.value = 'Booting.'
      break
    case 'boot-logo':
      logoVisible.value = true
      break
    case 'boot-end':
      logoVisible.value = false
      markSeen()
      hasDisc.value = data.disc
      phase.value = data.disc ? 'title' : 'menu'
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
  if (phase.value === 'stage') e.bootHasDisc = true
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
function plainVersion() {
  usePlain()
}
function enterFromPlain() {
  router.push('/').then(start3D)
}

// Route is the source of truth for which section is open, so Back/Forward work.
watch(
  () => route.path,
  (path) => {
    const e = engine.value
    if (!e) return
    const s = sections.find((x) => x.path === path)
    if (s) {
      cursor.value = sections.indexOf(s)
      if (['menu', 'title', 'section', 'stage', 'boot'].includes(phase.value)) {
        if (phase.value === 'stage' || phase.value === 'boot') e.jumpTo(null, true, s.shape || 'discs')
        e.openSection(s.id, s.shape)
        phase.value = 'section'
      }
    } else if (path === '/' && phase.value === 'section') {
      e.toMenu(sections[cursor.value].shape || 'discs')
      phase.value = 'menu'
      nextTick(focusCursor)
    }
  }
)

// --- Keyboard and gamepad: one input path ----------------------------------

function typing(el) {
  return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
}

function press(action) {
  switch (phase.value) {
    case 'stage':
      if (action === 'a') insertDisc()
      if (action === 'start') powerOn()
      break
    case 'boot':
      if (action === 'a' || action === 'start' || action === 'b') skipBoot()
      break
    case 'title':
      if (action === 'a' || action === 'start') pressStart()
      break
    case 'menu':
      if (action === 'up' || action === 'left') moveCursor(cursor.value - 1)
      if (action === 'down' || action === 'right') moveCursor(cursor.value + 1)
      if (action === 'a') openSection(sections[cursor.value])
      break
    case 'section':
      if (action === 'b') closeSection()
      if (openId.value === 'discs') {
        if (action === 'left') selectDisc((selectedDisc.value - 1 + projects.length) % projects.length)
        if (action === 'right') selectDisc((selectedDisc.value + 1) % projects.length)
      }
      break
  }
}

function onKeyDown(e) {
  if (e.key === 'z' || e.key === 'Z') {
    if (engine.value) engine.value.zHeld = true
    if (phase.value === 'boot') zHint.value = true
  }
  if (typing(e.target)) {
    if (e.key === 'Escape') e.target.blur()
    return
  }
  const map = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    Escape: 'b',
    Backspace: 'b'
  }
  let action = map[e.key]
  // Enter and Space are left to the focused control, unless nothing is focused.
  const onControl = e.target && e.target.closest && e.target.closest('a,button,summary')
  if (!action && (e.key === 'Enter' || e.key === ' ') && !onControl) action = 'a'
  if (!action) return
  // Menu items are real buttons; arrows just move between them.
  if (['up', 'down', 'left', 'right'].includes(action) && !['menu', 'section'].includes(phase.value)) return
  if (['up', 'down'].includes(action) && phase.value === 'section') return // Let the panel scroll.
  e.preventDefault()
  unlock()
  press(action)
}
function onKeyUp(e) {
  if ((e.key === 'z' || e.key === 'Z') && engine.value) engine.value.zHeld = false
}

let padFrame = 0
const padPrev = {}
function pollPad() {
  padFrame = requestAnimationFrame(pollPad)
  const pad = navigator.getGamepads?.()[0]
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
    if (states[k] && !padPrev[k]) press(k)
    padPrev[k] = states[k]
  }
  if (engine.value) engine.value.zHeld = !!pad.buttons[7]?.pressed
}

onMounted(() => {
  tickClock()
  clockTimer = setInterval(tickClock, 20000)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  pollPad()
  router.isReady().then(() => {
    if (isPlainRoute.value || !hasWebGL()) {
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
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  engine.value?.dispose()
})

const returning = seen()
</script>

<template>
  <PlainContent v-if="phase === 'plain'" :show-enter="isPlainRoute" @enter="enterFromPlain">
    <template #contact><ContactForm /></template>
  </PlainContent>

  <div v-else class="app" :class="`is-${phase}`" @pointerdown.capture="unlock">
    <canvas ref="canvas" class="gl" aria-hidden="true" />
    <div ref="fadeEl" class="fade" aria-hidden="true" />
    <p class="sr-only" role="status">{{ announce }}</p>

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
          <h1 class="stage-title">{{ person.name }}</h1>
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
      <nav v-if="phase === 'menu' || phase === 'section'" class="menu" aria-label="Portfolio sections" :class="{ 'menu--tucked': phase === 'section' }">
        <h1 class="sr-only">{{ person.name }}</h1>
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
        />
      </transition>

      <!-- 3D skill label -->
      <p v-if="openId === 'skills' && activeSkill >= 0" class="skill-tag" aria-hidden="true">{{ skills[activeSkill].name }}</p>

      <footer v-if="phase === 'menu'" class="legal">{{ disclaimer }}</footer>
    </div>
  </div>
</template>
