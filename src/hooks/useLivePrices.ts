import { useState, useEffect, useCallback, useRef } from 'react';

interface PriceData {
  price: number;
  change: number;
  changePercent: number;
}

interface PricesResponse {
  prices: Record<string, PriceData | null>;
  cached: number;
  fetched: number;
  timestamp: string;
}

interface UseLivePricesOptions {
  /** Polling interval in milliseconds (default: 30000 = 30 seconds) */
  pollingInterval?: number;
  /** Whether to enable polling (default: true) */
  enabled?: boolean;
}

interface PriceWithPnL extends PriceData {
  pnl: number;
  pnlPercent: number;
}

interface UseLivePricesReturn {
  /** Current prices for all symbols */
  prices: Record<string, PriceData | null>;
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Last update timestamp */
  lastUpdated: Date | null;
  /** Manually refresh prices */
  refresh: () => Promise<void>;
  /** Calculate P&L for a trade */
  calculatePnL: (symbol: string, entryPrice: number, direction: 'long' | 'short', quantity?: number) => {
    currentPrice: number | null;
    pnl: number | null;
    pnlPercent: number | null;
  };
}

/**
 * Hook for fetching live prices from Yahoo Finance via the /api/prices endpoint
 * 
 * @param symbols - Array of stock symbols to track (e.g., ['AAPL', 'MSFT', 'TSLA'])
 * @param options - Configuration options
 * @returns Prices, loading state, error, and utility functions
 * 
 * @example
 * ```tsx
 * const { prices, loading, calculatePnL } = useLivePrices(['AAPL', 'TSLA']);
 * const { currentPrice, pnlPercent } = calculatePnL('AAPL', 150.00, 'long');
 * ```
 */
export function useLivePrices(
  symbols: string[],
  options: UseLivePricesOptions = {}
): UseLivePricesReturn {
  const { pollingInterval = 30000, enabled = true } = options;

  const [prices, setPrices] = useState<Record<string, PriceData | null>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Use ref to track the latest symbols to avoid stale closure issues
  const symbolsRef = useRef<string[]>(symbols);
  symbolsRef.current = symbols;

  const fetchPrices = useCallback(async () => {
    const currentSymbols = symbolsRef.current;
    
    if (currentSymbols.length === 0) {
      setPrices({});
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Normalize symbols
      const normalizedSymbols = currentSymbols
        .map(s => s.trim().toUpperCase())
        .filter(s => s.length > 0);

      if (normalizedSymbols.length === 0) {
        setPrices({});
        return;
      }

      const response = await fetch(`/api/prices?symbols=${normalizedSymbols.join(',')}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch prices: ${response.status}`);
      }

      const data: PricesResponse = await response.json();
      
      setPrices(data.prices);
      setLastUpdated(new Date(data.timestamp));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch prices';
      setError(message);
      console.error('Error fetching live prices:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and polling
  useEffect(() => {
    if (!enabled || symbols.length === 0) {
      return;
    }

    // Initial fetch
    fetchPrices();

    // Set up polling
    const intervalId = setInterval(fetchPrices, pollingInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [enabled, symbols.join(','), pollingInterval, fetchPrices]);

  const calculatePnL = useCallback(
    (symbol: string, entryPrice: number, direction: 'long' | 'short', quantity: number = 1) => {
      const symbolUpper = symbol.toUpperCase();
      const priceData = prices[symbolUpper];

      if (!priceData) {
        return {
          currentPrice: null,
          pnl: null,
          pnlPercent: null,
        };
      }

      const currentPrice = priceData.price;
      const priceDiff = currentPrice - entryPrice;
      
      // For long positions: profit when price goes up
      // For short positions: profit when price goes down
      const pnl = direction === 'long' 
        ? priceDiff * quantity
        : -priceDiff * quantity;
      
      const pnlPercent = direction === 'long'
        ? ((currentPrice - entryPrice) / entryPrice) * 100
        : ((entryPrice - currentPrice) / entryPrice) * 100;

      return {
        currentPrice,
        pnl,
        pnlPercent,
      };
    },
    [prices]
  );

  return {
    prices,
    loading,
    error,
    lastUpdated,
    refresh: fetchPrices,
    calculatePnL,
  };
}

/**
 * Helper function to format P&L percentage for display
 */
export function formatPnL(pnlPercent: number | null): string {
  if (pnlPercent === null) return '—';
  const sign = pnlPercent >= 0 ? '+' : '';
  return `${sign}${pnlPercent.toFixed(2)}%`;
}

/**
 * Helper function to get P&L color class
 */
export function getPnLColorClass(pnlPercent: number | null): string {
  if (pnlPercent === null) return 'text-muted-foreground';
  if (pnlPercent > 0) return 'text-buy';
  if (pnlPercent < 0) return 'text-sell';
  return 'text-muted-foreground';
}
