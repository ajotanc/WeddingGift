import { vMaska } from "maska/vue";
import { createPinia } from "pinia";
import money from "v-money3";
import { createApp } from "vue";

import App from "./App.vue";
import router from "./router";
import "./index.css";
import { useAuthStore } from "./stores/auth";

const app = createApp(App);

app.use(createPinia());

const authStore = useAuthStore();

authStore.init().then(() => {
	app.use(router);
	app.use(money);
	app.directive("maska", vMaska);
	app.mount("#app");
});
