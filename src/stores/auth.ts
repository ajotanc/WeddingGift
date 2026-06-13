import { defineStore } from 'pinia'
import { account } from '@/lib/appwrite'
import { getTenantById, createTenant, type ITenantHydrated } from '@/services/tenant.service'
import { OAuthProvider, type Models } from 'appwrite'

interface AuthState {
  user: Models.User<Models.Preferences> | null
  tenant: ITenantHydrated | null
  loading: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    tenant: null,
    loading: true,
  }),
  actions: {
    async init() {
      this.loading = true
      try {
        const sessionUser = await account.get()
        this.user = sessionUser
        if (sessionUser) {
          try {
            const session = await account.getSession('current')
            console.log(session);
            if (session.provider === 'google' && session.providerAccessToken && !sessionUser.prefs?.photoURL) {
              const res = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${session.providerAccessToken}`)
              const data = await res.json()
              if (data.picture) {
                await account.updatePrefs({ ...sessionUser.prefs, photoURL: data.picture })
                this.user.prefs = { ...sessionUser.prefs, photoURL: data.picture }
              }
            }
          } catch (e) {
            console.error('Failed to fetch Google Avatar:', e)
          }

          const pending = localStorage.getItem('pending_tenant')
          if (pending) {
            const data = JSON.parse(pending)
            await createTenant(sessionUser.$id, data)
            localStorage.removeItem('pending_tenant')
            // Redirect to their admin dashboard
            window.location.href = `/${data.slug}/admin`
            return
          }
          const t = await getTenantById(sessionUser.$id)
          this.tenant = t
        }
      } catch (err) {
        this.user = null
        this.tenant = null
      } finally {
        this.loading = false
      }
    },
    async loginWithGoogle(successUrl: string, failureUrl: string) {
      account.createOAuth2Session({ 
        provider: OAuthProvider.Google, 
        success: successUrl, 
        failure: failureUrl,
        scopes: ['profile', 'email']
      })
    },
    async logout() {
      await account.deleteSession('current')
      this.user = null
      this.tenant = null
    },
    async registerTenant(data: Partial<ITenantHydrated>) {
      if (!this.user) return
      const t = await createTenant(this.user.$id, data)
      this.tenant = t
    }
  }
})
