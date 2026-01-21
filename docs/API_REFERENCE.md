# API Reference

Complete API documentation for SignalStreamer (TradeMoq) platform.

## Table of Contents

- [Authentication](#authentication)
- [Signal API](#signal-api)
- [TradingView Webhook](#tradingview-webhook)
- [Billing APIs](#billing-apis)
- [Error Handling](#error-handling)
- [Rate Limits](#rate-limits)

---

## Authentication

Most API endpoints require authentication using one of the following methods:

### API Key Authentication

Include your API key in the request header:

```
x-api-key: sp_xxxxxxxxxxxx
```

Or using Bearer token format:

```
Authorization: Bearer sp_xxxxxxxxxxxx
```

Or as a query parameter:

```
?api_key=sp_xxxxxxxxxxxx
```

### User Authentication (Supabase)

For user-specific endpoints, include the Supabase JWT token:

```
Authorization: Bearer <supabase_jwt_token>
```

---

## Signal API

Submit trading signals programmatically using API keys.

### Endpoint

**POST** `https://your-domain.com/api/signal`

Or directly to Supabase Edge Function:

**POST** `https://<project-ref>.supabase.co/functions/v1/signal-api`

### Authentication

Requires API key authentication (see [Authentication](#authentication)).

### Request Headers

```
Content-Type: application/json
x-api-key: sp_xxxxxxxxxxxx
```

### Request Body

The API supports flexible payload formats through payload mapping configuration. The basic format is:

```json
{
  "signal": "BUY",
  "symbol": "AAPL",
  "price": 150.25,
  "time": "2024-01-15T10:30:00Z",
  "interval": "1h",
  "alertId": "unique-alert-id-123"
}
```

#### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `signal` | string | Yes | Signal type: `BUY`, `SELL`, `LONG`, `SHORT` |
| `symbol` | string | Yes | Trading symbol (e.g., `AAPL`, `BTCUSD`) |
| `price` | number | Yes | Price at signal time |
| `time` | string | No | ISO 8601 timestamp (defaults to current time) |
| `interval` | string | No | Timeframe (e.g., `1h`, `4h`, `1d`) |
| `alertId` | string | No | Unique identifier to prevent duplicates |

#### Payload Mapping

API keys can be configured with custom payload mappings to support different payload formats. The mapping allows you to:

- Map nested fields using dot notation (e.g., `data.signal`)
- Set default values for missing fields
- Transform incoming payloads to match your format

Example with custom mapping:
```json
{
  "data": {
    "action": "BUY",
    "ticker": "AAPL",
    "value": 150.25
  }
}
```

With mapping configuration:
```json
{
  "signal": "data.action",
  "symbol": "data.ticker",
  "price": "data.value"
}
```

### Response

#### Success Response (200)

```json
{
  "success": true,
  "message": "Signal received",
  "signal_id": "uuid-here",
  "processed": {
    "signal": "BUY",
    "symbol": "AAPL",
    "price": 150.25,
    "time": "2024-01-15T10:30:00Z"
  }
}
```

#### Error Responses

**401 Unauthorized**
```json
{
  "error": "Unauthorized",
  "message": "API key required. Provide via x-api-key header, Authorization: Bearer <key>, or api_key query param"
}
```

**400 Bad Request**
```json
{
  "error": "Missing required fields",
  "missing": ["signal", "symbol"],
  "message": "Could not extract: signal, symbol. Check your payload_mapping configuration."
}
```

**429 Too Many Requests**
```json
{
  "error": "Rate limit exceeded",
  "message": "Maximum 60 requests per minute",
  "retry_after": 60
}
```

### Duplicate Detection

The API automatically detects and ignores duplicate signals:
- Same symbol and signal type within 5 minutes
- Signals with the same `alertId` are always ignored

### Rate Limits

Rate limits are configured per API key:
- Default: 60 requests per minute
- Can be customized per API key

### Example: cURL

```bash
curl -X POST https://your-domain.com/api/signal \
  -H "Content-Type: application/json" \
  -H "x-api-key: sp_xxxxxxxxxxxx" \
  -d '{
    "signal": "BUY",
    "symbol": "AAPL",
    "price": 150.25,
    "time": "2024-01-15T10:30:00Z"
  }'
```

### Example: JavaScript

```javascript
const response = await fetch('https://your-domain.com/api/signal', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'sp_xxxxxxxxxxxx'
  },
  body: JSON.stringify({
    signal: 'BUY',
    symbol: 'AAPL',
    price: 150.25,
    time: new Date().toISOString()
  })
});

const data = await response.json();
console.log(data);
```

### Example: Python

```python
import requests

url = "https://your-domain.com/api/signal"
headers = {
    "Content-Type": "application/json",
    "x-api-key": "sp_xxxxxxxxxxxx"
}
payload = {
    "signal": "BUY",
    "symbol": "AAPL",
    "price": 150.25,
    "time": "2024-01-15T10:30:00Z"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())
```

---

## TradingView Webhook

Receive signals from TradingView alerts via webhook.

### Endpoint

**POST** `https://your-domain.com/api/tradingview`

Or directly to Supabase Edge Function:

**POST** `https://<project-ref>.supabase.co/functions/v1/tradingview-webhook`

### Request Headers

```
Content-Type: application/json
```

### Request Body

```json
{
  "token": "your-strategy-secret-token",
  "strategyId": "uuid-of-strategy",
  "signal": "BUY",
  "symbol": "AAPL",
  "price": 150.25,
  "time": "2024-01-15T10:30:00Z",
  "interval": "1h",
  "alertId": "unique-alert-id-123",
  "source": "tradingview"
}
```

#### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `token` | string | Yes | Strategy secret token (found in strategy settings) |
| `strategyId` | string | Yes | UUID of the strategy |
| `signal` | string | Yes | Signal type: `BUY`, `SELL`, `LONG`, `SHORT` |
| `symbol` | string | Yes | Trading symbol |
| `price` | number | Yes | Price at signal time |
| `time` | string | Yes | ISO 8601 timestamp |
| `interval` | string | No | Timeframe (e.g., `1h`, `4h`, `1d`) |
| `alertId` | string | No | Unique identifier to prevent duplicates |
| `source` | string | No | Source identifier (defaults to `tradingview`) |

### Response

#### Success Response (200)

```json
{
  "success": true,
  "message": "Signal received"
}
```

#### Error Responses

**400 Bad Request**
```json
{
  "error": "Missing required fields: token, strategyId, signal, symbol, price, time"
}
```

**401 Unauthorized**
```json
{
  "error": "Invalid token"
}
```

**404 Not Found**
```json
{
  "error": "Strategy not found"
}
```

**429 Too Many Requests**
```json
{
  "error": "Rate limit exceeded. Please slow down your requests."
}
```

### Rate Limits

Rate limits are based on user plan:
- **FREE**: 1 request per second
- **PRO**: 5 requests per second
- **ELITE**: 20 requests per second

### Duplicate Detection

The webhook automatically detects and ignores duplicate signals:
- Same symbol and signal type within 5 minutes
- Signals with the same `alertId` are always ignored

### TradingView Alert Setup

1. In TradingView, create a new alert
2. Set the webhook URL to: `https://your-domain.com/api/tradingview`
3. Use this JSON template in the alert message:

```json
{
  "token": "{{strategy.secret_token}}",
  "strategyId": "{{strategy.id}}",
  "signal": "{{strategy.order.action}}",
  "symbol": "{{ticker}}",
  "price": {{close}},
  "time": "{{time}}",
  "interval": "{{interval}}",
  "alertId": "{{alert.id}}",
  "source": "tradingview"
}
```

### Example: TradingView Alert Message

```json
{
  "token": "your-secret-token-here",
  "strategyId": "your-strategy-uuid-here",
  "signal": "{{strategy.order.action}}",
  "symbol": "{{ticker}}",
  "price": {{close}},
  "time": "{{time}}",
  "interval": "{{interval}}",
  "alertId": "{{alert.id}}",
  "source": "tradingview"
}
```

---

## Billing APIs

### Check Subscription

Check the current subscription status for a user.

**GET** `https://<project-ref>.supabase.co/functions/v1/check-subscription`

#### Authentication

Requires Supabase JWT token in Authorization header.

#### Request Headers

```
Authorization: Bearer <supabase_jwt_token>
```

#### Response

```json
{
  "subscribed": true,
  "plan": "PRO",
  "subscription_end": "2024-12-31T23:59:59Z"
}
```

Or for free users:

```json
{
  "subscribed": false,
  "plan": "FREE",
  "subscription_end": null
}
```

---

### Create Checkout Session

Create a Stripe checkout session for subscription.

**POST** `https://<project-ref>.supabase.co/functions/v1/create-checkout`

#### Authentication

Requires Supabase JWT token in Authorization header.

#### Request Headers

```
Authorization: Bearer <supabase_jwt_token>
Content-Type: application/json
```

#### Request Body

```json
{
  "priceId": "price_xxxxxxxxxxxxx"
}
```

Or using plan name (legacy):

```json
{
  "plan": "PRO"
}
```

#### Response

```json
{
  "url": "https://checkout.stripe.com/pay/cs_xxxxxxxxxxxxx"
}
```

---

### Create Customer Portal Session

Create a Stripe customer portal session for managing subscription.

**POST** `https://<project-ref>.supabase.co/functions/v1/create-portal`

#### Authentication

Requires Supabase JWT token in Authorization header.

#### Request Headers

```
Authorization: Bearer <supabase_jwt_token>
```

#### Response

```json
{
  "url": "https://billing.stripe.com/p/session_xxxxxxxxxxxxx"
}
```

---

### Sync Subscription

Synchronize subscription status from Stripe.

**POST** `https://<project-ref>.supabase.co/functions/v1/sync-subscription`

#### Authentication

Requires Supabase JWT token in Authorization header.

#### Request Headers

```
Authorization: Bearer <supabase_jwt_token>
```

#### Response

```json
{
  "success": true,
  "plan": "PRO",
  "subscription_end": "2024-12-31T23:59:59Z"
}
```

---

## Error Handling

All API endpoints return consistent error responses:

### Error Response Format

```json
{
  "error": "Error type",
  "message": "Human-readable error message"
}
```

### HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid authentication |
| 403 | Forbidden - API key disabled or insufficient permissions |
| 404 | Not Found - Resource not found |
| 405 | Method Not Allowed - Wrong HTTP method |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |
| 503 | Service Unavailable - Service temporarily unavailable |

### Common Error Messages

- `"API key required"` - Missing API key in request
- `"Invalid API key"` - API key not found or invalid
- `"API key is disabled"` - API key exists but is inactive
- `"Missing required fields"` - Required fields missing from payload
- `"Rate limit exceeded"` - Too many requests in time window
- `"Strategy not found"` - Strategy ID doesn't exist
- `"Invalid token"` - Strategy token doesn't match
- `"Duplicate signal ignored"` - Signal was a duplicate

---

## Rate Limits

### Signal API

Rate limits are configured per API key:
- Default: **60 requests per minute**
- Can be customized per API key in dashboard

### TradingView Webhook

Rate limits are based on user subscription plan:
- **FREE**: 1 request per second
- **PRO**: 5 requests per second
- **ELITE**: 20 requests per second

### Rate Limit Headers

When rate limited, responses include:

```
Retry-After: 60
```

### Handling Rate Limits

When you receive a `429 Too Many Requests` response:

1. Wait for the duration specified in `Retry-After` header
2. Implement exponential backoff in your client
3. Consider upgrading your plan for higher limits

Example with exponential backoff:

```javascript
async function sendSignalWithRetry(data, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch('https://your-domain.com/api/signal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'sp_xxxxxxxxxxxx'
        },
        body: JSON.stringify(data)
      });

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000 * (i + 1)));
        continue;
      }

      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
}
```

---

## Support

For API support and questions:
- Email: support@trademoq.com
- Documentation: https://docs.trademoq.com
- Dashboard: https://trademoq.com/dashboard/api-keys

---

## Changelog

### Version 1.0.0
- Initial API release
- Signal API with payload mapping
- TradingView webhook integration
- Billing APIs
- Rate limiting per API key and plan
