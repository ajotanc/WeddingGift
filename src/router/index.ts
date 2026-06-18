import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: "/",
			name: "home",
			component: () => import("@/views/HomeView.vue"),
		},
		{
			path: "/register",
			name: "register",
			component: () => import("@/views/RegisterView.vue"),
		},
		{
			path: "/login",
			name: "login",
			component: () => import("@/views/LoginView.vue"),
		},
		{
			path: "/:slug/gallery",
			name: "guest-gallery",
			component: () => import("@/views/GuestGalleryView.vue"),
		},
		{
			// Movemos para baixo e adicionamos uma trava via Regex (opcional mas recomendado)
			// para garantir que não capture caminhos fixos
			path: "/:slug",
			name: "tenant-public",
			component: () => import("@/views/TenantPublicView.vue"),
		},
		{
			path: "/:slug/admin",
			component: () => import("@/layouts/AdminLayout.vue"),
			children: [
				{
					path: "",
					redirect: (to) => {
						return { path: `/${to.params.slug}/admin/dashboard` };
					},
				},
				{
					path: "dashboard",
					name: "admin-dashboard",
					component: () => import("@/views/admin/AdminDashboardView.vue"),
				},
				{
					path: "products",
					name: "admin-products",
					component: () => import("@/views/admin/AdminProductsView.vue"),
				},
				{
					path: "purchases",
					name: "admin-purchases",
					component: () => import("@/views/admin/AdminPurchasesView.vue"),
				},
				{
					path: "guests",
					name: "admin-guests",
					component: () => import("@/views/admin/AdminGuestsView.vue"),
				},
				{
					path: "config",
					name: "admin-config",
					component: () => import("@/views/admin/AdminConfigView.vue"),
				},
			],
		},
	],
});

import { useAuthStore } from "@/stores/auth";

router.beforeEach((to, _from, next) => {
	const authStore = useAuthStore();

	// 1. Se tentar entrar no painel Admin sem estar logado -> vai pro login
	if (to.path.includes("/admin") && !authStore.user) {
		return next({ name: "login" });
	}

	// 2. Se já estiver logado e na tela de login -> manda para o dashboard dele
	if (to.name === "login" && authStore.user && authStore.tenant?.slug) {
		return next({ path: `/${authStore.tenant.slug}/admin/dashboard` });
	}

	// Permite a navegação para qualquer outra rota pública (como a Home ou TenantPublicView)
	next();
});

export default router;
