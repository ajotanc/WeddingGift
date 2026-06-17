import { vMaska } from "maska/vue";
import { createPinia } from "pinia";
import money from "v-money3";
import { createApp } from "vue";
import { QuillEditor } from '@vueup/vue-quill'

import App from "./App.vue";
import router from "./router";
import { useAuthStore } from "./stores/auth";

import "./index.css";
import '@vueup/vue-quill/dist/vue-quill.snow.css';

const app = createApp(App);

// 1. Crie e instale o Pinia PRIMEIRO
const pinia = createPinia();
app.use(pinia);

// 2. Agora que o Pinia está instalado, você pode usar os stores
const authStore = useAuthStore();

// 3. Inicialize o que precisar
await authStore.init();

// 4. Instale o restante
app.use(money);
app.directive("maska", vMaska);
app.component('QuillEditor', QuillEditor);

app.use(router);
app.mount("#app");