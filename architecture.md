# System Architecture & Component Interaction

This document diagrams and explains the component layout, pipeline interactions, and communications of the WeddingGift platform.

---

## Architecture Diagram (Text-based)

```text
+-----------------------+              +-----------------------+              +-----------------------+
|                       |              |                       |              |                       |
|      Web Browser      |              |   Appwrite Backend    |              |      Third-Party      |
|                       |              |     (Self-Hosted)     |              |       Services        |
|                       |              |                       |              |                       |
+-----------+-----------+              +-----------+-----------+              +-----------+-----------+
            |                                      |                                      |
            | 1. HTTP GET Page Assets              |                                      |
            +------------------------------------->|                                      |
            | 2. HTML/CSS/JS Payload               |                                      |
            |<-------------------------------------+                                      |
            |                                      |                                      |
            | 3. Read/Write collections            |                                      |
            +------------------------------------->|                                      |
            | 4. Document CRUD Response            |                                      |
            |<-------------------------------------+                                      |
            |                                      |                                      |
            | 5. Trigger Execution (ai-helper)     |                                      |
            +------------------------------------->|                                      |
            |                                      | 6. HTTP API Requests                 |
            |                                      +------------------------------------->| (Gemini / Serper)
            |                                      | 7. API Responses                     |
            |                                      |<-------------------------------------+
            | 8. Function JSON Response            |                                      |
            |<-------------------------------------+                                      |
            |                                      |                                      |
            |                                      | 9. Webhook Notification              |
            |                                      |<-------------------------------------+ (Mercado Pago)
            |                                      | 10. Update DB Document (Paid status) |
            |                                      |--+                                   |
            |                                      |  | (Self-Trigger)                    |
            |                                      |<-+                                   |
```

---

## Key Pipelines & Component Interactions

### 1. Browser-to-Assets Pipeline
* **Static Assets:** The Vue client bundle is served from the hosting server (e.g. Netlify/Vercel/Cloudflare).
* **Environment Configuration:** Injected at build time using Vite. The client reads these values to initialize the Appwrite client SDK (`src/lib/appwrite.ts`).

### 2. Client-to-Database Pipeline
* **Authentication Guard:** Prior to listing or writing database documents, standard user sessions are verified via `authStore`.
* **Services Layer:** Views import services from `src/services/` (e.g. `ProductService`, `RsvpService`) rather than executing queries directly.
* **Permissions & Security:** Every write operation includes document-level security rules matching the active tenant user or the individual guest user ID, configured in `src/lib/appwrite.ts`.

### 3. Serverless Functions Execution Pipeline
* **Request Proxying:** When a user searches for products or compiles a AI thank-you message:
  1. The client invokes the Appwrite server function helper (`ai-helper`) using the SDK functions service.
  2. The function handles request validation, check headers (`x-appwrite-user-id`), and executes HTTPS requests against Google Serper Shopping or Gemini API endpoints.
  3. Results are returned to the client in JSON format, preventing API keys from leaking into client-side code.

### 4. Asynchronous Webhooks & System Events
* **Payment Webhook:** Mercado Pago notifies the `mercado-pago-webhook` endpoint about payment approvals. The function identifies whether the buyer is a guest paying for a gift or a tenant upgrading their plan and updates the corresponding database documents in Appwrite.
* **Cascade Delete:** A trigger is listening to account deletions. If a user account is deleted, the `cascade-delete` function clears all associated database records (RSVPs, messages, purchases) to prevent orphaned data.
