# Payment Service — UMKMku.com

Independent Node.js service for payment processing via Xendit QRIS. Handles invoice generation, webhook callbacks, and order status tracking.

## Architecture

```
payment-service (Node.js + Express)
├── POST /api/orders/:tenant_slug/checkout    → Create order, generate QRIS
├── GET /api/orders/:order_id/status          → Check payment status
├── POST /webhook/xendit                       → Handle payment callbacks (signature verified)
└── GET /health                                → Liveness check
```

## Features

- **Xendit QRIS Integration** — Generate payment QR codes for orders
- **Webhook Handling** — Verify and process Xendit payment callbacks
- **Order Tracking** — Store orders in Supabase with payment status
- **Multi-tenant Support** — Isolate orders by `tenant_slug`
- **Signature Verification** — HMAC-SHA256 verification for webhook security
- **Error Handling** — Comprehensive logging and graceful error responses

## Setup

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account with initialized database
- Xendit account with API key

### Installation

```bash
cd payment-service
pnpm install  # or: npm install
```

### Configuration

1. Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

2. Fill in your secrets:

```bash
XENDIT_API_KEY=xnd_development_...
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
XENDIT_WEBHOOK_SECRET=...  # From Xendit dashboard
```

### Database Schema

Ensure your Supabase project has the `orders` table:

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_slug TEXT NOT NULL,
  
  -- Customer info
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_name TEXT,
  
  -- Payment info
  total_amount INTEGER,
  payment_status TEXT DEFAULT 'pending',  -- pending | completed | expired
  
  -- Xendit integration
  xendit_invoice_id TEXT,
  qr_code_url TEXT,
  
  -- Metadata
  cart_items JSONB,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  paid_at TIMESTAMP
);

CREATE INDEX idx_orders_tenant_slug ON orders(tenant_slug);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
```

## Development

Start the server on port 3002:

```bash
pnpm dev
```

Check health:

```bash
curl http://localhost:3002/health
```

### Example: Create Order

```bash
curl -X POST http://localhost:3002/api/orders/glow-id/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "cart_items": [
      {"product_id": "serum-001", "quantity": 1, "price": 150000}
    ],
    "customer_email": "customer@example.com",
    "customer_phone": "+62812345678",
    "customer_name": "Budi"
  }'
```

Response:

```json
{
  "success": true,
  "order_id": "abc-123-def-456",
  "tenant_slug": "glow-id",
  "total_amount": 150000,
  "qr_code_url": "https://api.xendit.co/qr_codes/...",
  "xendit_invoice_id": "...",
  "expires_at": "2024-12-31T23:59:59Z"
}
```

### Example: Check Status

```bash
curl http://localhost:3002/api/orders/abc-123-def-456/status
```

## Deployment

### Vercel

1. Link repo to Vercel project
2. Set environment variables in Vercel dashboard
3. Deploy:

```bash
vercel deploy --prod
```

The service will run as serverless functions, but can also run as a standalone server.

## API Reference

### POST /api/orders/:tenant_slug/checkout

Create a payment order and generate Xendit QRIS QR code.

**Request:**

```json
{
  "cart_items": [
    {
      "product_id": "product-123",
      "quantity": 2,
      "price": 75000
    }
  ],
  "customer_email": "customer@example.com",
  "customer_phone": "+62812345678",
  "customer_name": "John Doe"
}
```

**Response (201):**

```json
{
  "success": true,
  "order_id": "uuid",
  "tenant_slug": "store-slug",
  "total_amount": 150000,
  "qr_code_url": "https://api.xendit.co/...",
  "xendit_invoice_id": "id",
  "expires_at": "ISO8601"
}
```

### GET /api/orders/:order_id/status

Fetch current payment status.

**Response (200):**

```json
{
  "success": true,
  "order_id": "uuid",
  "tenant_slug": "store-slug",
  "payment_status": "completed|pending|expired",
  "total_amount": 150000,
  "created_at": "ISO8601",
  "paid_at": "ISO8601 or null",
  "qr_code_url": "https://..."
}
```

### POST /webhook/xendit

Xendit payment callback (signature verified).

**Headers:** `X-XENDIT-WEBHOOK-TOKEN`

**Body:** Xendit webhook payload

**Response (200):**

```json
{
  "success": true,
  "message": "Webhook processed",
  "order_id": "uuid",
  "status": "PAID|EXPIRED"
}
```

## File Structure

```
src/
├── index.ts                   # Express server setup
├── routes/
│   ├── checkout.ts           # POST checkout endpoint
│   ├── webhook.ts            # POST webhook endpoint
│   └── status.ts             # GET status endpoint
├── services/
│   ├── xendit-client.ts      # Xendit API wrapper
│   ├── order-service.ts      # Supabase order CRUD
│   └── queue-worker.ts       # Async job queue (stub)
└── middleware/
    └── xendit-verify.ts      # Webhook signature verification
```

## Future Enhancements

- [ ] BullMQ for reliable async job processing
- [ ] Email notifications on payment status
- [ ] Settlement processing and reporting
- [ ] Multiple payment methods (credit card, e-wallet)
- [ ] Retry logic for failed webhooks
- [ ] Detailed transaction logging
- [ ] Payment reconciliation cron job
- [ ] Support for multiple Xendit merchants per tenant

## Security

- Webhook signatures verified with HMAC-SHA256
- Service Role Key used for Supabase to bypass RLS in backend
- Environment variables for all secrets
- No sensitive data logged
- Graceful error responses (no stack traces in production)
