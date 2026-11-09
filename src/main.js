import './style.css'

import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import { sections } from './data/content.js'

// Sections are real URLs so they can be linked to and bookmarked. The App reads
// the path itself, because they all share one 3D scene and no route swaps a page
// component.
const Empty = { render: () => null }
const LEGACY = {
  home: '/',
  experience: '/memory-card',
  leadership: '/memory-card',
  projects: '/discs',
  education: '/profile',
  contact: '/connect'
}

// The previous site navigated by #anchors, and old links may still point at them.
// Rewritten before the router exists, since it reads the URL when installed.
const legacyHash = location.hash.slice(1)
const legacyTarget = LEGACY[legacyHash] || sections.find((s) => s.id === legacyHash)?.path
if (legacyTarget) history.replaceState(null, '', legacyTarget)

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: Empty },
    { path: '/plain', component: Empty },
    ...sections.map((s) => ({ path: s.path, component: Empty })),
    // Names people may guess, or remember from the previous site.
    ...Object.entries(LEGACY).map(([from, to]) => ({ path: `/${from}`, redirect: to })),
    { path: '/:rest(.*)', redirect: '/' }
  ]
})

const baseTitle = document.title
router.afterEach((to) => {
  const section = sections.find((s) => s.path === to.path.toLowerCase().replace(/\/+$/, ''))
  document.title = section ? `${section.label} | Favio Jasso` : baseTitle
})

createApp(App).use(router).mount('#app')
// Vue has replaced the prerendered copy, so the first-paint rule that hid it must
// stop applying, or the plain version would be hidden too.
document.documentElement.classList.add('mounted')
