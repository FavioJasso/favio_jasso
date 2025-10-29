import './assets/main.css'
import './style.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import 'vue-toast-notification/dist/theme-sugar.css'
import ToastPlugin from 'vue-toast-notification'

const app = createApp(App)
app.use(ToastPlugin)
app.use(router)

app.mount('#app')
