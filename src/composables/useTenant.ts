import { collection, getDocs, query, where } from 'firebase/firestore'
import { computed } from 'vue'
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '@/firebase'
import type { TenantSettings } from '@/types'

export function useTenant() {
  const route = useRoute()
  const tenant = ref<TenantSettings | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  const fetchTenant = async (slug: string) => {
    loading.value = true
    error.value = null
    try {
      const q = query(collection(db, 'tenants'), where('slug', '==', slug))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        tenant.value = querySnapshot.docs[0].data() as TenantSettings
        applyTheme(tenant.value.theme.primaryColor)
      } else {
        error.value = 'Tenant not found'
        tenant.value = null
      }
    } catch (err) {
      console.error('Error fetching tenant:', err)
      error.value = 'Failed to load tenant details'
    } finally {
      loading.value = false
    }
  }

  const applyTheme = (color: string) => {
    if (color) {
      document.documentElement.style.setProperty('--color-primary', color)
    }
  }

  onMounted(() => {
    if (route.params.slug) {
      fetchTenant(route.params.slug as string)
    }
  })

  watch(
    () => route.params.slug,
    (newSlug) => {
      if (newSlug) {
        fetchTenant(newSlug as string)
      }
    },
  )

  return {
    tenant,
    loading,
    error,
    fetchTenant,
    headerStyle: computed(() => {
      const style: Record<string, string> = {
        backgroundColor: tenant.value?.theme?.dashboardHeaderBgColor ?? 'transparent'
      }
      if (tenant.value?.theme?.backgroundImageUrl) {
        style.backgroundImage = `url(${tenant.value.theme.backgroundImageUrl})`
        style.backgroundSize = 'cover'
        style.backgroundPosition = 'center'
      }
      return style
    }),
    pageStyle: computed(() => ({})),
  }
}
