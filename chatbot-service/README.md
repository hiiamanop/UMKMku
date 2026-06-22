# Chatbot Service

Independent Node.js service for UMKMku.com providing AI-powered product recommendations and streaming chatbot responses.

## Architecture

- **Express.js** server for HTTP API
- **AI SDK v6** with provider switching (Ollama dev / Claude API prod)
- **Supabase** for tenant config and product data
- **In-memory caching** for tenant configurations
- **Streaming responses** for real-time chatbot interactions

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Make sure Ollama is running
ollama serve

# Start dev server (runs on port 3001)
npm run dev
```

### Production

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## API Endpoints

### Health Check
```
GET /api/health
```

Response:
```json
{
  "status": "ok",
  "service": "chatbot-service",
  "timestamp": "2026-06-22T10:00:00.000Z",
  "uptime": 12345.67,
  "environment": {
    "provider": "ollama",
    "nodeEnv": "development"
  }
}
```

### Chat Endpoint
```
POST /api/chat/:tenant_slug
```

Request body:
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Halo, kulit saya oily dan berjerawat, rekomendasikan produk dong!"
    }
  ]
}
```

Response: Server-Sent Events (SSE) stream
```
data: {"content": "Baik, "}
data: {"content": "saya punya rekomendasi..."}
data: [DONE]
```

## Environment Variables

- `AI_PROVIDER` - `ollama` or `anthropic`
- `OLLAMA_BASE_URL` - Ollama server URL (default: http://localhost:11434/v1)
- `OLLAMA_MODEL` - Model name (default: gemma4:12b)
- `ANTHROPIC_API_KEY` - Claude API key (production)
- `ANTHROPIC_MODEL` - Claude model (default: claude-sonnet-4-6)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anon key
- `PORT` - Server port (default: 3001)

## Database Tables Required

The service expects the following tables in Supabase:

### `tenants`
- `id` (uuid)
- `slug` (text, unique)
- `brand_name` (text)
- `description` (text)
- `chatbot_name` (text)
- `chatbot_persona` (text)
- `is_active` (boolean)

### `products`
- `id` (uuid)
- `tenant_id` (uuid, FK to tenants)
- `name` (text)
- `description` (text)
- `skin_types` (text[])
- `concerns` (text[])
- `ingredients` (text[])
- `usage_step` (text)
- `price` (integer)
- `image_url` (text)
- `tokopedia_url` (text)
- `shopee_url` (text)
- `is_active` (boolean)

## Services

### `ai-model.ts`
Provider-agnostic AI model loader. Switches between Ollama and Claude based on env config.

### `config-cache.ts`
In-memory cache for tenant configurations with 5-minute TTL to reduce Supabase queries.

### `category-matcher.ts`
Product matching engine using skin type and concern matching algorithm.

## Middleware

### `auth.ts`
- Validates tenant slug format
- Placeholder for future API key verification
- Request logging with duration tracking

## Deployment

Configured for Vercel deployment with environment variables stored as Vercel secrets.

```bash
vercel deploy
```

## Development Notes

- TypeScript strict mode enabled
- ESM modules (Node 20.x)
- Streaming responses for better UX
- Cache invalidation support for real-time updates
