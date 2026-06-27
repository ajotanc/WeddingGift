# API & Server Functions Inventory

This document maps the API endpoints, payloads, response shapes, and serverless functions executing custom backend actions in the WeddingGift platform.

---

## 1. Client-to-Function Proxy (`ai-helper`)

* **Execution Method:** POST
* **Appwrite Client Method:** `functions.createExecution('ai-helper', JSON.stringify(payload))`
* **Authorization:** Requires an active Appwrite user session context.

### Action A: `ai-thanks`
* **Purpose:** Generates a custom thank-you message utilizing the `gemini-2.5-flash` model.
* **Request Payload:**
  ```json
  {
    "action": "ai-thanks",
    "guestName": "Carlos Silva",
    "giftName": "Cota de Lua de Mel",
    "coupleName": "Maria & João"
  }
  ```
* **Response Payload (Success):**
  ```json
  {
    "text": "Querido Carlos, muito obrigado pelo presente..."
  }
  ```

### Action B: `serper-search`
* **Purpose:** Proxies requests to Google Shopping Search via the Serper API, returning product details and merchants links.
* **Request Payload:**
  ```json
  {
    "action": "serper-search",
    "query": "Jogo de Panelas Tramontina"
  }
  ```
* **Response Payload (Success):**
  ```json
  [
    {
      "title": "Jogo de Panelas Inox Tramontina 5 Peças",
      "store": "Magazine Luiza",
      "price": "R$ 450,00",
      "url": "https://...",
      "thumbnail": "https://..."
    }
  ]
  ```

---

## 2. External Webhook (`mercado-pago-webhook`)

* **Execution Method:** POST (triggered externally by Mercado Pago notification requests)
* **Trigger URL:** `https://[appwrite-domain]/v1/functions/mercado-pago-webhook/executions`
* **Request Payload:**
  ```json
  {
    "type": "payment",
    "data": {
      "id": "123456789"
    },
    "user_id": "987654321"
  }
  ```
* **Resolution Logic:**
  1. If `user_id` matches the platform owner's ID, processes a subscription payment. Inspects `metadata.tenant_id` and `metadata.plan_type` to calculate expiration dates and changes the tenant's status to `premium`.
  2. If `user_id` belongs to a couple's Mercado Pago store account, processes a gift payment. Inspects `metadata.purchase_id` and toggles the purchase status to `paid`.

---

## 3. Database Event Listener (`cascade-delete`)

* **Execution Method:** Internal Event Hook
* **Triggers:** Listening on `users.*.delete` events.
* **Internal Action:**
  1. Inspects the deleted user's `$id`.
  2. If the user was a tenant (couple), deletes the `tenants` document with id `userId`. (The Appwrite schema cascade deletes related collections).
  3. If the user was a guest, deletes the `guests` document. It then queries and removes all RSVPs, messages, and purchases linked to that guest document.
