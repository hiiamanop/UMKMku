# UMKMku.com Marketplace SaaS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a multi-tenant SaaS marketplace where Indonesian UMKM merchants (skincare, parfum, fashion, F&B) create independent digital storefronts with AI-powered onboarding, product chatbot, and QRIS checkout.

**Architecture:** Hybrid three-service design, Core Platform (Next.js 16, multi-tenant routing) + Chatbot Service (stateless Node.js, horizontal scaling) + Payment Service (async webhook handler for Xendit). Extends existing skincare prototype; adds category-aware schema, merchant dashboard, payment integration, RLS+caching for scale.

**Tech Stack:** 
- Core: Next.js 16.2.9, TypeScript, Tailwind + shadcn/ui
- Database: Supabase (PostgreSQL, RLS, free tier MVP)
- AI: Ollama + Gemma 4 12b (dev), Claude Sonnet (prod)
- Payment: Xendit dynamic QRIS
- Deployment: Vercel (free tier MVP)

---

## Global Constraints

- **PPN (VAT):** 12% add-on-top to all prices (subscriptions + products). Customer pays total; merchant receives net + remits PPN to government.
- **Xendit fee:** 2.5% of final amount (after PPN). Passed to customer at checkout.
- **Categories:** Skincare, Parfum, Fashion, F&B (category-specific fields stored as JSON per product).
- **One subscription tier (MVP):** Fixed price TBD (pricing decision deferred; schema ready).
- **Config-not-code:** All merchant customization via JSON config + Supabase, not code generation.
- **Free tier MVP:** Vercel free, Supabase free (500MB DB, 50k MAU), no Redis initially.
- **Reuse prototype:** Skincare prototype already has routing, onboarding, multi-tenant foundation, extend, don't rebuild.

---

## File Structure & Responsibilities

### Core Platform (Next.js)

```
umkmku/src/
├── app/
│   ├── (marketing)/                  # UMKMku.com hub
│   │   ├── onboarding/               # Category selection + AI flow (extend)
│   │   ├── login/
│   │   └── dashboard/                # Subscription management (NEW)
│   ├── store/
│   │   └── [slug]/                   # Merchant store (multi-tenant, extend)
│   │       ├── page.tsx              # Landing page
│   │       ├── shop/[page].tsx       # Product listing (paginated)
│   │       ├── product/[id]/
│   │       ├── cart/
│   │       ├── checkout/             # PPN + Xendit fee display (extend)
│   │       └── dashboard/            # Unified merchant dashboard (NEW)
│   ├── api/
│   │   ├── onboarding/               # AI config extraction (extend with category)
│   │   ├── chat/[slug]/              # Chatbot API (call Chatbot Service)
│   │   ├── products/                 # CRUD products (NEW)
│   │   ├── orders/                   # Checkout + order creation (extend)
│   │   └── webhook/xendit/           # Payment webhook handler (NEW)
│   └── middleware.ts                 # Multi-tenant routing (extend: ensure /api/ skip)
├── lib/
│   ├── ai/
│   │   ├── provider.ts               # getAIModel() (unchanged)
│   │   ├── onboarding.ts             # Category-aware prompts (extend)
│   │   └── chatbot.ts                # Category-specific system prompts (extend)
│   ├── categories/                   # Category schema definitions (NEW)
│   │   ├── skincare.ts
│   │   ├── parfum.ts
│   │   ├── fashion.ts
│   │   ├── fdb.ts
│   │   └── index.ts
│   ├── supabase/
│   │   ├── client.ts                 # Client + RLS (unchanged)
│   │   ├── server.ts                 # Server-side client (unchanged)
│   │   └── types.ts                  # Auto-generated (regenerate)
│   ├── utils/
│   │   ├── pricing.ts                # PPN + Xendit fee calculation (NEW)
│   │   └── ...existing
│   └── validation/
├── components/
│   ├── store/                        # Store template (extend)
│   ├── dashboard/                    # Merchant dashboard (NEW)
│   └── ui/                           # shadcn (unchanged)
├── middleware.ts                     # Multi-tenant routing (extend)
└── supabase/
    ├── migrations/                   # Database migrations (NEW)
    └── seed.ts
```

### Chatbot Service (Node.js, separate deployment)

```
chatbot-service/
├── src/
│   ├── index.ts                      # Express server
│   ├── routes/
│   │   ├── chat.ts                   # POST /api/chat/:tenant_slug
│   │   └── health.ts                 # GET /api/health
│   ├── services/
│   │   ├── config-cache.ts           # Redis (optional) + Supabase fallback
│   │   ├── ai-model.ts               # Ollama + Claude provider
│   │   └── category-matcher.ts       # Category-specific matching
│   └── middleware/
│       └── auth.ts                   # Tenant verification
├── .env.example
└── package.json
```

### Payment Service (Node.js, separate deployment)

```
payment-service/
├── src/
│   ├── index.ts                      # Express server
│   ├── routes/
│   │   ├── checkout.ts               # POST /api/orders/:tenant_slug/checkout
│   │   ├── webhook.ts                # POST /webhook/xendit
│   │   └── status.ts                 # GET /api/orders/:order_id/status
│   ├── services/
│   │   ├── xendit-client.ts          # Xendit API wrapper
│   │   ├── order-service.ts          # Order CRUD + pricing
│   │   └── queue-worker.ts           # Async job processor
│   └── middleware/
│       └── xendit-verify.ts          # Webhook signature verification
├── .env.example
└── package.json
```

---

## Phase Breakdown

### Phase 1: Foundation & Database (Week 1)
- Task 1: Extend Supabase schema (categories, products, orders, customers, chat_sessions with RLS)
- Task 2: Create category schema definitions (skincare, parfum, fashion, F&B validation + system prompts)
- Task 3: Create pricing utilities (PPN 12% + Xendit fee 2.5% calculation)

### Phase 2: Core Platform & Dashboard (Week 2-3)
- Task 4: Extend Core Platform, products CRUD endpoint
- Task 5: Extend Core Platform, orders creation + pricing logic
- Task 6: Create merchant dashboard component structure
- Task 7: Extend onboarding flow, category selection + category-aware AI extraction
- Task 8: Extend checkout page, display PPN + Xendit fee breakdown
- Task 9: Create merchant products management page (CRUD UI)
- Task 10: Create merchant orders management page (view + status updates)
- Task 11: Create merchant analytics page (basic metrics)

### Phase 3: Chatbot Service (Week 3-4)
- Task 12: Initialize chatbot service repo (Express + TypeScript)
- Task 13: Create chatbot service, config cache layer
- Task 14: Create chatbot service, AI model provider (Ollama + Claude)
- Task 15: Create chatbot service, category-specific matching logic
- Task 16: Create chatbot service, chat endpoint (POST /api/chat/:tenant_slug)
- Task 17: Deploy chatbot service to Vercel

### Phase 4: Payment Service (Week 4-5)
- Task 18: Initialize payment service repo (Express + TypeScript)
- Task 19: Create payment service, Xendit client wrapper
- Task 20: Create payment service, order service (pricing calculation)
- Task 21: Create payment service, checkout endpoint (dynamic QRIS generation)
- Task 22: Create payment service, webhook handler (Xendit signature verification)
- Task 23: Create payment service, async queue worker
- Task 24: Deploy payment service to Vercel

### Phase 5: Core Platform Updates & Integration (Week 5)
- Task 25: Update Core Platform, cart to payment service integration
- Task 26: Update Core Platform, webhook handler integration
- Task 27: Update Core Platform, call chatbot service API (not local)

### Phase 6: Testing & Deployment (Week 6)
- Task 28: Load testing (100 concurrent users, checkout flow)
- Task 29: Deployment checklist + environment setup
- Task 30: Monitoring setup (error logging, performance tracking)

---

# DETAILED TASKS

## Phase 1: Foundation & Database

### Task 1: Extend Supabase Schema, Add Category Support

**Files:**
- Create: `umkmku/supabase/migrations/002_add_categories.sql`
- Modify: `umkmku/lib/supabase/types.ts` (regenerate)

**Interfaces:**
- Consumes: Existing `tenants` table from prototype
- Produces: `products`, `orders`, `customers`, `chat_sessions` tables with category support, PPN/fee fields, RLS policies

**What to implement:**
1. Add `category` column to tenants
2. Create `products` table with `category_type` + category-specific JSON fields (skincare_data, parfum_data, fashion_data, fdb_data)
3. Create `orders` table with pricing fields: `subtotal`, `ppn`, `subtotal_with_ppn`, `xendit_fee`, `final_price`
4. Create `customers` table for repeat purchase tracking
5. Create `chat_sessions` table for chatbot interaction logging
6. Add indexes on (tenant_id, is_active), (tenant_id, category_type), (tenant_id, created_at)
7. Enable RLS on all tables with policy: tenant sees only own data
8. Run migration locally, regenerate TypeScript types

---

### Task 2: Create Category Schema Definitions

**Files:**
- Create: `umkmku/lib/categories/skincare.ts`
- Create: `umkmku/lib/categories/parfum.ts`
- Create: `umkmku/lib/categories/fashion.ts`
- Create: `umkmku/lib/categories/fdb.ts`
- Create: `umkmku/lib/categories/index.ts`

**Interfaces:**
- Consumes: None
- Produces: `validateCategoryData(category, data)`, `getCategorySystemPrompt(category, vars)` functions; export category schemas for zod validation

**What to implement:**
1. Skincare: skin_types, concerns, ingredients, usage_step
2. Parfum: fragrance_family, notes_top/middle/base, size, longevity
3. Fashion: sizes, colors, materials, fit, style
4. F&B: ingredients, allergens, preparation_time, servings, dietary
5. Index file exports validation + system prompt retrieval
6. Each category has category-specific system prompt template for AI chatbot

---

### Task 3: Create Pricing Utilities (PPN + Xendit Fee)

**Files:**
- Create: `umkmku/lib/utils/pricing.ts`
- Create: `umkmku/__tests__/lib/pricing.test.ts`

**Interfaces:**
- Consumes: None
- Produces: `calculatePricingBreakdown(subtotal): PricingBreakdown` (returns {subtotal, ppn, subtotalWithPpn, xenditFee, finalPrice}); `formatRupiah()`, `parseRupiah()` helpers

**What to implement:**
1. `calculatePricingBreakdown(subtotal)`: Returns breakdown object with all fields
   - PPN = subtotal × 0.12 (rounded)
   - subtotalWithPpn = subtotal + ppn
   - xenditFee = subtotalWithPpn × 0.025 (rounded)
   - finalPrice = subtotalWithPpn + xenditFee
2. `formatRupiah(amount)`: Format as IDR currency string (e.g., "Rp 100.000")
3. `parseRupiah(string)`: Parse formatted string back to number
4. Write tests covering: normal amounts, rounding edge cases, formatting/parsing round-trip

---

## Phase 2: Core Platform & Dashboard

### Task 4: Extend Core Platform, Products CRUD Endpoint

**Files:**
- Modify: `umkmku/src/middleware.ts` (ensure `/api/` routes skip rewrite)
- Create: `umkmku/src/app/api/products/route.ts` (GET list, POST create)
- Create: `umkmku/src/app/api/products/[id]/route.ts` (GET detail, PUT update, DELETE)

**Interfaces:**
- Consumes: `validateCategoryData()`, Supabase client with RLS
- Produces: REST endpoints
  - `GET /api/products?slug=glow-id` → `Product[]`
  - `POST /api/products` (body: {slug, name, description, price, category_type, category_data, image_url}) → `Product`
  - `GET /api/products/[id]` → `Product`
  - `PUT /api/products/[id]` → `Product`
  - `DELETE /api/products/[id]` → `{ok: true}`

**What to implement:**
1. Products CRUD: leverage Supabase RLS (tenant isolation automatic)
2. Validate category data using `validateCategoryData(category_type, data)`
3. Store category-specific fields in appropriate JSON column (skincare_data, etc.)
4. Return 400 if validation fails, 404 if tenant not found, 200 if success
5. Write integration tests for each endpoint

---

### Task 5: Extend Core Platform, Orders Creation + Pricing Logic

**Files:**
- Create: `umkmku/src/app/api/orders/route.ts` (POST create order, returns {order_id, qris_code, final_price})
- Create: `umkmku/src/app/api/orders/[id]/route.ts` (GET order status)

**Interfaces:**
- Consumes: `calculatePricingBreakdown()`, Supabase client, payment service API (TBD in Phase 4)
- Produces: REST endpoints
  - `POST /api/orders/:tenant_slug/checkout` (body: {items: [{product_id, quantity}], customer_email, promo_code?}) → {order_id, qris_code, final_price}
  - `GET /api/orders/:order_id/status` → {status, payment_status, qris_expiry}

**What to implement:**
1. POST /orders/:tenant_slug/checkout:
   - Validate items (fetch products, check stock if needed)
   - Calculate subtotal from product prices
   - Use `calculatePricingBreakdown(subtotal)` to get full breakdown
   - Create order record (status: pending, payment_status: pending)
   - Call Payment Service to generate QRIS (endpoint TBD Task 21)
   - Save qris_code to order
   - Return {order_id, qris_code, qris_image_url, final_price}
2. GET /orders/:order_id/status: Return current order + payment status
3. Handle promo_code parameter (apply discount to subtotal if valid)

---

### Task 6: Create Merchant Dashboard Component Structure

**Files:**
- Create: `umkmku/src/components/dashboard/DashboardLayout.tsx` (sidebar nav, auth check)
- Create: `umkmku/src/components/dashboard/OverviewPage.tsx` (stats, recent orders)
- Create: `umkmku/src/components/dashboard/ProductsPage.tsx` (placeholder)
- Create: `umkmku/src/components/dashboard/OrdersPage.tsx` (placeholder)
- Create: `umkmku/src/components/dashboard/AnalyticsPage.tsx` (placeholder)
- Create: `umkmku/src/components/dashboard/SettingsPage.tsx` (placeholder)

**Interfaces:**
- Consumes: Supabase auth, tenant config
- Produces: Reusable dashboard layout + page components

**What to implement:**
1. DashboardLayout: sidebar with navigation links (Overview, Products, Orders, Analytics, Settings), auth guard
2. OverviewPage: display dashboard stats (total orders, revenue, top products)
3. Stub pages: ProductsPage, OrdersPage, AnalyticsPage, SettingsPage (placeholder UI)
4. Routing: `/store/[slug]/dashboard/*` points to respective page component
5. Write tests: auth guard blocks unauthenticated access, layout renders navigation

---

### Task 7: Extend Onboarding Flow, Category Selection + AI Extraction

**Files:**
- Modify: `umkmku/src/app/(marketing)/onboarding/page.tsx`
- Modify: `umkmku/src/app/api/onboarding/route.ts`
- Modify: `umkmku/lib/ai/onboarding.ts`

**Interfaces:**
- Consumes: `getCategorySystemPrompt()`, AI provider
- Produces: Updated onboarding flow (category selection before AI extraction)

**What to implement:**
1. Onboarding page: Add step 1 "Select your category" (radio buttons: skincare, parfum, fashion, F&B)
2. Store selected category in form state
3. Pass category to AI extraction endpoint
4. API endpoint: Update system prompt to use `getCategorySystemPrompt(category)`
5. AI extraction: Extract products with category-specific fields (validate with `validateCategoryData`)
6. Save tenant.category + products with category-specific fields (skincare_data, etc.)
7. Write tests: category selection required, AI extraction validates category fields

---

### Task 8: Extend Checkout Page, Display PPN + Xendit Fee Breakdown

**Files:**
- Modify: `umkmku/src/app/store/[slug]/checkout/page.tsx`

**Interfaces:**
- Consumes: `calculatePricingBreakdown()`, `formatRupiah()`
- Produces: Updated checkout page showing price breakdown

**What to implement:**
1. Checkout page: Display itemized breakdown:
   - Product subtotal: Rp XXX
   - PPN (12%): Rp YYY
   - Xendit fee (2.5%): Rp ZZZ
   - Total: Rp TOTAL (what customer pays)
2. Call POST /api/orders/:tenant_slug/checkout on "Pay" button
3. Display QRIS image + timer (15 min expiry)
4. Poll GET /api/orders/:order_id/status for payment status
5. On success: redirect to /order/:order_id (order confirmation)
6. Write tests: price breakdown correct, QRIS displayed, status polling works

---

### Task 9: Create Merchant Products Management Page

**Files:**
- Create: `umkmku/src/app/store/[slug]/dashboard/products/page.tsx`
- Create: `umkmku/src/components/dashboard/ProductForm.tsx`
- Create: `umkmku/src/components/dashboard/ProductTable.tsx`

**Interfaces:**
- Consumes: Products CRUD API (Task 4), `validateCategoryData()`, tenant category
- Produces: Products management UI (list, create, edit, delete)

**What to implement:**
1. Products page: List all products in table (name, price, category, actions)
2. "Add Product" button: Open form modal
3. ProductForm: Dynamic form based on category (render category-specific fields)
   - Common fields: name, description, price, image upload
   - Category fields: render based on tenant.category
4. CRUD operations: Create (POST), Update (PUT), Delete (DELETE) via API
5. Image upload: Supabase Storage (handle resize)
6. Write tests: form renders correct fields per category, CRUD operations work

---

### Task 10: Create Merchant Orders Management Page

**Files:**
- Create: `umkmku/src/app/store/[slug]/dashboard/orders/page.tsx`
- Create: `umkmku/src/components/dashboard/OrderTable.tsx`

**Interfaces:**
- Consumes: Orders API, Supabase queries
- Produces: Orders management UI (list, view detail, update status)

**What to implement:**
1. Orders page: List all orders in table (order ID, date, customer, total, payment status, order status)
2. Filtering: by date range, payment status, order status
3. Click row: Show order detail (items, customer email, payment breakdown, merchant notes)
4. Update order status: dropdown (pending → processing → shipped → delivered)
5. Display payment breakdown (subtotal, PPN, Xendit fee, total)
6. Write tests: list renders, filtering works, status update works

---

### Task 11: Create Merchant Analytics Page

**Files:**
- Create: `umkmku/src/app/store/[slug]/dashboard/analytics/page.tsx`
- Create: `umkmku/src/components/dashboard/AnalyticsChart.tsx`

**Interfaces:**
- Consumes: Orders data, aggregation queries
- Produces: Analytics dashboard UI (revenue, order count, top products)

**What to implement:**
1. Analytics page: Display key metrics
   - Total revenue (last 30 days)
   - Total orders (last 30 days)
   - Top 5 products (by quantity sold)
   - Customer repeat rate
2. Simple charts: use recharts or chart.js
3. Queries: Aggregate orders by date, sum final_price, count by product_id
4. Write tests: metrics calculated correctly

---

## Phase 3: Chatbot Service

### Task 12: Initialize Chatbot Service Repo

**Files:**
- Create: `chatbot-service/package.json`
- Create: `chatbot-service/tsconfig.json`
- Create: `chatbot-service/src/index.ts`
- Create: `chatbot-service/.env.example`

**Interfaces:**
- Produces: Express server on port 3001, ready for routes

**What to implement:**
1. Initialize Node.js + TypeScript project (npm init, install dependencies)
2. Dependencies: express, @ai-sdk/openai-compatible, @supabase/supabase-js, node-cache (optional), dotenv
3. Basic Express server structure (middleware, error handling)
4. Environment variables: OLLAMA_BASE_URL, OLLAMA_MODEL, SUPABASE_URL, SUPABASE_ANON_KEY, etc.
5. Health check endpoint (GET /api/health)

---

### Task 13: Create Chatbot Service, Config Cache Layer

**Files:**
- Create: `chatbot-service/src/services/config-cache.ts`

**Interfaces:**
- Consumes: Supabase client, optional Redis client (TBD)
- Produces: `getTenantConfig(tenant_slug)`, `getProducts(tenant_id)` with caching (5 min TTL)

**What to implement:**
1. Cache layer with fallback to Supabase
2. Cache key: `tenant:{tenant_slug}:config`, TTL 5 min
3. Cache miss: query Supabase (fetch tenant + products)
4. Invalidation: on tenant/product update (webhook or manual call)
5. Write tests: cache hit/miss, TTL expiry, fallback to DB

---

### Task 14: Create Chatbot Service, AI Model Provider

**Files:**
- Create: `chatbot-service/src/services/ai-model.ts`

**Interfaces:**
- Consumes: Environment variables (AI_PROVIDER, OLLAMA_MODEL, ANTHROPIC_API_KEY)
- Produces: `getAIModel()` → LanguageModel instance

**What to implement:**
1. Provider selection: AI_PROVIDER env (ollama or anthropic)
2. Ollama: createOpenAICompatible({name: 'ollama', baseURL: process.env.OLLAMA_BASE_URL})
3. Anthropic: createAnthropic({apiKey: process.env.ANTHROPIC_API_KEY})
4. **CRITICAL:** For chat, use native Ollama API (POST /api/chat with think: false), NOT AI SDK (see tech-gotchas memory)
5. Return model instance

---

### Task 15: Create Chatbot Service, Category-Specific Matching Logic

**Files:**
- Create: `chatbot-service/src/services/category-matcher.ts`

**Interfaces:**
- Consumes: Products array, category type
- Produces: `rankProductsForRecommendation(products, messages, category)` → ranked Product[]

**What to implement:**
1. Skincare: Match by skin_type + concerns (extract from chat messages)
2. Parfum: Match by fragrance_family (extract from chat)
3. Fashion: Match by style preference (extract from chat)
4. F&B: Match by dietary preference (extract from chat)
5. Return top 2 products ranked by relevance
6. Write tests: skincare matching works, parfum matching works, etc.

---

### Task 16: Create Chatbot Service, Chat Endpoint

**Files:**
- Create: `chatbot-service/src/routes/chat.ts`

**Interfaces:**
- Consumes: `getTenantConfig()`, `getProducts()`, `getAIModel()`, `rankProductsForRecommendation()`
- Produces: POST /api/chat/:tenant_slug (streaming response, SSE)

**What to implement:**
1. Endpoint: POST /api/chat/:tenant_slug
2. Request body: `{messages: [{role, content}]}`
3. Flow:
   - Load tenant config + products from cache
   - Get category-specific system prompt (use `getCategorySystemPrompt()` from categories lib)
   - Call AI model (Ollama native /api/chat with think: false, NOT AI SDK)
   - Stream response chunks via SSE
   - Parse `[[RECOMMEND:product_uuid]]` tokens
   - Log to chat_sessions async (don't block response)
   - Return 200 with streamed response
4. Rate limiting: max 10 messages per session
5. Write tests: chat endpoint returns streamed response, recommendations parsed

---

### Task 17: Deploy Chatbot Service to Vercel

**Files:**
- Create: `chatbot-service/vercel.json`
- Create: `chatbot-service/.env.production`

**Interfaces:**
- Produces: Deployed chatbot service at https://chatbot-umkmku.vercel.app

**What to implement:**
1. Create vercel.json with build command, output directory
2. Deploy to Vercel (Naufa handles git push to separate repo/branch)
3. Set environment variables in Vercel dashboard
4. Test endpoint from production URL

---

## Phase 4: Payment Service

### Task 18: Initialize Payment Service Repo

**Files:**
- Create: `payment-service/package.json`
- Create: `payment-service/tsconfig.json`
- Create: `payment-service/src/index.ts`
- Create: `payment-service/.env.example`

**Interfaces:**
- Produces: Express server on port 3002, ready for routes

**What to implement:**
1. Initialize Node.js + TypeScript project
2. Dependencies: express, @supabase/supabase-js, axios (for Xendit API), dotenv, bullmq (job queue)
3. Basic Express server structure
4. Environment variables: XENDIT_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, REDIS_URL (optional for queue)
5. Health check endpoint (GET /api/health)

---

### Task 19: Create Payment Service, Xendit Client Wrapper

**Files:**
- Create: `payment-service/src/services/xendit-client.ts`

**Interfaces:**
- Consumes: XENDIT_API_KEY environment variable
- Produces: `generateQRIS(external_id, amount, callback_url)` → {qr_code, qr_image_url}; `verifyWebhookSignature(payload, signature)` → boolean

**What to implement:**
1. Xendit API wrapper (axios client with auth)
2. generateQRIS: POST https://api.xendit.co/qr_codes with:
   - external_id: order_id
   - type: DYNAMIC
   - amount: final_price (including PPN + fee)
   - callback_url: https://umkmku.com/api/webhook/xendit
   - Expected response: {id, qr_code, qr_image_url}
3. verifyWebhookSignature: Verify HMAC-SHA256 signature from Xendit
4. Write tests: QRIS generation call works, signature verification works

---

### Task 20: Create Payment Service, Order Service

**Files:**
- Create: `payment-service/src/services/order-service.ts`

**Interfaces:**
- Consumes: Supabase client, `calculatePricingBreakdown()`
- Produces: `createOrder(tenant_id, items, customer_email, promo_code?)` → Order; `getOrderStatus(order_id)` → Order

**What to implement:**
1. createOrder:
   - Fetch products by ID (validate existence)
   - Calculate subtotal = sum of (product.price × quantity)
   - Use `calculatePricingBreakdown(subtotal)` to get breakdown
   - Create order record (all pricing fields, status: pending)
   - Return created order
2. getOrderStatus: Query order by ID, return current state
3. updateOrderStatus: Update order.order_status (used by webhook handler)
4. Write tests: order creation with correct breakdown, status queries

---

### Task 21: Create Payment Service, Checkout Endpoint

**Files:**
- Create: `payment-service/src/routes/checkout.ts`

**Interfaces:**
- Consumes: `createOrder()`, `generateQRIS()`
- Produces: POST /api/orders/:tenant_slug/checkout → {order_id, qris_code, qris_image_url, final_price}

**What to implement:**
1. Endpoint: POST /api/orders/:tenant_slug/checkout
2. Request body: `{items: [{product_id, quantity}], customer_email, promo_code?}`
3. Flow:
   - Validate tenant exists
   - Call `createOrder(tenant_id, items, customer_email, promo_code)`
   - Call `generateQRIS(order_id, final_price, callback_url)`
   - Save qrs_code to order record
   - Return {order_id, qris_code, qris_image_url, final_price}
4. Error handling: 400 bad request, 404 tenant not found, 500 service error
5. Write tests: QRIS generation triggered, order created with correct breakdown

---

### Task 22: Create Payment Service, Webhook Handler

**Files:**
- Create: `payment-service/src/routes/webhook.ts`
- Create: `payment-service/src/middleware/xendit-verify.ts`

**Interfaces:**
- Consumes: `verifyWebhookSignature()`, `getOrderStatus()`, queue job enqueue
- Produces: POST /webhook/xendit (fast 200 OK, enqueue async job)

**What to implement:**
1. Endpoint: POST /webhook/xendit
2. Middleware: Verify Xendit signature (reject if invalid)
3. Flow:
   - Parse webhook payload (transaction_id, status, amount, etc.)
   - Find order by external_id (order_id)
   - If already processed (idempotency check): return 200 OK
   - Enqueue async job: update order + notify merchant
   - Return 200 OK immediately (don't wait for job)
4. Xendit retry logic: return 200 if processed, retry if timeout
5. Write tests: webhook signature verification, idempotency, job enqueue

---

### Task 23: Create Payment Service, Async Queue Worker

**Files:**
- Create: `payment-service/src/services/queue-worker.ts`

**Interfaces:**
- Consumes: Supabase client, queue system (BullMQ or simple in-memory)
- Produces: Background job processor for order updates

**What to implement:**
1. Queue system: BullMQ (Redis-backed) or simple in-memory queue with worker thread
2. Job types: UPDATE_ORDER_STATUS, NOTIFY_MERCHANT, LOG_CHAT_SESSION
3. Worker processes jobs:
   - UPDATE_ORDER_STATUS: update order.payment_status = success, order.order_status = processing
   - NOTIFY_MERCHANT: send email to merchant + dashboard notification
   - LOG_CHAT_SESSION: update chat_sessions with recommended_products + session_value
4. Retry logic: 3 retries with exponential backoff
5. Write tests: job processing works, retries work, failed jobs logged

---

### Task 24: Deploy Payment Service to Vercel

**Files:**
- Create: `payment-service/vercel.json`
- Create: `payment-service/.env.production`

**Interfaces:**
- Produces: Deployed payment service at https://payment-umkmku.vercel.app

**What to implement:**
1. Create vercel.json with build command, output directory
2. Deploy to Vercel
3. Set environment variables in Vercel dashboard
4. Update Xendit webhook URL to production endpoint
5. Test checkout endpoint from production URL

---

## Phase 5: Core Platform Updates & Integration

### Task 25: Update Core Platform, Cart to Payment Service Integration

**Files:**
- Modify: `umkmku/src/app/store/[slug]/checkout/page.tsx`
- Modify: `umkmku/src/lib/utils/cart.ts` (if exists)

**Interfaces:**
- Consumes: Payment Service API (https://payment-umkmku.vercel.app)
- Produces: Updated checkout page calling payment service

**What to implement:**
1. On "Pay" button click: Call POST https://payment-umkmku.vercel.app/api/orders/:tenant_slug/checkout
2. Send cart items + customer email
3. Handle response: {order_id, qris_code, qris_image_url, final_price}
4. Display QRIS image + payment breakdown
5. Poll GET https://payment-umkmku.vercel.app/api/orders/:order_id/status for payment status
6. On success: redirect to /order/:order_id

---

### Task 26: Update Core Platform, Webhook Handler Integration

**Files:**
- Modify: `umkmku/src/app/api/webhook/xendit/route.ts` (if exists, or redirect to payment service)

**Interfaces:**
- Consumes: Payment service handles webhooks
- Produces: Core Platform handles order status updates (via polling or real-time events)

**What to implement:**
1. Payment service handles all Xendit webhooks
2. Core Platform polls payment service for order status changes (or subscribe to real-time updates via Supabase)
3. Update order status on frontend (show "Payment successful" message)
4. Optional: Set up Supabase real-time subscriptions to order status changes

---

### Task 27: Update Core Platform, Call Chatbot Service API

**Files:**
- Modify: `umkmku/src/app/api/chat/[slug]/route.ts`
- Modify: `umkmku/src/app/store/[slug]/page.tsx` (chatbot widget)

**Interfaces:**
- Consumes: Chatbot Service API (https://chatbot-umkmku.vercel.app)
- Produces: Updated chat endpoint calling external service

**What to implement:**
1. Core Platform chat endpoint becomes proxy to chatbot service
2. Core Platform POST /api/chat/[slug]:
   - Forward request to chatbot service
   - Stream response back to client
   - Handle errors (fallback to local if service down)
3. Chatbot widget on store page: Call this endpoint instead of local implementation
4. Write tests: proxy works, streaming works, fallback works

---

## Phase 6: Testing & Deployment

### Task 28: Load Testing (100 Concurrent Users, Checkout Flow)

**Files:**
- Create: `umkmku/__tests__/load/checkout.load.ts` (using k6 or similar)

**Interfaces:**
- Consumes: Deployed services (Vercel URLs)
- Produces: Load test report (response times, error rates)

**What to implement:**
1. Load test script: Simulate 100 concurrent users
   - Browse store (GET /store/[slug])
   - View products (GET /api/products)
   - Add to cart
   - Checkout (POST /api/orders/:tenant_slug/checkout)
   - Check payment status (poll GET /api/orders/:order_id/status)
2. Measure: P95 response time, error rate, throughput
3. Target: <1s response time, <0.1% error rate
4. Report: Identify bottlenecks, recommend optimizations

---

### Task 29: Deployment Checklist + Environment Setup

**Files:**
- Create: `docs/DEPLOYMENT.md`

**Interfaces:**
- Produces: Deployment checklist, environment variable guide

**What to implement:**
1. Pre-deployment checklist:
   - Environment variables configured (Supabase, Xendit, Ollama/Claude, Vercel secrets)
   - Database migrations applied (Supabase)
   - Services deployed (Core Platform, Chatbot, Payment)
   - Webhooks configured (Xendit → Payment Service)
   - Monitoring set up (Sentry, Datadog)
2. Environment variables guide: which variables go where (Vercel, .env.local, etc.)
3. Deployment commands: how to deploy each service
4. Rollback procedures: in case of issues

---

### Task 30: Monitoring Setup (Error Logging, Performance Tracking)

**Files:**
- Create: `umkmku/lib/monitoring/sentry.ts` (optional)
- Modify: `umkmku/next.config.js` (add monitoring)

**Interfaces:**
- Produces: Error tracking (Sentry), performance monitoring (built-in)

**What to implement:**
1. Error tracking: Sentry integration (optional for MVP, can use native error logs)
2. Performance monitoring: Vercel Analytics + custom instrumentation
3. Alerts: Set up alerts for high error rates, slow endpoints
4. Dashboards: Error trends, performance trends
5. Logging: Structured logs for debugging (server logs, error stacks)

---

# TESTING STRATEGY

## Unit Tests
- Pricing calculations (Task 3)
- Category schema validation (Task 2)
- Product CRUD (Task 4)
- AI provider selection (Task 14)
- Xendit client (Task 19)

Run: `npm run test` in each service

## Integration Tests
- Onboarding flow end-to-end (Task 7)
- Checkout flow end-to-end (Task 25)
- Chatbot service integration (Task 27)
- Payment webhook flow (Task 26)

Run: `npm run test:integration` in Core Platform

## Load Tests
- 100 concurrent users (Task 28)

Run: `k6 run __tests__/load/checkout.load.ts`

## Manual Testing
- Merchant onboarding (category selection + AI)
- Product CRUD (add, edit, delete)
- Chatbot conversation (category-specific matching)
- Checkout + QRIS payment
- Dashboard analytics

---

# DEPLOYMENT CHECKLIST

- [ ] Database migrations applied (Supabase)
- [ ] Environment variables configured (all services)
- [ ] Core Platform deployed to Vercel
- [ ] Chatbot Service deployed to Vercel
- [ ] Payment Service deployed to Vercel
- [ ] Xendit webhook URL updated
- [ ] Error tracking configured (Sentry)
- [ ] Performance monitoring set up
- [ ] Load testing passed (P95 < 1s, error rate < 0.1%)
- [ ] Merchant onboarding tested end-to-end
- [ ] Chatbot tested end-to-end
- [ ] Payment flow tested end-to-end (sandbox mode)
- [ ] Go-live approval

---

**Next Step:** Execute implementation plan using subagent-driven-development or executing-plans skill.

