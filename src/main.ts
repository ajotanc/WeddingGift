import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { vMaska } from 'maska/vue'
import money from 'v-money3'

import App from './App.vue'
import router from './router'
import './index.css'

const app = createApp(App)

app.use(createPinia())

import { useAuthStore } from './stores/auth.js'
const authStore = useAuthStore()

authStore.init().then(() => {
  app.use(router)
  app.use(money)
  app.directive('maska', vMaska)
  app.mount('#app')
})
