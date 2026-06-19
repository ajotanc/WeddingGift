import { QuillEditor } from "@vueup/vue-quill";
import { vMaska } from "maska/vue";
import { createPinia } from "pinia";
import money from "v-money3";
import { createApp } from "vue";

import App from "./App.vue";
import router from "./router";
import { useAuthStore } from "./stores/auth";

import "./index.css";
import "vue-sonner/style.css";
import "@vueup/vue-quill/dist/vue-quill.snow.css";

const app = createApp(App);

// 1. Instale o Pinia
const pinia = createPinia();
app.use(pinia);

// 3. Auth
const authStore = useAuthStore();
await authStore.init();

// 4. Plugins e componentes
app.use(money);
app.directive("maska", vMaska);
app.component("QuillEditor", QuillEditor);

app.use(router);
app.mount("#app");
