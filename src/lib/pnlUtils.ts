/**
 * Calculate percentage gain/loss between two prices
 */
export const calculatePnL = (entryPrice: number, exitPrice: number, signalType: string): number => {
  if (!entryPrice || !exitPrice) return 0;
  
  const type = signalType.toUpperCase();
  const isLong = type === 'BUY' || type === 'LONG';
  
  if (isLong) {
    // For long positions: profit when exit > entry
    return ((exitPrice - entryPrice) / entryPrice) * 100;
  } else {
    // For short positions: profit when exit < entry
    return ((entryPrice - exitPrice) / entryPrice) * 100;
  }
};

/**
 * Calculate P&L for a series of signals by pairing BUY/SELL signals
 */
export const calculateSignalPnL = (signals: Array<{
  id: string;
  signal_type: string;
  symbol: string;
  price: number;
  created_at: string;
}>): {
  totalPnL: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgGain: number;
  avgLoss: number;
  trades: Array<{
    entry: { id: string; price: number; time: string };
    exit: { id: string; price: number; time: string } | null;
    symbol: string;
    pnl: number;
    status: 'open' | 'closed';
  }>;
} => {
  // Sort signals by time
  const sortedSignals = [...signals].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const trades: Array<{
    entry: { id: string; price: number; time: string };
    exit: { id: string; price: number; time: string } | null;
    symbol: string;
    pnl: number;
    status: 'open' | 'closed';
  }> = [];

  const openPositions: Map<string, {
    entry: { id: string; price: number; time: string };
    symbol: string;
  }> = new Map();

  for (const signal of sortedSignals) {
    const type = signal.signal_type.toUpperCase();
    const isEntry = type === 'BUY' || type === 'LONG';
    const isExit = type === 'SELL' || type === 'SHORT';
    const key = signal.symbol;

    if (isEntry) {
      // Open a new position
      openPositions.set(key, {
        entry: {
          id: signal.id,
          price: signal.price,
          time: signal.created_at,
        },
        symbol: signal.symbol,
      });
    } else if (isExit && openPositions.has(key)) {
      // Close the position
      const position = openPositions.get(key)!;
      const pnl = calculatePnL(position.entry.price, signal.price, 'BUY');
      
      trades.push({
        entry: position.entry,
        exit: {
          id: signal.id,
          price: signal.price,
          time: signal.created_at,
        },
        symbol: signal.symbol,
        pnl,
        status: 'closed',
      });

      openPositions.delete(key);
    }
  }

  // Add open positions
  for (const [symbol, position] of openPositions.entries()) {
    // Use latest price for open positions (or mark as open)
    trades.push({
      entry: position.entry,
      exit: null,
      symbol: position.symbol,
      pnl: 0,
      status: 'open',
    });
  }

  const closedTrades = trades.filter((t) => t.status === 'closed');
  const winningTrades = closedTrades.filter((t) => t.pnl > 0);
  const losingTrades = closedTrades.filter((t) => t.pnl < 0);

  const totalPnL = closedTrades.reduce((sum, t) => sum + t.pnl, 0);
  const avgGain = winningTrades.length > 0
    ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length
    : 0;
  const avgLoss = losingTrades.length > 0
    ? Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length)
    : 0;

  return {
    totalPnL,
    totalTrades: closedTrades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    avgGain,
    avgLoss,
    trades,
  };
};

/**
 * Format P&L percentage with color
 */
export const formatPnL = (pnl: number): { value: string; className: string } => {
  const sign = pnl >= 0 ? '+' : '';
  const value = `${sign}${pnl.toFixed(2)}%`;
  const className = pnl > 0 ? 'text-buy' : pnl < 0 ? 'text-sell' : 'text-muted-foreground';
  return { value, className };
};


