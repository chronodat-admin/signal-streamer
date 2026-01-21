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
  recent_signals?: Array<{
    signal_type: string;
    symbol: string;
    pnl_percent?: number;
  }>;
}

interface AIInsight {
  insight: string;
  confidence?: string;
  emoji?: string;
}

/**
 * Generate AI insight for a trading signal
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
    
    // Build context about the strategy
    let context = "";
    if (signal.win_rate !== undefined && signal.total_trades !== undefined) {
      context = `This strategy has a ${signal.win_rate.toFixed(1)}% win rate over ${signal.total_trades} trades. `;
    }
    if (signal.recent_signals && signal.recent_signals.length > 0) {
      const recentWins = signal.recent_signals.filter(s => s.pnl_percent && s.pnl_percent > 0).length;
      context += `Recent performance: ${recentWins}/${signal.recent_signals.length} profitable trades. `;
    }

    const prompt = `You are a concise trading assistant. Generate a brief, insightful one-liner (max 15 words) for this trading signal:

Signal: ${signal.signal_type.toUpperCase()} ${signal.symbol} at $${signal.price.toFixed(2)}
Strategy: ${signal.strategy_name}
${context}

Provide a quick insight about this trade. Be specific to the symbol if you know it (crypto, stock, forex).
Focus on being helpful, not generic. Don't include emojis.
Example good responses:
- "Breaking above key resistance, momentum looks strong"
- "Third consecutive buy signal this week - trend continuation"
- "Strategy is on a 5-trade winning streak"`;

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
            content: "You are a concise trading assistant. Provide brief, actionable insights for trading signals. Keep responses under 15 words. Be specific, not generic."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 50,
        temperature: 0.7,
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
