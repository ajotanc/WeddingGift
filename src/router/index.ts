import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
    },
    {
      path: '/:slug',
      name: 'tenant-public',
      component: () => import('@/views/TenantPublicView.vue'),
    },
    {
      path: '/:slug/admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      children: [
        {
          path: '',
          redirect: (to) => {
            return { path: `/${to.params.slug}/admin/dashboard` }
          }
        },
        {
          path: 'dashboard',
          name: 'admin-dashboard',
          component: () => import('@/views/admin/AdminDashboardView.vue'),
        },
        {
          path: 'products',
          name: 'admin-products',
          component: () => import('@/views/admin/AdminProductsView.vue'),
        },
        {
          path: 'guests',
          name: 'admin-guests',
          component: () => import('@/views/admin/AdminGuestsView.vue'),
        },
        {
          path: 'config',
          name: 'admin-config',
          component: () => import('@/views/admin/AdminConfigView.vue'),
        }
      ]
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
    }
  ],
})

import { useAuthStore } from '@/stores/auth'

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  if (to.path.includes('/admin') && !authStore.user) {
    next({ name: 'login' })
  } else if (to.name === 'login' && authStore.user && authStore.tenant) {
    next({ path: `/${authStore.tenant.slug}/admin/dashboard` })
  } else {
    next()
  }
})

export default router
