import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: "/",
			name: "home",
			component: () => import("@/views/HomeView.vue"),
			meta: { title: "Wedding Gift • Crie sua Lista de Presentes" },
		},
		{
			path: "/register",
			name: "register",
			component: () => import("@/views/RegisterView.vue"),
			meta: { title: "Wedding Gift • Cadastro" },
		},
		{
			path: "/login",
			name: "login",
			component: () => import("@/views/LoginView.vue"),
			meta: { title: "Wedding Gift • Login" },
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

	// Redirecionamento da rota estática /admin/config para a rota dinâmica com slug (OAuth Mercado Pago)
	if (to.path === "/admin/config/mercadopago") {
		if (!authStore.user) {
			return next({ name: "login", query: { redirect: to.fullPath } });
		}

		if (!authStore.tenant) {
			return next({ name: "login", query: { no_tenant: "1" } });
		}

		return next({
			path: `/${authStore.tenant.slug}/admin/config`,
			query: to.query,
		});
	}

	// 1. Se tentar entrar no painel Admin
	if (to.path.includes("/admin")) {
		if (!authStore.user) {
			return next({ name: "login" });
		}
		if (!authStore.tenant) {
			// Não tem casamento cadastrado, impede acesso
			return next({ name: "login", query: { no_tenant: "1" } });
		}
		// Se tentar entrar no painel de OUTRO casal, redireciona para o seu próprio painel
		if (to.params.slug && to.params.slug !== authStore.tenant.slug) {
			return next({ path: `/${authStore.tenant.slug}/admin/dashboard` });
		}
	}

	// 2. Se já estiver logado e na tela de login -> manda para o redirect ou para o dashboard dele se houver
	if (to.name === "login" && authStore.user && authStore.tenant?.slug) {
		const redirect = to.query.redirect as string;
		if (redirect) {
			return next({ path: redirect });
		}
		return next({ path: `/${authStore.tenant.slug}/admin/dashboard` });
	}

	next();
});

export default router;
