import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Price fetching endpoint using Yahoo Finance
 * 
 * GET /api/prices?symbols=AAPL,MSFT,TSLA
 * 
 * Returns: { prices: { AAPL: { price: 195.34, change: 2.5, changePercent: 1.3 }, ... } }
 */

// In-memory cache for prices (persists across requests in warm lambdas)
const priceCache: Map<string, { price: number; change: number; changePercent: number; timestamp: number }> = new Map();
const CACHE_TTL_MS = 30000; // 30 seconds cache

interface YahooQuoteResult {
  symbol: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketTime?: number;
}

interface YahooResponse {
  quoteResponse?: {
    result?: YahooQuoteResult[];
    error?: any;
  };
}

async function fetchYahooFinancePrices(symbols: string[]): Promise<Map<string, { price: number; change: number; changePercent: number }>> {
  const results = new Map<string, { price: number; change: number; changePercent: number }>();
  
  if (symbols.length === 0) {
    return results;
  }

  // Yahoo Finance batch quote endpoint
  const symbolsParam = symbols.join(',');
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbolsParam)}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Yahoo Finance API error: ${response.status} ${response.statusText}`);
      throw new Error(`Yahoo Finance API error: ${response.status}`);
    }

    const data: YahooResponse = await response.json();
    
    if (data.quoteResponse?.result) {
      for (const quote of data.quoteResponse.result) {
        if (quote.symbol && quote.regularMarketPrice !== undefined) {
          results.set(quote.symbol.toUpperCase(), {
            price: quote.regularMarketPrice,
            change: quote.regularMarketChange || 0,
            changePercent: quote.regularMarketChangePercent || 0,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error fetching Yahoo Finance prices:', error);
    // Try fallback endpoint for individual symbols
    for (const symbol of symbols) {
      try {
        const fallbackUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
        const fallbackResponse = await fetch(fallbackUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
          },
        });
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          const meta = fallbackData?.chart?.result?.[0]?.meta;
          if (meta?.regularMarketPrice) {
            results.set(symbol.toUpperCase(), {
              price: meta.regularMarketPrice,
              change: (meta.regularMarketPrice - (meta.previousClose || meta.regularMarketPrice)),
              changePercent: meta.previousClose 
                ? ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100 
                : 0,
            });
          }
        }
      } catch (fallbackError) {
        console.error(`Error fetching fallback price for ${symbol}:`, fallbackError);
      }
    }
  }

  return results;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { symbols } = req.query;

    if (!symbols || typeof symbols !== 'string') {
      return res.status(400).json({ 
        error: 'Missing symbols parameter',
        usage: 'GET /api/prices?symbols=AAPL,MSFT,TSLA'
      });
    }

    // Parse and normalize symbols
    const symbolList = symbols
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(s => s.length > 0 && s.length <= 10); // Basic validation

    if (symbolList.length === 0) {
      return res.status(400).json({ error: 'No valid symbols provided' });
    }

    if (symbolList.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 symbols allowed per request' });
    }

    const now = Date.now();
    const cachedPrices: Record<string, { price: number; change: number; changePercent: number }> = {};
    const symbolsToFetch: string[] = [];

    // Check cache for each symbol
    for (const symbol of symbolList) {
      const cached = priceCache.get(symbol);
      if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
        cachedPrices[symbol] = {
          price: cached.price,
          change: cached.change,
          changePercent: cached.changePercent,
        };
      } else {
        symbolsToFetch.push(symbol);
      }
    }

    // Fetch missing prices from Yahoo Finance
    let fetchedPrices: Map<string, { price: number; change: number; changePercent: number }> = new Map();
    if (symbolsToFetch.length > 0) {
      fetchedPrices = await fetchYahooFinancePrices(symbolsToFetch);
      
      // Update cache
      for (const [symbol, data] of fetchedPrices) {
        priceCache.set(symbol, { ...data, timestamp: now });
      }
    }

    // Combine cached and fetched prices
    const allPrices: Record<string, { price: number; change: number; changePercent: number } | null> = {};
    
    for (const symbol of symbolList) {
      if (cachedPrices[symbol]) {
        allPrices[symbol] = cachedPrices[symbol];
      } else if (fetchedPrices.has(symbol)) {
        allPrices[symbol] = fetchedPrices.get(symbol)!;
      } else {
        allPrices[symbol] = null; // Symbol not found
      }
    }

    return res.status(200).json({
      prices: allPrices,
      cached: Object.keys(cachedPrices).length,
      fetched: fetchedPrices.size,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error in prices endpoint:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
