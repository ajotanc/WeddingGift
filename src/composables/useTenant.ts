import { computed } from 'vue'
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getTenantBySlug, type ITenant } from '@/services/tenant.service'

const globalTenant = ref<ITenant | null>(null)
const globalLoading = ref(true)
const globalError = ref<string | null>(null)

export function useTenant() {
  const route = useRoute()
  const tenant = globalTenant
  const loading = globalLoading
  const error = globalError

  const fetchTenant = async (slug: string) => {
    loading.value = true
    error.value = null
    try {
      const result = await getTenantBySlug(slug)

      if (result) {
        tenant.value = result
        if (tenant.value.primary_color) {
          applyTheme(tenant.value.primary_color)
        }
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
    const currentSlug = route.params.slug as string
    if (currentSlug) {
      if (tenant.value?.slug === currentSlug) {
        loading.value = false
        if (tenant.value.primary_color) {
          applyTheme(tenant.value.primary_color)
        }
      } else {
        fetchTenant(currentSlug)
      }
    }
  })

  watch(
    () => route.params.slug,
    (newSlug) => {
      if (newSlug && tenant.value?.slug !== newSlug) {
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
        backgroundColor: tenant.value?.background_color ?? 'transparent'
      }
      if (tenant.value?.background_image) {
        style.backgroundImage = `url(${tenant.value.background_image})`
        style.backgroundSize = 'cover'
        style.backgroundPosition = 'center'
      }
      return style
    }),
    pageStyle: computed(() => ({})),
  }
}
