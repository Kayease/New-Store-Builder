# StoreCraft: Theme and Domain Setup Guide

This document details the complete technical architecture and workflow for how merchants select themes, connect custom domains, and go live with their stores on the StoreCraft platform.

---

## 1. Architecture Overview: Multi-Tenant Static Themes

StoreCraft uses a **Multi-Tenant Static Theme** architecture. 
- **Themes** are pre-built static assets (HTML/React/Next.js) uploaded as ZIP files.
- **Serving:** The backend extracts these assets into public directories.
- **Dynamic Content:** Themes are designed to be "headless-ready," fetching data (products, categories, store info) from the StoreCraft API via client-side JavaScript using the store's unique slug.

---

## 2. Database Schema

### `themes` Table
Stores metadata for available design templates.
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `name` | String | Display name (e.g., "Pacific Blue") |
| `slug` | String | URL-friendly identifier (unique) |
| `description`| Text | Theme features and style notes |
| `thumbnail_url`| String | Path to the theme preview image |
| `build_url` | String | Path to the extracted build folder (e.g., `/themes/slug`) |
| `status` | Enum | `active` or `inactive` |

### `stores` Table
The core store record containing merchant configurations.
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `slug` | String | Unique store identifier (e.g., `my-shop`) |
| `theme_id` | UUID | Foreign Key to `themes.id` |
| `owner_id` | UUID | Foreign Key to `profiles.id` |
| `plan_id` | UUID | Foreign Key to `subscription_plans.id` |
| `config` | JSONB | Complex settings: Social links, SEO, Analytics, etc. |
| `logo_url` | String | Path to the store's uploaded logo |

### `store_domains` Table
Tracks custom domain associations and verification status.
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `store_id` | UUID | Foreign Key to `stores.id` |
| `domain` | String | The domain name (e.g., `www.myshop.com`) |
| `type` | Enum | `custom` or `system` |
| `status` | Enum | `connected`, `pending`, `failed` |
| `is_primary` | Boolean | True if this is the main entry point |
| `verification_token`| String | Storecraft-unique TXT record for DNS verification |

---

## 3. Workflow Phase 1: Admin Theme Upload

The process begins with an administrator adding design templates to the platform.

1.  **Preparation:** The theme is built (e.g., `npm run build`) into a static distribution folder and compressed into a `.zip` file.
2.  **Upload (Frontend):** Admin uses `/admin/themes` to upload the ZIP and provide metadata (Name, Slug, Thumbnail).
3.  **Extraction (Backend):**
    -   API: `POST /api/v1/themes`
    -   Action: The ZIP is received by the FastAPI backend, saved to `app/uploads/themes/`, and extracted into a folder named after the `slug`.
    -   Database: A new record is inserted into the `themes` table with paths to the thumbnail and extracted folder.

---

## 4. Workflow Phase 2: Merchant Theme Selection

Once themes are active, merchants can select them for their storefront.

1.  **Browsing:** Merchants can view active themes via the public `/theme` page.
2.  **Preview:** Themes can be previewed live at `/theme/[slug]/preview`, which renders the theme's `index.html` within an iframe.
3.  **Selection:** 
    -   UI Action: Merchant picks a theme.
    -   Backend Action: A `PUT` request is made to the store's configuration (via `/api/v1/stores/{slug}`) to update the `theme_id` column.
    -   *Note: Currently, this selection UI is integrated into the onboarding and store view setup flux.*

---

## 5. Workflow Phase 3: Custom Domain Setup

To make the store professional, merchants connect their own domains.

1.  **Connection:** Merchant enters their domain (e.g., `store.example.com`) in `/store/[store]/domains`.
2.  **DNS Configuration:**
    -   Backend generates a **Verification Token** (TXT record) and **Target Records** (CNAME/A).
    -   Merchant adds these records to their DNS provider (GoDaddy, Cloudflare, etc.).
3.  **Verification:**
    -   Merchant clicks "Verify" in the StoreCraft dashboard.
    -   Backend (`domains.py`) performs a DNS lookup to confirm the records match.
    -   Status updates to `connected`, and SSL provisioning is initiated (simulated in current dev environment).
4.  **Primary Assignment:** Merchant sets the verified domain as "Primary," finalizing the public-facing URL.

---

## 6. Going "Live"

A store is "Live" through two possible entry points:

### A. System Subdomain
Every store is immediately accessible at:
`<platform-domain>.com/hub/[store-slug]/live`
This route serves the static contents of the `theme_id` associated with that store.

### B. Custom Domain
Once the custom domain is connected and the primary CNAME points to StoreCraft's edges:
-   Traffic Hits StoreCraft Infrastructure.
-   The system identifies the store by the `Host` header (mapping the domain back to the `store_id`).
-   The corresponding theme and store configuration are served to the visitor.

---

## 7. Technical Integration Summary

| Task | Frontend Route | Backend Endpoint |
| :--- | :--- | :--- |
| **Manage Themes** | `/admin/themes` | `POST /api/v1/themes` |
| **List Store Themes**| `/theme` | `GET /api/v1/themes` |
| **Update Store Theme**| `/store/[store]/general` | `PUT /api/v1/stores/{slug}` |
| **Manage Domains** | `/store/[store]/domains` | `GET/POST /api/v1/domains` |
| **Verify Domain** | `/store/[store]/domains` | `POST /api/v1/domains/verify` |
