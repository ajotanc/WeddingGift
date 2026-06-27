# Dependency Graph & High Impact Files

This document maps import patterns, architectural bindings, and registers critical codebase paths that have high impact on the WeddingGift system.

---

## Codebase Dependency Structure

```text
              [ src/main.ts ]
                     |
                     v
             [ src/App.vue ]
                     |
         +-----------+-----------+
         |                       |
         v                       v
 [ src/router/index.ts ]  [ src/stores/auth.ts ] <----+
         |                       |                    |
         v                       |                    | Imports
 [ Views (Views/admin, etc.) ]   | Imports            |
         |                       v                    |
         | Uses                  +------------------->[ src/lib/appwrite.ts ]
         |                                            |
         v                                            v
 [ Composables (useTenant) ] ------------------------>+
         |                                            |
         v                                            v
 [ Services (Product, Rsvp) ] ----------------------->+
```

---

## Critical Paths Index

These files hold core configurations and structures. Modifying them carries a high risk of breaking functionality across the platform.

### 1. Core Connection Layer
* **[src/lib/appwrite.ts](file:///d:/Apps/WeddingGift/src/lib/appwrite.ts):**
  * **Role:** Initializes the Appwrite client SDK, exports database operations helpers (`tables`), and configures permission generators (`getRsvpPermissions`, `getTenantPermissions`).
  * **Risk:** Changes to endpoint parsing, project keys, or permission signatures will cause global failure in reading or writing database documents.

### 2. State & Security Layer
* **[src/stores/auth.ts](file:///d:/Apps/WeddingGift/src/stores/auth.ts):**
  * **Role:** Holds the global authenticated session (`user`, `tenant`, `guest`). Processes login redirections, session initialization, and stores LGPD consent configurations locally.
  * **Risk:** Any error here can lock out administration panels, prevent dynamic configuration updates, or bypass security rules.

### 3. Reactive Theme & Data Provider
* **[src/composables/useTenant.ts](file:///d:/Apps/WeddingGift/src/composables/useTenant.ts):**
  * **Role:** Feches wedding configurations, maps relationships, dynamically loads Google Fonts, and calculates dynamic CSS colors theme injected into the document root.
  * **Risk:** Mistakes in watch loops or loading states will freeze templates, break component rendering, or trigger infinite fetch loops.

### 4. Layout Container
* **[src/layouts/AdminLayout.vue](file:///d:/Apps/WeddingGift/src/layouts/AdminLayout.vue):**
  * **Role:** Restructures layout headers, checks subscription expiration flags, and mounts navigation routes.
  * **Risk:** Formatting errors will break administration panels across all admin views.

### 5. Collection Schema
* **[appwrite.json](file:///d:/Apps/WeddingGift/appwrite.json):**
  * **Role:** Defines standard Appwrite server structures.
  * **Risk:** Deleting attributes or modifying types in this file will cause database query failures in the client.
