// OpenAI helper for TradeMoq AI features
// Provides signal analysis, strategy descriptions, and trading insights

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

interface SignalData {
  signal_type: string;
  symbol: string;
  price: number;
  strategy_name: string;
  // Optional historical context
  win_rate?: number;
  total_trades?: number;
  // Enhanced context
  recent_signals?: Array<{
    signal_type: string;
    symbol: string;
    price?: number;
    pnl_percent?: number;
    created_at?: string;
  }>;
  // Strategy streak info
  current_streak?: number; // positive = winning streak, negative = losing streak
  streak_type?: 'winning' | 'losing' | 'none';
  // Symbol-specific stats
  symbol_stats?: {
    total_signals: number;
    wins: number;
    losses: number;
    avg_pnl: number;
    last_signal_type?: string;
    last_signal_result?: 'win' | 'loss' | 'open';
  };
  // Time context
  signals_today?: number;
  signals_this_week?: number;
}

interface AIInsight {
  insight: string;
  confidence?: 'high' | 'medium' | 'low';
  emoji?: string;
}

/**
 * Generate AI insight for a trading signal with enhanced context
 */
export async function generateSignalInsight(
  signal: SignalData,
  openaiApiKey: string
): Promise<AIInsight | null> {
  if (!openaiApiKey) {
    console.log("OpenAI API key not configured, skipping AI insight");
    return null;
  }

  try {
    const isBuy = signal.signal_type.toUpperCase() === "BUY" || signal.signal_type.toUpperCase() === "LONG";
    const signalAction = isBuy ? "buying" : "selling";
    
    // Build comprehensive context
    let strategyContext = "";
    let symbolContext = "";
    let streakContext = "";
    let activityContext = "";
    let confidence: 'high' | 'medium' | 'low' = 'medium';

    // Strategy performance context
    if (signal.win_rate !== undefined && signal.total_trades !== undefined && signal.total_trades >= 5) {
      strategyContext = `Strategy "${signal.strategy_name}" has ${signal.win_rate.toFixed(1)}% win rate over ${signal.total_trades} trades.`;
      
      if (signal.win_rate >= 60) {
        confidence = 'high';
      } else if (signal.win_rate < 45) {
        confidence = 'low';
      }
    }

    // Streak context
    if (signal.current_streak !== undefined && Math.abs(signal.current_streak) >= 2) {
      if (signal.current_streak > 0) {
        streakContext = `Currently on a ${signal.current_streak}-trade winning streak.`;
        if (signal.current_streak >= 4) confidence = 'high';
      } else {
        streakContext = `Currently on a ${Math.abs(signal.current_streak)}-trade losing streak.`;
        if (Math.abs(signal.current_streak) >= 3) confidence = 'low';
      }
    }

    // Symbol-specific context
    if (signal.symbol_stats) {
      const stats = signal.symbol_stats;
      if (stats.total_signals >= 3) {
        const symbolWinRate = stats.total_signals > 0 ? (stats.wins / stats.total_signals * 100) : 0;
        symbolContext = `For ${signal.symbol}: ${stats.wins}W/${stats.losses}L (${symbolWinRate.toFixed(0)}% win rate)`;
        
        if (stats.avg_pnl !== undefined && stats.avg_pnl !== 0) {
          symbolContext += `, avg P&L: ${stats.avg_pnl > 0 ? '+' : ''}${stats.avg_pnl.toFixed(2)}%`;
        }
        
        if (stats.last_signal_type && stats.last_signal_result) {
          const lastWasWin = stats.last_signal_result === 'win';
          const sameDirection = (stats.last_signal_type.toUpperCase() === 'BUY' || stats.last_signal_type.toUpperCase() === 'LONG') === isBuy;
          if (lastWasWin && sameDirection) {
            symbolContext += `. Last ${stats.last_signal_type} was profitable.`;
          }
        }
      }
    }

    // Recent activity context
    if (signal.recent_signals && signal.recent_signals.length > 0) {
      const recentWins = signal.recent_signals.filter(s => s.pnl_percent && s.pnl_percent > 0).length;
      const recentTotal = signal.recent_signals.filter(s => s.pnl_percent !== undefined).length;
      if (recentTotal >= 3) {
        activityContext = `Recent ${recentTotal} trades: ${recentWins} winners, ${recentTotal - recentWins} losers.`;
      }
      
      // Check for same symbol recent signals
      const sameSymbolRecent = signal.recent_signals.filter(s => s.symbol === signal.symbol);
      if (sameSymbolRecent.length > 0) {
        const lastSameSymbol = sameSymbolRecent[0];
        const timeSince = lastSameSymbol.created_at 
          ? Math.round((Date.now() - new Date(lastSameSymbol.created_at).getTime()) / (1000 * 60 * 60))
          : null;
        if (timeSince !== null && timeSince < 24) {
          activityContext += ` Last ${signal.symbol} signal was ${timeSince}h ago.`;
        }
      }
    }

    // Activity frequency context
    if (signal.signals_today !== undefined && signal.signals_today > 1) {
      activityContext += ` This is signal #${signal.signals_today} today.`;
    }

    const fullContext = [strategyContext, streakContext, symbolContext, activityContext]
      .filter(c => c.length > 0)
      .join(' ');

    const prompt = `You are an expert trading analyst assistant. Generate a specific, data-driven insight (max 20 words) for this trading signal.

SIGNAL DETAILS:
- Action: ${signal.signal_type.toUpperCase()} ${signal.symbol}
- Price: $${signal.price.toFixed(2)}
- Strategy: ${signal.strategy_name}

PERFORMANCE DATA:
${fullContext || "No historical data available for this strategy yet."}

INSTRUCTIONS:
1. If there's performance data, reference it specifically (e.g., "Strategy's 65% win rate supports this entry")
2. If there's a streak, mention it (e.g., "5-trade winning streak suggests momentum")
3. If symbol has good/bad history, note it (e.g., "AAPL signals have 80% accuracy historically")
4. If no data, give a brief technical context based on the strategy name (e.g., "20 SMA crossover typically indicates trend shift")
5. Be specific, not generic. Avoid phrases like "consider" or "potential"
6. Don't include emojis

GOOD EXAMPLES:
- "Strategy's 72% win rate and 4-trade streak favor this SELL entry"
- "CVX signals historically 3W/1L; current momentum supports position"
- "20 SMA crossover with 65% accuracy; third signal this week"
- "First signal after 2-trade losing streak; exercise caution"

BAD EXAMPLES (too generic):
- "Consider selling for potential profit"
- "This could be a good entry point"
- "Market conditions may favor this trade"`;

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a data-driven trading analyst. Provide specific, actionable insights based on the performance data provided. Always reference actual numbers when available. Keep responses under 20 words. Never be generic."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 60,
        temperature: 0.5, // Lower temperature for more consistent, data-driven responses
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI API error:", response.status, error);
      return null;
    }

    const data = await response.json();
    const insight = data.choices?.[0]?.message?.content?.trim();

    if (!insight) {
      return null;
    }

    return {
      insight,
      confidence,
      emoji: isBuy ? "📈" : "📉",
    };
  } catch (error) {
    console.error("Error generating signal insight:", error);
    return null;
  }
}

/**
 * Generate AI-powered strategy description based on trading history
 */
export async function generateStrategyDescription(
  data: {
    strategyName: string;
    exchange?: string;
    timeframe?: string;
    totalTrades: number;
    winRate: number;
    profitFactor: number;
    avgPnlPercent: number;
    topSymbols: string[];
    signalTypes: { buys: number; sells: number };
  },
  openaiApiKey: string
): Promise<string | null> {
  if (!openaiApiKey) {
    return null;
  }

  try {
    const prompt = `Generate a compelling 2-3 sentence description for this trading strategy that would attract followers:

Strategy Name: ${data.strategyName}
Exchange: ${data.exchange || "Multiple"}
Timeframe: ${data.timeframe || "Various"}
Performance Stats:
- Total Trades: ${data.totalTrades}
- Win Rate: ${data.winRate.toFixed(1)}%
- Profit Factor: ${data.profitFactor.toFixed(2)}
- Average P&L per Trade: ${data.avgPnlPercent.toFixed(2)}%
- Top Symbols: ${data.topSymbols.join(", ")}
- Signal Distribution: ${data.signalTypes.buys} buys, ${data.signalTypes.sells} sells

Write a professional, factual description that highlights the strategy's strengths. Be specific about the trading style based on the data. Don't exaggerate or make claims not supported by the data.`;

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a professional trading strategy copywriter. Write concise, factual descriptions that highlight a strategy's strengths without making unsubstantiated claims. Use professional finance language."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", response.status);
      return null;
    }

    const responseData = await response.json();
    return responseData.choices?.[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error("Error generating strategy description:", error);
    return null;
  }
}

/**
 * Generate weekly performance summary
 */
export async function generateWeeklySummary(
  data: {
    userName: string;
    totalSignals: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    totalPnlPercent: number;
    bestTrade: { symbol: string; pnlPercent: number } | null;
    worstTrade: { symbol: string; pnlPercent: number } | null;
    topStrategy: { name: string; winRate: number } | null;
  },
  openaiApiKey: string
): Promise<string | null> {
  if (!openaiApiKey) {
    return null;
  }

  try {
    const winRate = data.totalTrades > 0 
      ? ((data.winningTrades / data.totalTrades) * 100).toFixed(1)
      : "N/A";

    const prompt = `Generate a personalized weekly trading performance summary email for ${data.userName}:

This Week's Stats:
- Total Signals: ${data.totalSignals}
- Completed Trades: ${data.totalTrades}
- Winning Trades: ${data.winningTrades}
- Losing Trades: ${data.losingTrades}
- Win Rate: ${winRate}%
- Total P&L: ${data.totalPnlPercent >= 0 ? "+" : ""}${data.totalPnlPercent.toFixed(2)}%
${data.bestTrade ? `- Best Trade: ${data.bestTrade.symbol} (+${data.bestTrade.pnlPercent.toFixed(2)}%)` : ""}
${data.worstTrade ? `- Worst Trade: ${data.worstTrade.symbol} (${data.worstTrade.pnlPercent.toFixed(2)}%)` : ""}
${data.topStrategy ? `- Top Strategy: ${data.topStrategy.name} (${data.topStrategy.winRate.toFixed(1)}% win rate)` : ""}

Write a brief, encouraging summary (3-4 sentences) with one actionable tip based on the data. Be specific and data-driven. If performance was poor, be constructive not discouraging.`;

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a supportive trading coach. Write personalized, data-driven weekly summaries that are encouraging but honest. Include one specific, actionable tip based on the trader's performance."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", response.status);
      return null;
    }

    const responseData = await response.json();
    return responseData.choices?.[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error("Error generating weekly summary:", error);
    return null;
  }
}
