import { Link } from 'react-router-dom';
import { ArrowLeft, Copy, Check, BookOpen, Code, Webhook, CreditCard, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SEO } from '@/components/SEO';
import { useTheme } from '@/hooks/useTheme';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const ApiDocs = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const CodeBlock = ({ code, language = 'bash', id }: { code: string; language?: string; id: string }) => (
    <div className="relative group">
      <pre className="my-4 p-4 rounded-lg bg-muted/50 border border-border overflow-x-auto">
        <code className={`text-sm font-mono text-foreground`}>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => copyToClipboard(code, id)}
      >
        {copiedCode === id ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );

  const EndpointCard = ({ 
    method, 
    path, 
    description, 
    auth = false,
    children 
  }: { 
    method: string; 
    path: string; 
    description: string;
    auth?: boolean;
    children: React.ReactNode;
  }) => (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={method === 'GET' ? 'default' : method === 'POST' ? 'secondary' : 'outline'}>
                {method}
              </Badge>
              <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{path}</code>
            </div>
            <CardDescription>{description}</CardDescription>
          </div>
          {auth && (
            <Badge variant="outline" className="text-xs">Requires Auth</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );

  return (
    <>
      <SEO 
        title="API Reference - TradeMoq"
        description="Complete API documentation for TradeMoq. Learn how to integrate with our Signal API, TradingView webhooks, and billing endpoints."
        keywords="API documentation, API reference, webhook API, signal API, TradingView integration, REST API"
        canonical="https://trademoq.com/api-docs"
      />
      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 bg-background/60 backdrop-blur-xl overflow-hidden" style={{ height: '64px' }}>
          <div className="container mx-auto px-6 h-full flex items-center justify-between">
            <Link to="/" className="flex items-center group h-full">
              <img
                src={isDarkMode ? '/tm_logo.svg' : '/tm_logo_black.svg'}
                alt="TradeMoq Logo"
                className="h-48 w-auto transition-all duration-300 group-hover:scale-105"
                key={theme}
              />
            </Link>
            
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Content */}
        <main className="pt-32 pb-20 px-6">
          <div className="container mx-auto max-w-5xl">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="h-8 w-8 text-primary" />
                <h1 className="font-display text-4xl font-bold">API Reference</h1>
              </div>
              <p className="text-muted-foreground text-lg">
                Complete API documentation for integrating with TradeMoq's signal tracking platform.
              </p>
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-8">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="signal-api">Signal API</TabsTrigger>
                <TabsTrigger value="webhook">Webhook</TabsTrigger>
                <TabsTrigger value="billing">Billing</TabsTrigger>
                <TabsTrigger value="errors">Errors</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Getting Started</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      TradeMoq provides RESTful APIs for submitting trading signals, receiving webhooks from TradingView, and managing subscriptions.
                    </p>
                    
                    <div>
                      <h3 className="font-semibold mb-2">Base URLs</h3>
                      <ul className="space-y-2 text-muted-foreground">
                        <li>
                          <strong>Vercel Proxy:</strong>{' '}
                          <code className="bg-muted px-2 py-1 rounded">https://your-domain.com/api</code>
                        </li>
                        <li>
                          <strong>Supabase Edge Functions:</strong>{' '}
                          <code className="bg-muted px-2 py-1 rounded">https://&lt;project-ref&gt;.supabase.co/functions/v1</code>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Authentication</h3>
                      <p className="text-muted-foreground mb-2">
                        Most endpoints require authentication using one of these methods:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                        <li><strong>API Key:</strong> Include in <code className="bg-muted px-1 rounded">x-api-key</code> header</li>
                        <li><strong>Bearer Token:</strong> Include in <code className="bg-muted px-1 rounded">Authorization: Bearer &lt;token&gt;</code> header</li>
                        <li><strong>Query Parameter:</strong> Add <code className="bg-muted px-1 rounded">?api_key=&lt;key&gt;</code> to URL</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Rate Limits</h3>
                      <div className="bg-muted/50 border border-border rounded-lg p-4">
                        <ul className="space-y-2 text-sm">
                          <li><strong>Signal API:</strong> 60 requests/minute (configurable per API key)</li>
                          <li><strong>TradingView Webhook:</strong> Based on plan (FREE: 1/sec, PRO: 5/sec, ELITE: 20/sec)</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Signal API Tab */}
              <TabsContent value="signal-api" className="space-y-6">
                <EndpointCard
                  method="POST"
                  path="/api/signal"
                  description="Submit trading signals programmatically using API keys"
                  auth={true}
                >
                  <div>
                    <h4 className="font-semibold mb-2">Request Headers</h4>
                    <CodeBlock
                      id="signal-headers"
                      code={`Content-Type: application/json
x-api-key: sp_xxxxxxxxxxxx`}
                    />
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Request Body</h4>
                    <CodeBlock
                      id="signal-request"
                      language="json"
                      code={`{
  "signal": "BUY",
  "symbol": "AAPL",
  "price": 150.25,
  "time": "2024-01-15T10:30:00Z",
  "interval": "1h",
  "alertId": "unique-alert-id-123"
}`}
                    />
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Field Descriptions</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left p-2">Field</th>
                            <th className="text-left p-2">Type</th>
                            <th className="text-left p-2">Required</th>
                            <th className="text-left p-2">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-border/50">
                            <td className="p-2"><code>signal</code></td>
                            <td className="p-2">string</td>
                            <td className="p-2">Yes</td>
                            <td className="p-2">BUY, SELL, LONG, or SHORT</td>
                          </tr>
                          <tr className="border-b border-border/50">
                            <td className="p-2"><code>symbol</code></td>
                            <td className="p-2">string</td>
                            <td className="p-2">Yes</td>
                            <td className="p-2">Trading symbol (e.g., AAPL, BTCUSD)</td>
                          </tr>
                          <tr className="border-b border-border/50">
                            <td className="p-2"><code>price</code></td>
                            <td className="p-2">number</td>
                            <td className="p-2">Yes</td>
                            <td className="p-2">Price at signal time</td>
                          </tr>
                          <tr className="border-b border-border/50">
                            <td className="p-2"><code>time</code></td>
                            <td className="p-2">string</td>
                            <td className="p-2">No</td>
                            <td className="p-2">ISO 8601 timestamp (defaults to now)</td>
                          </tr>
                          <tr className="border-b border-border/50">
                            <td className="p-2"><code>interval</code></td>
                            <td className="p-2">string</td>
                            <td className="p-2">No</td>
                            <td className="p-2">Timeframe (e.g., 1h, 4h, 1d)</td>
                          </tr>
                          <tr>
                            <td className="p-2"><code>alertId</code></td>
                            <td className="p-2">string</td>
                            <td className="p-2">No</td>
                            <td className="p-2">Unique ID to prevent duplicates</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Success Response (200)</h4>
                    <CodeBlock
                      id="signal-success"
                      language="json"
                      code={`{
  "success": true,
  "message": "Signal received",
  "signal_id": "uuid-here",
  "processed": {
    "signal": "BUY",
    "symbol": "AAPL",
    "price": 150.25,
    "time": "2024-01-15T10:30:00Z"
  }
}`}
                    />
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Example: cURL</h4>
                    <CodeBlock
                      id="signal-curl"
                      code={`curl -X POST https://your-domain.com/api/signal \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: sp_xxxxxxxxxxxx" \\
  -d '{
    "signal": "BUY",
    "symbol": "AAPL",
    "price": 150.25,
    "time": "2024-01-15T10:30:00Z"
  }'`}
                    />
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Example: JavaScript</h4>
                    <CodeBlock
                      id="signal-js"
                      language="javascript"
                      code={`const response = await fetch('https://your-domain.com/api/signal', {
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
console.log(data);`}
                    />
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Example: Python</h4>
                    <CodeBlock
                      id="signal-python"
                      language="python"
                      code={`import requests

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
print(response.json())`}
                    />
                  </div>
                </EndpointCard>
              </TabsContent>

              {/* Webhook Tab */}
              <TabsContent value="webhook" className="space-y-6">
                <EndpointCard
                  method="POST"
                  path="/api/tradingview"
                  description="Receive signals from TradingView alerts via webhook"
                >
                  <div>
                    <h4 className="font-semibold mb-2">Request Body</h4>
                    <CodeBlock
                      id="webhook-request"
                      language="json"
                      code={`{
  "token": "your-strategy-secret-token",
  "strategyId": "uuid-of-strategy",
  "signal": "BUY",
  "symbol": "AAPL",
  "price": 150.25,
  "time": "2024-01-15T10:30:00Z",
  "interval": "1h",
  "alertId": "unique-alert-id-123",
  "source": "tradingview"
}`}
                    />
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">TradingView Alert Setup</h4>
                    <p className="text-muted-foreground mb-3">
                      Use this JSON template in your TradingView alert message:
                    </p>
                    <CodeBlock
                      id="tradingview-template"
                      language="json"
                      code={`{
  "token": "{{strategy.secret_token}}",
  "strategyId": "{{strategy.id}}",
  "signal": "{{strategy.order.action}}",
  "symbol": "{{ticker}}",
  "price": {{close}},
  "time": "{{time}}",
  "interval": "{{interval}}",
  "alertId": "{{alert.id}}",
  "source": "tradingview"
}`}
                    />
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Success Response (200)</h4>
                    <CodeBlock
                      id="webhook-success"
                      language="json"
                      code={`{
  "success": true,
  "message": "Signal received"
}`}
                    />
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <h4 className="font-semibold mb-1">Rate Limits</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• <strong>FREE:</strong> 1 request per second</li>
                          <li>• <strong>PRO:</strong> 5 requests per second</li>
                          <li>• <strong>ELITE:</strong> 20 requests per second</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </EndpointCard>
              </TabsContent>

              {/* Billing Tab */}
              <TabsContent value="billing" className="space-y-6">
                <EndpointCard
                  method="GET"
                  path="/functions/v1/check-subscription"
                  description="Check the current subscription status for a user"
                  auth={true}
                >
                  <div>
                    <h4 className="font-semibold mb-2">Request Headers</h4>
                    <CodeBlock
                      id="check-sub-headers"
                      code={`Authorization: Bearer <supabase_jwt_token>`}
                    />
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Success Response (200)</h4>
                    <CodeBlock
                      id="check-sub-response"
                      language="json"
                      code={`{
  "subscribed": true,
  "plan": "PRO",
  "subscription_end": "2024-12-31T23:59:59Z"
}`}
                    />
                  </div>
                </EndpointCard>

                <EndpointCard
                  method="POST"
                  path="/functions/v1/create-checkout"
                  description="Create a Stripe checkout session for subscription"
                  auth={true}
                >
                  <div>
                    <h4 className="font-semibold mb-2">Request Body</h4>
                    <CodeBlock
                      id="checkout-request"
                      language="json"
                      code={`{
  "priceId": "price_xxxxxxxxxxxxx"
}`}
                    />
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Success Response (200)</h4>
                    <CodeBlock
                      id="checkout-response"
                      language="json"
                      code={`{
  "url": "https://checkout.stripe.com/pay/cs_xxxxxxxxxxxxx"
}`}
                    />
                  </div>
                </EndpointCard>

                <EndpointCard
                  method="POST"
                  path="/functions/v1/create-portal"
                  description="Create a Stripe customer portal session for managing subscription"
                  auth={true}
                >
                  <div>
                    <h4 className="font-semibold mb-2">Request Headers</h4>
                    <CodeBlock
                      id="portal-headers"
                      code={`Authorization: Bearer <supabase_jwt_token>`}
                    />
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Success Response (200)</h4>
                    <CodeBlock
                      id="portal-response"
                      language="json"
                      code={`{
  "url": "https://billing.stripe.com/p/session_xxxxxxxxxxxxx"
}`}
                    />
                  </div>
                </EndpointCard>
              </TabsContent>

              {/* Errors Tab */}
              <TabsContent value="errors" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Error Handling</CardTitle>
                    <CardDescription>
                      All API endpoints return consistent error responses
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Error Response Format</h4>
                      <CodeBlock
                        id="error-format"
                        language="json"
                        code={`{
  "error": "Error type",
  "message": "Human-readable error message"
}`}
                      />
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">HTTP Status Codes</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left p-2">Status Code</th>
                              <th className="text-left p-2">Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-border/50">
                              <td className="p-2"><code>200</code></td>
                              <td className="p-2">Success</td>
                            </tr>
                            <tr className="border-b border-border/50">
                              <td className="p-2"><code>400</code></td>
                              <td className="p-2">Bad Request - Invalid input</td>
                            </tr>
                            <tr className="border-b border-border/50">
                              <td className="p-2"><code>401</code></td>
                              <td className="p-2">Unauthorized - Missing or invalid authentication</td>
                            </tr>
                            <tr className="border-b border-border/50">
                              <td className="p-2"><code>403</code></td>
                              <td className="p-2">Forbidden - API key disabled or insufficient permissions</td>
                            </tr>
                            <tr className="border-b border-border/50">
                              <td className="p-2"><code>404</code></td>
                              <td className="p-2">Not Found - Resource not found</td>
                            </tr>
                            <tr className="border-b border-border/50">
                              <td className="p-2"><code>405</code></td>
                              <td className="p-2">Method Not Allowed - Wrong HTTP method</td>
                            </tr>
                            <tr className="border-b border-border/50">
                              <td className="p-2"><code>429</code></td>
                              <td className="p-2">Too Many Requests - Rate limit exceeded</td>
                            </tr>
                            <tr>
                              <td className="p-2"><code>500</code></td>
                              <td className="p-2">Internal Server Error - Server error</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Common Error Messages</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• <code className="bg-muted px-1 rounded">"API key required"</code> - Missing API key in request</li>
                        <li>• <code className="bg-muted px-1 rounded">"Invalid API key"</code> - API key not found or invalid</li>
                        <li>• <code className="bg-muted px-1 rounded">"API key is disabled"</code> - API key exists but is inactive</li>
                        <li>• <code className="bg-muted px-1 rounded">"Missing required fields"</code> - Required fields missing from payload</li>
                        <li>• <code className="bg-muted px-1 rounded">"Rate limit exceeded"</code> - Too many requests in time window</li>
                        <li>• <code className="bg-muted px-1 rounded">"Strategy not found"</code> - Strategy ID doesn't exist</li>
                        <li>• <code className="bg-muted px-1 rounded">"Invalid token"</code> - Strategy token doesn't match</li>
                        <li>• <code className="bg-muted px-1 rounded">"Duplicate signal ignored"</code> - Signal was a duplicate</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Handling Rate Limits</h4>
                      <p className="text-muted-foreground mb-3">
                        When you receive a <code className="bg-muted px-1 rounded">429 Too Many Requests</code> response, implement exponential backoff:
                      </p>
                      <CodeBlock
                        id="rate-limit-handling"
                        language="javascript"
                        code={`async function sendSignalWithRetry(data, retries = 3) {
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
}`}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="mt-12 p-6 bg-muted/50 border border-border rounded-lg">
              <h3 className="font-semibold mb-2">Need Help?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                For API support and questions, contact us at{' '}
                <a href="mailto:support@trademoq.com" className="text-primary hover:underline">
                  support@trademoq.com
                </a>
              </p>
              <div className="flex gap-2">
                <Link to="/dashboard/api-keys">
                  <Button variant="outline" size="sm">
                    Manage API Keys
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button variant="outline" size="sm">
                    Contact Support
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border py-8 px-6 bg-muted/10">
          <div className="container mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              © 2026 TradeMoq. All rights reserved.
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link to="/api-docs" className="text-foreground font-medium">API Docs</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default ApiDocs;
