# Frontend Routing Map

All application routes are defined client-side in [src/router/index.ts](file:///d:/Apps/WeddingGift/src/router/index.ts) using `vue-router`. 

---

## Routes Inventory

| Route Path | View/Layout Component | Purpose | Auth Guard Required |
|---|---|---|---|
| `/` | `views/HomeView.vue` | General landing and tenant registration page. | No |
| `/register` | `views/RegisterView.vue` | Dynamic form to input couple information and register a tenant. Stores temporary data in LocalStorage before redirecting to Google Auth. | No |
| `/login` | `views/LoginView.vue` | Login screen for couples and guests. | No |
| `/terms` | `views/TermsView.vue` | Legal Terms of Service page. | No |
| `/privacy` | `views/PrivacyView.vue` | Legal Privacy Policy page. | No |
| `/:slug` | `views/TenantPublicView.vue` | Dynamic landing page matching a couple's wedding. | No |
| `/:slug/gallery` | `views/GuestGalleryView.vue` | Shared collaborative photo upload and visual listing page for guests. | No |
| `/:slug/admin` | `layouts/AdminLayout.vue` | Router layout parent containing admin panel pages. | **Yes** (Restricted to Tenant Owner) |
| `/:slug/admin/dashboard` | `views/admin/AdminDashboardView.vue` | Overview metrics of registry items, RSVPs, and purchases. | **Yes** (Restricted to Tenant Owner) |
| `/:slug/admin/products` | `views/admin/AdminProductsView.vue` | Registry items addition, modification, and external link mapping. | **Yes** (Restricted to Tenant Owner) |
| `/:slug/admin/purchases` | `views/admin/AdminPurchasesView.vue` | Purchase contribution history and payment statuses. | **Yes** (Restricted to Tenant Owner) |
| `/:slug/admin/guests` | `views/admin/AdminGuestsView.vue` | Guest list details, companion counts, and thank-you note generator. | **Yes** (Restricted to Tenant Owner) |
| `/:slug/admin/config` | `views/admin/AdminConfigView.vue` | Custom theme styling editor (fonts, colors, ambient effect, PIX). | **Yes** (Restricted to Tenant Owner) |

---

## Middleware & Guards Logic

### 1. Dynamic Connect Redirect (`/admin/config/mercadopago`)
* Used during Mercado Pago OAuth integration.
* Automatically verifies if the user is authenticated and possesses an active tenant profile.
* If successful, redirects the user dynamically to their specific dashboard route: `/:slug/admin/config`, carrying the query parameters returned by the OAuth flow.

### 2. Admin Authentication Guard
* Triggered on routes containing `/admin`.
* Validates user presence (`authStore.user`) and corresponding tenant mapping (`authStore.tenant`).
* If not authenticated, redirects the client to the `/login` route.
* **Tenant Isolation:** Compares the dynamic path parameter `to.params.slug` with `authStore.tenant.slug`. If a user attempts to manually enter the admin path of a different tenant slug, the guard automatically intercepts the request and reroutes the user to their own dashboard: `/:slug/admin/dashboard`.

### 3. Authenticated Redirect
* If an authenticated user who has an active tenant attempts to navigate to `/login`, the routing guard intercepts the request and redirects them directly to their own admin panel: `/:slug/admin/dashboard` or the dynamic redirect route specified in the query parameters.
