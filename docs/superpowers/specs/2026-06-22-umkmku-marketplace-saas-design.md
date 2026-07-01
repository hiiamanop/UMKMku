# UMKMku.com Marketplace SaaS, Product Design

**Date:** June 22, 2026  
**Status:** Design Phase Complete  
**Author:** Claude (Co-founder/CTO)

---

## Executive Summary

UMKMku.com is a multi-tenant SaaS platform enabling Indonesian UMKM retail merchants (skincare, parfum, fashion, F&B) to build independent digital storefronts with:

- **Landing page + marketplace** (per merchant, on custom subdomain)
- **AI-powered chatbot** (product recommendations, category-aware)
- **AI onboarding** (30-second setup via natural language)
- **Payment integration** (dynamic QRIS via Xendit)
- **Unified merchant dashboard** (manage store, subscription, payments, metrics)

**Subscription Model:** Fixed monthly tier (TBD price), one tier for MVP.

**Business Model:** Merchant pays subscription. Customer pays Xendit fee (2.5%) at checkout.

---

## Architecture Overview

### Three-Service Hybrid Design

**Core Platform (Next.js 16)**
- Responsibilities: Store rendering, dashboard, onboarding, multi-tenant routing
- Deployment: Vercel (1 instance MVP, auto-scale to 10+ at scale)
- Database: Supabase (PostgreSQL with RLS, connection pooling, Redis cache)

**Chatbot Service (Node.js)**
- Responsibilities: AI product recommendations, category-specific matching
- Deployment: Vercel (1 instance MVP, auto-scale to 20+ at scale)
- Cache: Redis (tenant config + product catalog)
- Stateless (horizontal scaling enabled)

**Payment Service (Node.js)**
- Responsibilities: QRIS generation (Xendit), webhook handling, settlement
- Deployment: Vercel (1 instance MVP + background workers)
- Queue: Async job processing (non-blocking webhook response)

### Data Flow

```
Merchant Onboarding:
  UMKMku.com → Category selection
            → AI extract config (brand, products, persona)
            → Save to Supabase
            → Subdomain auto-ready (e.g., glow-id.umkmku.com)

Customer Store Visit:
  [slug].umkmku.com → Middleware extract slug
                   → Load tenant config (Redis cache)
                   → Render store (landing + marketplace)

Customer Checkout:
  Browse products → Chat with AI chatbot
               → Add to cart
               → Checkout: calculate final_price + Xendit fee
               → Generate dynamic QRIS (Xendit API)
               → Customer scans (GoPay/OVO/Dana/BCA/etc)
               → Xendit webhook → update order status
               → Async: notify merchant + log to chat_sessions

Merchant Dashboard:
  [slug].umkmku.com/dashboard → Unified area
                               ├── Manage products (CRUD per category)
                               ├── View orders (real-time)
                               ├── Customer list + interaction history
                               ├── Payment settings (Xendit credentials)
                               ├── Subscription + billing
                               ├── Analytics (revenue, customers, top products)
                               └── Appearance (colors, branding)
```

---

## Core Platform (Next.js)

### Routes

**Marketing Hub (UMKMku.com)**
- `/`, Landing page + company info
- `/onboarding`, Merchant signup + category selection + AI flow
- `/login`, Merchant auth
- `/dashboard`, Subscription management + billing history

**Merchant Store ([slug].umkmku.com)**
- `/`, Landing page + hero section
- `/shop`, Product listing (paginated, filterable by category)
- `/product/[id]`, Product detail + reviews + AI recommendations
- `/cart`, Shopping cart
- `/checkout`, Cart review + QRIS generation + payment
- `/order/[id]`, Order tracking
- `/about`, Merchant info
- `/contact`, WhatsApp + email
- `/[merchant-dashboard]/*`, Unified dashboard (see "Dashboard Routes" below)

**Dashboard Routes (Unified at [slug].umkmku.com/dashboard)**
- `/overview`, Stats + recent orders
- `/products`, CRUD products per category schema
- `/orders`, Order management
- `/customers`, Customer list + interaction history
- `/appearance`, Colors + branding
- `/chatbot-settings`, AI persona + behavior
- `/payments`, Xendit credentials + settlement history
- `/subscription`, Billing status + plan
- `/analytics`, Revenue, customers, product performance

### Category-Specific Schema

Each product has category-dependent fields stored as JSON:

```
SKINCARE:
  - skin_types: ['oily', 'dry', 'combination', 'sensitive']
  - concerns: ['acne', 'brightening', 'anti-aging', 'hydrating']
  - ingredients: ['niacinamide', 'vitamin-c', 'retinol', 'ceramide']
  - usage_step: 'cleanser'|'toner'|'serum'|'moisturizer'|'sunscreen'

FASHION:
  - sizes: ['XS', 'S', 'M', 'L', 'XL']
  - colors: ['black', 'white', 'navy']
  - materials: ['cotton', 'polyester', 'silk']

F&B:
  - ingredients: ['chicken', 'garlic', 'salt']
  - allergens: ['peanuts', 'shellfish']
  - preparation_time: 30 (minutes)

PARFUM:
  - fragrance_family: ['floral', 'woody', 'fresh']
  - notes_top: ['lemon', 'bergamot']
  - notes_middle: ['rose', 'jasmine']
  - notes_base: ['musk', 'sandalwood']
  - size: 50|100 (ml)
```

### Multi-Tenant Routing

**Middleware (Next.js):**
```typescript
// Extract hostname → extract slug → rewrite to /store/[slug]
// Transparent to Next.js routing
// No database hit per request (routing layer)
```

### Anti-Bottleneck Strategies (Core Platform)

1. **Config Caching (Redis, 5 min TTL)**
   - Key: `tenant:{tenant_id}:config`
   - Reduces Supabase queries 90%

2. **Product Pagination**
   - Default: 20 products per page
   - Index: (tenant_id, is_active, category_type)

3. **Image Serving via CDN**
   - Supabase Storage (CDN-backed)
   - Lazy-load on client
   - Resize on upload (responsive sizes)

4. **RLS at Database Layer**
   - Each tenant sees only own data
   - Efficient filtering (not app-layer filtering)

---

## Chatbot Service (Node.js)

### Endpoints

**POST /api/chat/:tenant_slug**
- Request: `{ messages: [{role, content}] }`
- Response: Server-Sent Events (streaming)
- Flow:
  1. Load tenant config from Redis (cache miss → query Supabase)
  2. Load products from Supabase (RLS filters by tenant_id)
  3. Build category-specific system prompt
  4. Call Gemma (Ollama dev) / Claude (prod)
  5. Stream response chunks
  6. Parse `[[RECOMMEND:product_id]]` tokens
  7. Log to chat_sessions (async, non-blocking)

**GET /api/health**
- For load balancer health checks

### Category-Specific System Prompts

**Skincare:**
```
Kamu adalah skincare advisor untuk {brand_name}.
Tanyakan skin type (oily/dry/combination/sensitive) + concerns.
Rekomendasikan produk yang cocok (max 2).
Jelaskan MENGAPA cocok (ingredients + usage).
Format rekomendasi: [[RECOMMEND:product_uuid]]
```

**Fashion, F&B, Parfum:** Similar structure with category-specific matching logic.

### Anti-Bottleneck Strategies (Chatbot)

1. **Stateless Service**
   - Each instance can handle any tenant
   - Horizontal scaling (add instance, not upgrade)

2. **Config Caching (Redis)**
   - Cache hit rate: 95%+
   - Fallback to DB if cache miss

3. **Async Logging**
   - Log to chat_sessions async (don't block response)
   - Queue-based if needed

4. **Rate Limiting**
   - Max 10 messages per session
   - Max 1 concurrent request per session

5. **Connection Pooling**
   - 10 connections per instance

---

## Payment Service (Node.js)

### Endpoints

**POST /api/orders/:tenant_slug/checkout**
- Request: `{ items: [{product_id, quantity}], customer_email, promo_code? }`
- Response: `{ order_id, qris_code, qris_image_url, final_price }`
- Flow:
  1. Create order (status: pending)
  2. Calculate final_price (include discount if promo_code valid)
  3. Add Xendit fee: `final_price = subtotal + (subtotal × 0.025)`
  4. Call Xendit API: POST /qr_codes
     - `type: DYNAMIC`
     - `amount: final_price`
     - `callback_url: https://umkmku.com/webhook/xendit`
  5. Save qris_code to order
  6. Return QRIS to client

**POST /webhook/xendit**
- Receive payment notifications from Xendit
- Flow:
  1. Verify Xendit signature
  2. Find order by external_id (order_id)
  3. If status == success:
     - Enqueue async job: update order_status + notify merchant
     - Return 200 OK immediately (don't wait for DB write)
  4. Xendit retries if no 200

**GET /api/orders/:order_id/status**
- For client polling while waiting for payment

### Order Lifecycle

```
Checkout request
  ↓
Create order (status: pending)
  ↓
Generate dynamic QRIS (Xendit)
  ↓
Return QRIS to client
  ↓
Customer scans (GoPay/OVO/Dana/BCA/etc)
  ↓
Xendit webhook → payment_status: success
  ↓
Async queue job:
  - Update order_status → processing
  - Notify merchant (email/dashboard)
  - Log to chat_sessions
  - Update customer record
  ↓
Merchant processes shipment
  ↓
Update order_status → shipped/delivered
```

### Xendit Fee Passing

```
Product subtotal: Rp 100,000
Xendit fee (2.5%): Rp 2,500
Customer pays: Rp 102,500

Order record:
  subtotal: 100,000
  xendit_fee: 2,500
  final_price: 102,500

Merchant settlement:
  Xendit receive: 102,500
  Xendit keep fee: 2,500
  Merchant get: 100,000 (clean)
```

### Anti-Bottleneck Strategies (Payment)

1. **Queue-Based Processing (Async)**
   - Webhook handler enqueue job immediately
   - Return 200 OK fast (within 5s)
   - Background worker processes queue

2. **Idempotent Webhook Handling**
   - Check if order already processed (by transaction_id)
   - Prevent double-charging if Xendit retries

3. **Webhook Retry Logic**
   - Xendit retry 5x if no 200
   - Our service return 200 ASAP (queue job, not DB write)

4. **Settlement Batching**
   - Don't process per transaction
   - Batch nightly: aggregate orders → calculate settlement

5. **Connection Pooling + Read Replicas**
   - Writes to main DB
   - Reads (order status queries) from read replica

---

## Database Design (Supabase PostgreSQL)

### Tables

**tenants**
```sql
id (uuid, primary key)
slug (text, unique)
category (skincare|parfum|fashion|fdb)
brand_name, tagline, description
primary_color, secondary_color, accent_color
payment_config (JSON: xendit_merchant_id, api_key, webhook_secret)
subscription_status (active|pending|cancelled)
subscription_start_date, next_billing_date
owner_email, whatsapp_number
chatbot_name, chatbot_persona
is_active, created_at, updated_at
```

**products**
```sql
id (uuid, primary key)
tenant_id (uuid, foreign key → tenants)
category_type (skincare|parfum|fashion|fdb)
name, description, price (rupiah), image_url
skincare_data (JSON, nullable)  -- skin_types[], concerns[], ingredients[], usage_step
fashion_data (JSON, nullable)   -- sizes[], colors[], materials[]
fdb_data (JSON, nullable)       -- ingredients[], allergens[], prep_time
parfum_data (JSON, nullable)    -- fragrance_family[], notes_top/middle/base[], size
is_active, sort_order, created_at, updated_at
```

**orders**
```sql
id (uuid, primary key)
tenant_id (uuid, foreign key → tenants)
transaction_id (text, from Xendit)
customer_email
subtotal, xendit_fee, final_price
payment_method ('qris')
qris_code (string from Xendit)
qris_expiry (timestamp, 15 min default)
payment_status (pending|success|failed)
order_status (pending|processing|shipped|delivered|cancelled)
items (JSON: [{product_id, quantity, price_at_purchase}])
created_at, updated_at
```

**customers**
```sql
id (uuid, primary key)
tenant_id (uuid, foreign key → tenants)
email (unique per tenant)
whatsapp_number
total_orders, total_spent
last_order_date, created_at
```

**chat_sessions**
```sql
id (uuid, primary key)
tenant_id (uuid, foreign key → tenants)
customer_email
messages (JSON: [{role, content, timestamp}])
recommended_products (uuid[])
session_value (estimated from recommendations)
started_at, ended_at
```

### Indexing Strategy

```sql
-- Products: most queries are (tenant_id + filter)
CREATE INDEX idx_products_tenant_active ON products(tenant_id, is_active);
CREATE INDEX idx_products_tenant_category ON products(tenant_id, category_type, is_active);
CREATE INDEX idx_products_search ON products USING GIN (to_tsvector('indonesian', name || ' ' || description));

-- Orders: query by tenant_id + date range (analytics)
CREATE INDEX idx_orders_tenant_date ON orders(tenant_id, created_at DESC);
CREATE INDEX idx_orders_tenant_status ON orders(tenant_id, payment_status, order_status);

-- Chat sessions: query by tenant_id
CREATE INDEX idx_chat_sessions_tenant ON chat_sessions(tenant_id, created_at DESC);

-- Customers: repeat purchase tracking
CREATE INDEX idx_customers_tenant_email ON customers(tenant_id, email);
```

### Row Level Security (RLS)

```sql
-- Each tenant sees only own data
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Policy example (on products):
CREATE POLICY "tenants_isolation" ON products
  USING (tenant_id = current_user_id::uuid)
  WITH CHECK (tenant_id = current_user_id::uuid);
```

### Caching Layer (Redis)

```
Tenant config (5 min TTL):
  Key: tenant:{tenant_id}:config
  Hit rate: 99%

Product catalog (5 min TTL):
  Key: tenant:{tenant_id}:products
  Hit rate: 95%

Promo codes (1 day TTL):
  Key: tenant:{tenant_id}:promos
  Hit rate: 90%

Invalidation: On dashboard product/config update, clear relevant keys
```

---

## Scaling Strategy

### Phase 1: MVP (0-10 merchants)

| Component | Setup | Cost |
|---|---|---|
| Core Platform | 1 Vercel instance | $0 (free tier) |
| Chatbot Service | 1 Vercel instance | $0 (free tier) |
| Payment Service | 1 Vercel instance | $0 (free tier) |
| Database | Supabase Free tier (500MB, 50k MAU) | $0 |
| Cache | In-memory (no Redis) | $0 |
| **Total** | | **$0 + Xendit commission** |

**Performance:** <500ms response time, 99.5% uptime

### Phase 2: Validation (10-100 merchants)

| Component | Setup | Cost |
|---|---|---|
| Core Platform | 2 Vercel instances (load balanced) | $20 |
| Chatbot Service | 2 Vercel instances (load balanced) | $20 |
| Payment Service | 1 Vercel instance | $0 (free tier) |
| Database | Supabase Pro ($25/month) | $25 |
| Cache | Redis (5GB, Upstash) | $29 |
| **Total** | | **$94/month + Xendit commission** |

**Performance:** <300ms (p95), 500+ concurrent users

### Phase 3: Scale (100-1000+ merchants)

| Component | Setup | Cost |
|---|---|---|
| Core Platform | 5-10 instances (auto-scaling) | $150 |
| Chatbot Service | 10-20 instances (auto-scaling) | $200 |
| Payment Service | 3-5 instances + background workers | $100 |
| Database | Supabase Enterprise + read replicas | $500 |
| Cache | Redis cluster (20GB+) | $200 |
| Monitoring (Datadog/Sentry) | Full APM | $300 |
| **Total** | | **$1450/month + Xendit commission** |

**Performance:** <200ms (p95), 10000+ concurrent users, 100k+ daily orders

### Bottleneck Prevention

- ✅ Database: RLS policies, indexing, connection pooling, read replicas
- ✅ Chatbot: Stateless, horizontal scaling, Redis cache, async logging
- ✅ Payment: Queue-based async, webhook idempotency, batch settlement
- ✅ Core Platform: Middleware caching, image CDN, paginated queries
- ✅ Infrastructure: Load balancers, auto-scaling, monitoring + alerting

**Result:** Scale from 10 → 1000+ merchants **without re-architecting code**.

---

## Implementation Roadmap

### Immediate (Week 1-2)
- [ ] Finalize design doc (this document)
- [ ] Create implementation plan per phase
- [ ] Set up repo structure + GitHub
- [ ] Environment setup (Supabase, Xendit sandbox, Ollama)

### Phase 1 (Week 2-4): MVP Foundation
- [ ] Core Platform: routing, multi-tenant foundation
- [ ] Dashboard: merchant signup + onboarding flow
- [ ] Chatbot Service: basic product matching + streaming
- [ ] Payment Service: QRIS generation + Xendit webhook
- [ ] Database: schema + RLS policies

### Phase 2 (Week 4+): Validation Readiness
- [ ] Caching layer (Redis) + monitoring
- [ ] Load testing + scaling validation
- [ ] Merchant onboarding (AI + category extraction)
- [ ] Dashboard completion (full CMS)

### Phase 3 (TBD): Production Scale
- [ ] Read replicas + advanced DB optimization
- [ ] Full APM + alerting setup
- [ ] Auto-scaling policies
- [ ] Disaster recovery procedures

---

## Decisions Locked In

1. ✅ **Three-service hybrid** (Core + Chatbot + Payment), no monolith, no full microservices
2. ✅ **Xendit only** (not Midtrans), simpler, single vendor
3. ✅ **Dynamic QRIS** (per-transaction, not per-product), flexible for promo/discount
4. ✅ **Xendit fee passed to customer**, merchant gets clean revenue
5. ✅ **Category-aware from Day 1** (not generic template), better UX + AI matching
6. ✅ **Config-based rendering** (not code generation), maintainable, no per-merchant deploys
7. ✅ **Free tier MVP** (Vercel + Supabase free), bootstrap without upfront cost
8. ✅ **Unified merchant dashboard** (not separate areas), single login, single interface
9. ✅ **Multi-tenant routing via middleware** (not separate deployments), one codebase serves all

---

## Non-Decisions (Out of Scope)

- ❌ Payment gateway (redirect to marketplace in v1)
- ❌ Authentication (via link access in MVP)
- ❌ Analytics dashboard (metrics via basic SQL queries)
- ❌ SEO tools
- ❌ Custom domains (subdomain only in v1)
- ❌ Multiple templates (one skincare template for MVP)

---

**Next Step:** Implementation Plan (invoke writing-plans skill)

