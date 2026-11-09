<script setup>
// The complete portfolio as ordinary HTML. This is the crawlable, no-JS,
// no-WebGL and reduced-effects version, and is prerendered into index.html.
import {
  person,
  education,
  skills,
  experience,
  leadership,
  projects,
  contact,
  disclaimer,
  copyright,
  runs
} from '../data/content.js'

defineProps({ showEnter: { type: Boolean, default: false } })
defineEmits(['enter'])
</script>

<template>
  <div class="plain">
    <header class="plain-hero">
      <div>
        <p class="plain-kicker">{{ person.greeting }}</p>
        <h1 tabindex="-1">{{ person.name }}</h1>
        <p class="plain-tag">{{ person.tagline }}</p>
        <p>
          <template v-for="part in person.bio" :key="part.text">
            <a v-if="part.href" :href="part.href" target="_blank" rel="noopener noreferrer">{{ part.text }}</a>
            <template v-else>{{ part.text }}</template>
          </template>
        </p>
        <p class="plain-actions">
          <a class="plain-btn" :href="person.resume" download>Download Resume</a>
          <a class="plain-btn plain-btn--quiet" href="#contact">Let's Connect</a>
          <button v-if="showEnter" type="button" class="plain-btn plain-btn--quiet" @click="$emit('enter')">
            Play the 3D version
          </button>
        </p>
      </div>
      <img :src="person.photo" :alt="person.photoAlt" width="475" height="546" />
    </header>

    <main>
      <section id="experience" aria-labelledby="h-experience">
        <h2 id="h-experience">Experience</h2>
        <article v-for="job in experience" :key="job.org + job.position" class="plain-item">
          <h3>{{ job.position }}</h3>
          <p class="plain-meta">{{ job.org }} · {{ job.location }} · {{ job.date }}</p>
          <ul>
            <li v-for="b in job.bullets" :key="b">
              <template v-for="(r, i) in runs(b)" :key="i">
                <strong v-if="r.bold">{{ r.text }}</strong>
                <template v-else>{{ r.text }}</template>
              </template>
            </li>
          </ul>
          <p v-if="job.note" class="plain-note">
            <template v-for="(r, i) in runs(job.note)" :key="i">
              <strong v-if="r.bold">{{ r.text }}</strong>
              <template v-else>{{ r.text }}</template>
            </template>
          </p>
        </article>
      </section>

      <section id="leadership" aria-labelledby="h-leadership">
        <h2 id="h-leadership">Leadership &amp; Advisory</h2>
        <article v-for="role in leadership" :key="role.org" class="plain-item">
          <h3>{{ role.position }}</h3>
          <p class="plain-meta">{{ role.org }} · {{ role.location }} · {{ role.date }}</p>
          <ul>
            <li v-for="b in role.bullets" :key="b">
              <template v-for="(r, i) in runs(b)" :key="i">
                <strong v-if="r.bold">{{ r.text }}</strong>
                <template v-else>{{ r.text }}</template>
              </template>
            </li>
          </ul>
        </article>
      </section>

      <section id="projects" aria-labelledby="h-projects">
        <h2 id="h-projects">Projects</h2>
        <article v-for="p in projects" :key="p.title" class="plain-item">
          <h3>{{ p.title }}</h3>
          <p class="plain-meta">{{ p.role }}</p>
          <p>{{ p.description }}</p>
          <p class="plain-links">
            <a v-for="l in p.links" :key="l.href" :href="l.href" target="_blank" rel="noopener noreferrer">{{ l.label }}</a>
          </p>
        </article>
      </section>

      <section id="education" aria-labelledby="h-education">
        <h2 id="h-education">Education</h2>
        <article v-for="e in education" :key="e.school" class="plain-item">
          <h3>{{ e.school }}</h3>
          <p class="plain-meta">
            {{ e.degree }}<template v-if="e.honors"> · {{ e.honors }}</template> · {{ e.location }} · {{ e.date }}
          </p>
        </article>
      </section>

      <section id="skills" aria-labelledby="h-skills">
        <h2 id="h-skills">Skills</h2>
        <ul class="plain-skills">
          <li v-for="s in skills" :key="s.name">
            <img :src="s.icon" alt="" width="20" height="20" loading="lazy" />{{ s.name }}
          </li>
        </ul>
      </section>

      <section id="contact" aria-labelledby="h-contact">
        <h2 id="h-contact">{{ contact.heading }}</h2>
        <p>{{ contact.quote }}</p>
        <ul class="plain-links plain-links--stack">
          <li v-for="s in contact.socials" :key="s.href">
            {{ s.label }}: <a :href="s.href">{{ s.value }}</a>
          </li>
        </ul>
        <slot name="contact" />
      </section>
    </main>

    <footer class="plain-foot">
      <p>{{ copyright }}</p>
      <p>{{ disclaimer }}</p>
    </footer>
  </div>
</template>
