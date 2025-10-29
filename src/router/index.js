import { createRouter, createWebHistory } from 'vue-router'
import WebsitePage from '../views/WebsitePage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: WebsitePage
    }
  ]
})

export default router
