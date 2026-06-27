# Database Schema & Models Map

WeddingGift relies on an Appwrite Database named `DBWG` (ID: `6a2cb37d0034ac2b40c6`). Below is the mapping of all collections, field types, and their relationships.

---

## Collections Map

### 1. `tenants` (ID: `tenants`)
* **Purpose:** Stores the couple's wedding configurations, styles, and settings.
* **Fields:**
  * `slug` (string, size: 255): Unique URL identifier for the wedding page.
  * `couple_name` (string, size: 255): Display name of the couple.
  * `groom_name` (string, size: 255): Name of the groom.
  * `bride_name` (string, size: 255): Name of the bride.
  * `pix_key` (string, size: 255): PIX key (strongly recommended to use random EVP keys under LGPD rules).
  * `pix_consent` (boolean, *frontend-only*): Client-side authorization flag (stripped before sending to the backend to prevent nonexistent attribute errors).
  * `couple_history` (string, size: 2048): Rich text Quill HTML string of the couple's story (XSS protected).
  * `event_date` (datetime): Date of the ceremony.
  * `event_time` (string, size: 5): Time of the ceremony (e.g. "17:30").
  * `event_location` (string, size: 255): Physical address details.
  * `event_latitude` (float): Latitude coordinate for rendering maps.
  * `event_longitude` (float): Longitude coordinate for rendering maps.
  * `primary_color` (string, size: 7): Main theme color (Hex format).
  * `background_color` (string, size: 7): Base background color (Hex format).
  * `text_color` (string, size: 7): Text layout color (Hex format).
  * `background_image` (string, size: 1024): URL of the background asset.
  * `logo_url` (string, size: 1024): URL of the couple's monogram.
  * `title_font` (string, size: 255): Font family name for headers.
  * `body_font` (string, size: 255): Font family name for content copy.
  * `plan` (string, enum: `free`, `premium`): Current SaaS plan status.
  * `premium_until` (datetime): Expiration timestamp of premium plans.
  * `show_countdown` (boolean): Toggle countdown widget.
  * `show_gallery` (boolean): Toggle guest photo gallery.
  * `show_faq` (boolean): Toggle FAQ questions.
  * `show_schedule` (boolean): Toggle visual timelines.
  * `show_dress_code` (boolean): Toggle dress code instructions.
  * `dress_code_text` (string, size: 2048): Dress code text instructions (XSS protected).
  * `music_url` (string, size: 1024): Optional YouTube link for background ambient play.
  * `ambient_effect` (string, enum: `rose-petals`, `sparkles`, `snow`, `hearts`, `butterflies`, `gold-dust`, `confetti`, `shooting-stars`, `fireflies`, `balloons`, `none`): Interactive background canvas animations.
  * `mp_user_id` (string, size: 255): Couple's Mercado Pago User ID.
  * `mp_access_token` (string, size: 512): Couple's Mercado Pago access token.
  * `mp_refresh_token` (string, size: 512): Couple's Mercado Pago refresh token.

---

### 2. `guests` (ID: `guests`)
* **Purpose:** Profiles of guests created during RSVP or gift purchases.
* **Fields:**
  * `name` (string, size: 255): Full name.
  * `email` (string, size: 255): Email address.
  * `phone` (string, size: 255): Optional phone number.
  * `photo_url` (string, size: 1024): Google profile picture URL.

---

### 3. `rsvps` (ID: `rsvps`)
* **Purpose:** Logs event confirmation RSVPs.
* **Fields:**
  * `tenant` (relationship, type: manyToOne, target: `tenants`, onDelete: cascade): Linked wedding ID.
  * `guest` (relationship, type: manyToOne, target: `guests`, onDelete: cascade): Linked guest profile ID.
  * `status` (string, enum: `confirmed`, `declined`): Confirmation state.
  * `total_adults` (integer): Guest count (adults).
  * `total_children` (integer): Guest count (children).
  * `message` (string, size: 1024): Optional note to the couple.
  * `dietary_restrictions` (string, size: 512): Optional dietary specifications.
  * `companions_names` (string array): Names of accompanying guests.

---

### 4. `products` (ID: `products`)
* **Purpose:** Items on the gift list.
* **Fields:**
  * `tenant` (relationship, type: manyToOne, target: `tenants`, onDelete: cascade): Linked wedding ID.
  * `type` (string, enum: `physical`, `quota`): Product type. Physical redirect to external shops, quotas represent PIX cash contributions.
  * `name` (string, size: 255): Gift item name.
  * `price` (string, size: 255): Currency format value.
  * `desired_quantity` (integer): Total units requested.
  * `claimed_quantity` (integer): Total units paid.
  * `image_url` (string, size: 1024): Gift image asset.
  * `category` (string, size: 255): Category classifier (e.g. "Cozinha", "Lua de Mel").

---

### 5. `product_links` (ID: `product_links`)
* **Purpose:** Stores Google Shopping retail matches for physical gifts.
* **Fields:**
  * `product` (relationship, type: manyToOne, target: `products`, onDelete: cascade): Linked product ID.
  * `store` (string, size: 255): Merchant name (e.g. "Amazon").
  * `url` (string, size: 1024): Merchant buy URL.
  * *Note: The `IProductLink` frontend interface lists virtual properties (`title`, `price`, `thumbnail`) parsed dynamically, but only `store`, `url`, and `product` are written to the database.*

---

### 6. `purchases` (ID: `purchases`)
* **Purpose:** Registry gift transactions records.
* **Fields:**
  * `tenant` (relationship, type: manyToOne, target: `tenants`, onDelete: cascade): Linked wedding ID.
  * `guest` (relationship, type: manyToOne, target: `guests`, onDelete: cascade): Payer guest ID.
  * `product` (relationship, type: manyToOne, target: `products`, onDelete: setNull): Paid gift ID.
  * `quantity` (integer): Amount of items paid.
  * `price_paid` (string, size: 255): Amount of money paid.
  * `method` (string, enum: `pix`, `link`): Payment method used.
  * `status` (string, enum: `pending`, `paid`): Transaction status.

---

### 7. `messages` (ID: `messages`)
* **Purpose:** Well-wishes wall entries.
* **Fields:**
  * `tenant` (relationship, type: manyToOne, target: `tenants`, onDelete: cascade): Linked wedding ID.
  * `guest` (relationship, type: manyToOne, target: `guests`, onDelete: cascade): Author guest ID.
  * `content` (string, size: 2048): Message content.

---

### 8. `gallery` (ID: `gallery`)
* **Purpose:** Photos posted to the shared gallery.
* **Fields:**
  * `tenant` (relationship, type: manyToOne, target: `tenants`, onDelete: cascade): Linked wedding ID.
  * `guest` (relationship, type: manyToOne, target: `guests`, onDelete: cascade): Submitter guest ID.
  * `image_url` (string, size: 1024): Image asset URL.
  * `likes` (string array): Array of guest IDs who liked this photo.
  * `caption` (string, size: 255): Optional text comment.
  * `is_public` (boolean): Visibility flag.

---

### 9. `faqs` (ID: `faqs`)
* **Purpose:** Wedding FAQs.
* **Fields:**
  * `tenant` (relationship, type: manyToOne, target: `tenants`, onDelete: cascade): Linked wedding ID.
  * `question` (string, size: 1024): Question.
  * `answer` (string, size: 1024): Answer.
  * `order` (integer): Sorting position index.

---

### 10. `schedules` (ID: `schedules`)
* **Purpose:** Wedding timeline.
* **Fields:**
  * `tenant` (relationship, type: manyToOne, target: `tenants`, onDelete: cascade): Linked wedding ID.
  * `title` (string, size: 255): Event name (e.g. "Cerimônia").
  * `description` (string, size: 1024): Description.
  * `hour` (string, size: 5): Time (e.g. "19:00").
  * `icon` (string, size: 255): Lucide icon slug.

---

### 11. `consent_logs` (ID: `consent_logs`)
* **Purpose:** Auditable logs tracking accepted legal configurations for compliance under LGPD. Note: Logged locally via the client; target collection should be created in the Appwrite console.
* **Fields:**
  * `user_id` (string, size: 255): Authenticated user ID.
  * `email` (string, size: 255): Registered user email.
  * `accepted_terms` (boolean): Flag confirming terms agreement.
  * `accepted_terms_at` (string, size: 255): Agreement timestamp.
  * `ip_address` (string, size: 255): Client IP address recorded at the time of consent.
  * `user_agent` (string, size: 512): Client user agent string.
