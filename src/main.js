import './style.css'

import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import { sections } from './data/content.js'

// Sections are real URLs so they can be linked to, bookmarked and crawled. The
// App reads the path itself, because they all share one 3D scene and no route
// swaps a page component.
const Empty = { render: () => null }
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: Empty },
    { path: '/plain', component: Empty },
    ...sections.map((s) => ({ path: s.path, component: Empty })),
    { path: '/:rest(.*)', redirect: '/' }
  ]
})

createApp(App).use(router).mount('#app')
// Vue has replaced the prerendered copy, so the first-paint rule that hid it must
// stop applying, or the plain version would be hidden too.
document.documentElement.classList.add('mounted')
