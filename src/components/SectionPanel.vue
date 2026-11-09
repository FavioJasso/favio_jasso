<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import {
  person,
  education,
  skills,
  experience,
  leadership,
  projects,
  contact,
  sections,
  blocksFor,
  runs
} from '../data/content.js'
import ContactForm from './ContactForm.vue'
import { audio } from '../engine/audio.js'

const props = defineProps({
  id: { type: String, required: true },
  selectedDisc: { type: Number, default: 0 },
  activeSkill: { type: Number, default: -1 }
})
const emit = defineEmits(['close', 'select-disc', 'focus-skill'])

const heading = ref(null)
const openSave = ref(0)
const meta = computed(() => sections.find((s) => s.id === props.id))
const project = computed(() => projects[props.selectedDisc])

const saves = computed(() => [
  ...experience.map((e) => ({ ...e, kind: 'Experience' })),
  ...leadership.map((e) => ({ ...e, kind: 'Leadership & Advisory' }))
])
const totalBlocks = computed(() => saves.value.reduce((n, s) => n + blocksFor(s.date), 0))

function toggleSave(i) {
  openSave.value = openSave.value === i ? -1 : i
  audio.move()
}

function changeDisc(step) {
  emit('select-disc', (props.selectedDisc + step + projects.length) % projects.length)
}

// Move focus into the panel on open, so keyboard and screen reader users land
// on the new content rather than being left behind on the menu.
const focusHeading = () => nextTick(() => heading.value?.focus({ preventScroll: true }))
onMounted(focusHeading)
watch(() => props.id, focusHeading)
</script>

<template>
  <section class="panel" :aria-labelledby="`panel-${id}`" :data-section="id">
    <header class="panel-head">
      <h2 :id="`panel-${id}`" ref="heading" tabindex="-1">{{ meta.label }}</h2>
      <button type="button" class="back" @click="emit('close')">
        <span class="glyph glyph--b" aria-hidden="true">B</span> Back
      </button>
    </header>

    <div class="panel-body">
      <!-- PROFILE -->
      <template v-if="id === 'profile'">
        <div class="profile">
          <img :src="person.photo" :alt="person.photoAlt" width="475" height="546" />
          <div>
            <p class="kicker">{{ person.greeting }}</p>
            <p class="profile-name">{{ person.name }}</p>
          </div>
        </div>
        <p class="lede">
          <template v-for="part in person.bio" :key="part.text">
            <a v-if="part.href" :href="part.href" target="_blank" rel="noopener noreferrer">{{ part.text }}</a>
            <template v-else>{{ part.text }}</template>
          </template>
        </p>
        <p class="actions">
          <a class="btn btn--primary" :href="person.resume" download>Download Resume</a>
        </p>
        <h3 class="sub">Education</h3>
        <ul class="plain-list">
          <li v-for="e in education" :key="e.school" class="edu">
            <p class="row-title">{{ e.school }}</p>
            <p>{{ e.degree }}<template v-if="e.honors"> · <strong>{{ e.honors }}</strong></template></p>
            <p class="muted">{{ e.location }} · {{ e.date }}</p>
          </li>
        </ul>
      </template>

      <!-- DISCS -->
      <template v-else-if="id === 'discs'">
        <p class="muted hint">Drag a disc to spin it. Use the arrows to swap discs.</p>
        <div class="disc-tabs" role="group" aria-label="Choose a project">
          <button
            v-for="(p, i) in projects"
            :key="p.title"
            type="button"
            class="chip"
            :aria-pressed="i === selectedDisc"
            @click="emit('select-disc', i)"
          >
            {{ p.title }}
          </button>
        </div>
        <article class="project" aria-live="polite">
          <h3 class="project-title">{{ project.title }}</h3>
          <p class="kicker">{{ project.role }}</p>
          <p class="lede">{{ project.description }}</p>
          <p class="actions">
            <a
              v-for="(l, i) in project.links"
              :key="l.href"
              class="btn"
              :class="i === 0 ? 'btn--primary' : 'btn--quiet'"
              :href="l.href"
              target="_blank"
              rel="noopener noreferrer"
              >{{ l.label }}</a
            >
          </p>
        </article>
        <p class="disc-nav">
          <button type="button" class="btn btn--quiet" @click="changeDisc(-1)">Previous disc</button>
          <button type="button" class="btn btn--quiet" @click="changeDisc(1)">Next disc</button>
        </p>
      </template>

      <!-- MEMORY CARD -->
      <template v-else-if="id === 'memory'">
        <p class="card-usage">
          <span>Slot A: FJ Career</span>
          <span>{{ totalBlocks }} blocks used<small> (1 block = 1 month)</small></span>
        </p>
        <ul class="plain-list saves">
          <li v-for="(s, i) in saves" :key="s.org + s.position" class="save" :class="{ open: openSave === i }">
            <button
              type="button"
              class="save-head"
              :aria-expanded="openSave === i"
              :aria-controls="`save-${i}`"
              @click="toggleSave(i)"
            >
              <span class="save-icon" aria-hidden="true">
                <img v-if="s.image" :src="s.image" alt="" width="40" height="40" loading="lazy" />
                <span v-else>{{ s.org[0] }}</span>
              </span>
              <span class="save-title">
                <span class="row-title">{{ s.position }}</span>
                <span class="muted">{{ s.org }}</span>
              </span>
              <span class="save-blocks">{{ blocksFor(s.date) }}<small>blocks</small></span>
            </button>
            <div v-show="openSave === i" :id="`save-${i}`" class="save-body">
              <p class="muted">{{ s.kind }} · {{ s.location }} · {{ s.date }}</p>
              <ul class="bullets">
                <li v-for="b in s.bullets" :key="b">
                  <template v-for="(r, n) in runs(b)" :key="n">
                    <strong v-if="r.bold">{{ r.text }}</strong>
                    <template v-else>{{ r.text }}</template>
                  </template>
                </li>
              </ul>
              <p v-if="s.note" class="note">
                <template v-for="(r, n) in runs(s.note)" :key="n">
                  <strong v-if="r.bold">{{ r.text }}</strong>
                  <template v-else>{{ r.text }}</template>
                </template>
              </p>
            </div>
          </li>
        </ul>
      </template>

      <!-- SKILLS -->
      <template v-else-if="id === 'skills'">
        <p class="muted hint">Tap a block to give it a spin.</p>
        <ul class="skill-list">
          <li v-for="(s, i) in skills" :key="s.name">
            <button
              type="button"
              class="skill"
              :class="{ active: activeSkill === i }"
              :style="{ '--accent': s.color }"
              @focus="emit('focus-skill', i)"
              @blur="emit('focus-skill', -1)"
              @mouseenter="emit('focus-skill', i)"
              @mouseleave="emit('focus-skill', -1)"
            >
              <img :src="s.icon" alt="" width="22" height="22" loading="lazy" />
              {{ s.name }}
            </button>
          </li>
        </ul>
      </template>

      <!-- CONNECT -->
      <template v-else-if="id === 'connect'">
        <p class="lede quote">{{ contact.heading }} {{ contact.quote }}</p>
        <ul class="socials">
          <li v-for="s in contact.socials" :key="s.href">
            <a :href="s.href" :target="s.href.startsWith('http') ? '_blank' : undefined" rel="noopener noreferrer">
              <span class="row-title">{{ s.label }}</span>
              <span class="muted">{{ s.value }}</span>
            </a>
          </li>
        </ul>
        <ContactForm />
      </template>
    </div>
  </section>
</template>
