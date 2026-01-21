export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: string;
  readTime: string;
  category: string;
  tags: string[];
  featuredImage?: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'getting-started-with-trademoq',
    title: 'Getting Started with TradeMoq: Your Complete Guide',
    excerpt: 'Learn how to set up your TradeMoq account and connect your first TradingView strategy in under 5 minutes.',
    author: 'TradeMoq Team',
    publishedAt: '2026-01-15',
    readTime: '5 min read',
    category: 'Getting Started',
    tags: ['tutorial', 'beginner', 'setup'],
    content: `
## Welcome to TradeMoq

TradeMoq is a real-time trading signal tracking platform that helps traders monitor, analyze, and share their trading signals. Whether you're a day trader, swing trader, or algorithmic trading enthusiast, TradeMoq provides the tools you need to track your performance.

## Why Use a Signal Tracker?

Manual signal tracking is time-consuming and error-prone. Traders often lose valuable signals because they weren't watching at the right moment, or they make mistakes when logging trades in spreadsheets. TradeMoq solves these problems by:

- **Automatically capturing signals** from TradingView webhooks
- **Organizing signals by strategy** for better analysis
- **Providing real-time analytics** on your trading performance
- **Enabling signal sharing** with public strategy pages

## Setting Up Your First Strategy

Getting started with TradeMoq takes less than 5 minutes:

### Step 1: Create Your Account

Sign up for a free account at TradeMoq. No credit card required - you can start tracking signals immediately with our free tier.

### Step 2: Create a Strategy

Navigate to the Dashboard and click "New Strategy". Give your strategy a descriptive name like "BTC 15min Scalper" or "ETH Daily Swing". You can add a description to help you remember what this strategy is for.

### Step 3: Copy Your Webhook URL

Once your strategy is created, you'll see a unique webhook URL. This is the endpoint where TradingView will send your signals. Copy this URL - you'll need it in the next step.

### Step 4: Configure TradingView

In TradingView:
1. Create or edit an alert on your strategy
2. In the "Notifications" tab, check "Webhook URL"
3. Paste your TradeMoq webhook URL
4. Set up your alert message in JSON format

Here's a simple template:

\`\`\`json
{
  "action": "{{strategy.order.action}}",
  "symbol": "{{ticker}}",
  "price": {{close}},
  "time": "{{time}}"
}
\`\`\`

### Step 5: Start Tracking

That's it! Your signals will now flow into TradeMoq in real-time. Watch them appear on your dashboard with sub-50ms latency.

## What's Next?

Now that you're set up, explore these features:

- **Analytics Dashboard**: View your win rates, signal frequency, and timing patterns
- **CSV Export**: Download your signal data for external analysis
- **Public Pages**: Share your track record with a unique public URL

Happy trading!
    `
  },
  {
    slug: 'understanding-tradingview-webhooks',
    title: 'Understanding TradingView Webhooks: A Deep Dive',
    excerpt: 'Master TradingView webhooks and learn how to configure them for optimal signal delivery to TradeMoq.',
    author: 'TradeMoq Team',
    publishedAt: '2026-01-12',
    readTime: '8 min read',
    category: 'Technical Guide',
    tags: ['tradingview', 'webhooks', 'integration', 'technical'],
    content: `
## What Are TradingView Webhooks?

Webhooks are HTTP callbacks that TradingView sends to a specified URL when an alert triggers. Think of them as automated messages that notify external services (like TradeMoq) about trading events in real-time.

When your Pine Script strategy generates a buy or sell signal, TradingView can instantly send that information to any URL you specify. This is the foundation of automated signal tracking.

## How TradingView Webhooks Work

Here's the flow:

1. Your Pine Script strategy generates a signal (buy/sell)
2. TradingView triggers the associated alert
3. TradingView sends an HTTP POST request to your webhook URL
4. The receiving service (TradeMoq) processes the signal
5. You see the signal in your dashboard

The entire process happens in milliseconds, ensuring you never miss a signal.

## Configuring Your Webhook Payload

The webhook payload is the data TradingView sends with each alert. You have full control over this using TradingView's placeholder variables.

### Available Placeholders

TradingView provides several useful placeholders:

- \`{{strategy.order.action}}\` - The action (buy/sell)
- \`{{ticker}}\` - The trading symbol
- \`{{close}}\` - Current closing price
- \`{{time}}\` - Alert trigger time
- \`{{strategy.order.contracts}}\` - Position size
- \`{{strategy.position_size}}\` - Current position
- \`{{interval}}\` - Chart timeframe

### Recommended JSON Structure

For optimal integration with TradeMoq, use this JSON structure:

\`\`\`json
{
  "action": "{{strategy.order.action}}",
  "symbol": "{{ticker}}",
  "price": {{close}},
  "contracts": {{strategy.order.contracts}},
  "position": {{strategy.position_size}},
  "time": "{{time}}",
  "interval": "{{interval}}"
}
\`\`\`

### Adding Custom Data

You can also include static values or custom identifiers:

\`\`\`json
{
  "action": "{{strategy.order.action}}",
  "symbol": "{{ticker}}",
  "price": {{close}},
  "strategy_name": "My BTC Scalper",
  "exchange": "Binance",
  "notes": "High momentum setup"
}
\`\`\`

## Common Webhook Issues and Solutions

### Issue: Signals Not Arriving

**Causes:**
- Incorrect webhook URL
- TradingView alert is paused
- JSON syntax errors in payload

**Solutions:**
- Double-check your webhook URL for typos
- Ensure your alert is active (not paused)
- Validate your JSON using a JSON validator

### Issue: Missing Data in Signals

**Causes:**
- Placeholders not wrapped in curly braces
- Using string quotes around numeric values

**Solutions:**
- Always use double curly braces: \`{{placeholder}}\`
- Don't quote numeric values: \`"price": {{close}}\` not \`"price": "{{close}}"\`

### Issue: Delayed Signals

**Causes:**
- Network latency
- TradingView server load during high-volume periods

**Solutions:**
- TradeMoq's infrastructure is optimized for low latency (<50ms)
- Most delays occur on TradingView's side during market opens

## Security Best Practices

### Use HTTPS

Always use HTTPS webhook URLs. TradeMoq provides HTTPS endpoints by default.

### Validate Incoming Signals

TradeMoq validates all incoming webhooks to prevent unauthorized signals from being recorded.

### Keep Your Webhook URL Private

Your webhook URL is like a password - don't share it publicly. If compromised, generate a new one from your strategy settings.

## Testing Your Webhook

Before relying on your webhook for real signals:

1. Set up a test alert with "Once Per Bar Close"
2. Use a short timeframe (1 minute) for quick testing
3. Verify signals appear in your TradeMoq dashboard
4. Check that all data fields are populated correctly

## Conclusion

Webhooks are the bridge between your TradingView strategies and TradeMoq's tracking system. By understanding how they work and following best practices, you'll have a reliable signal tracking setup that captures every trade.
    `
  },
  {
    slug: 'building-profitable-signal-strategies',
    title: 'Building Profitable Signal Strategies: Best Practices',
    excerpt: 'Discover the key principles for creating trading strategies that generate actionable, trackable signals.',
    author: 'TradeMoq Team',
    publishedAt: '2026-01-10',
    readTime: '10 min read',
    category: 'Strategy',
    tags: ['strategy', 'trading', 'signals', 'best-practices'],
    content: `
## The Anatomy of a Good Trading Signal

Not all trading signals are created equal. A well-designed signal should be:

- **Clear**: Unambiguous buy or sell action
- **Timely**: Generated at the optimal entry point
- **Measurable**: Easy to track and analyze
- **Reproducible**: Based on defined rules, not gut feelings

## Designing Signals for Trackability

When building strategies with TradeMoq in mind, consider these principles:

### 1. Use Clear Entry and Exit Signals

Ambiguous signals like "consider buying" are hard to track. Instead, use definitive actions:

- BUY / LONG
- SELL / SHORT
- CLOSE / EXIT

This makes performance analysis straightforward.

### 2. Include Relevant Metadata

The more context you include with each signal, the better your analysis will be:

- **Symbol**: What you're trading
- **Price**: Entry/exit price
- **Timeframe**: Chart interval
- **Reason**: Why the signal triggered (optional but helpful)

### 3. Avoid Over-Signaling

Strategies that generate too many signals often suffer from:
- Higher transaction costs
- More false positives
- Difficult performance tracking

Aim for quality over quantity.

## Strategy Types and Signal Patterns

### Trend Following

**Characteristics:**
- Fewer signals (trades with the trend)
- Higher win rate potential
- Longer holding periods

**Signal Pattern Example:**
- BUY when price crosses above 50 EMA and RSI > 50
- SELL when price crosses below 50 EMA or RSI < 30

### Mean Reversion

**Characteristics:**
- More frequent signals
- Quick entries and exits
- Relies on overbought/oversold conditions

**Signal Pattern Example:**
- BUY when RSI < 30 and price touches lower Bollinger Band
- SELL when RSI > 70 or price touches middle Bollinger Band

### Breakout Trading

**Characteristics:**
- Signals cluster around key levels
- Higher volatility periods
- Requires careful stop management

**Signal Pattern Example:**
- BUY when price breaks above 20-period high with volume confirmation
- SELL when price breaks below entry by 2 ATR

## Optimizing for Signal Quality

### Backtesting Considerations

Before going live:
1. Test across multiple market conditions
2. Account for slippage and fees
3. Verify the strategy works on different timeframes
4. Check for overfitting to historical data

### Forward Testing

Even with good backtests, run your strategy in paper trading mode first:
1. Connect to TradeMoq
2. Track signals without real money
3. Compare actual execution to expected results
4. Refine based on real-time performance

## Using TradeMoq Analytics to Improve

Once you're tracking signals, use TradeMoq's analytics to:

### Identify Winning Patterns

- Which symbols perform best?
- What time of day generates the most profitable signals?
- Does signal frequency affect win rate?

### Spot Weaknesses

- Are certain market conditions causing losses?
- Is there a time lag between signal and optimal entry?
- Are some signals consistently unprofitable?

### Iterate and Improve

Use data to make informed adjustments:
- Add filters to reduce false signals
- Adjust parameters based on performance data
- Consider splitting into multiple specialized strategies

## Multi-Strategy Approach

Consider running multiple strategies simultaneously:

1. **Diversification**: Different strategies for different market conditions
2. **Risk Management**: Don't rely on a single approach
3. **Learning**: Compare what works across strategies

TradeMoq's multi-strategy support makes this easy - each strategy gets its own webhook and analytics.

## Conclusion

Building profitable signal strategies is an iterative process. Start with clear, trackable signals, use TradeMoq to gather data, and continuously refine your approach based on real performance metrics.

The best traders aren't those who never lose - they're those who learn from every signal and constantly improve.
    `
  },
  {
    slug: 'mastering-signal-analytics',
    title: 'Mastering Signal Analytics: Turn Data Into Insights',
    excerpt: 'Learn how to use TradeMoq\'s analytics dashboard to improve your trading performance and make data-driven decisions.',
    author: 'TradeMoq Team',
    publishedAt: '2026-01-08',
    readTime: '7 min read',
    category: 'Analytics',
    tags: ['analytics', 'performance', 'data', 'insights'],
    content: `
## Why Analytics Matter

In trading, what gets measured gets improved. Without proper analytics, you're flying blind - making decisions based on feelings rather than facts. TradeMoq's analytics dashboard transforms your raw signal data into actionable insights.

## Key Metrics Explained

### Win Rate

**What it is:** The percentage of signals that resulted in profitable trades.

**How to use it:**
- A win rate above 50% is generally good for trend-following strategies
- Mean reversion strategies may have higher win rates (60-70%)
- Win rate alone doesn't tell the whole story - consider it with risk/reward

**TradeMoq displays:** Overall win rate and win rate by symbol/timeframe

### Signal Frequency

**What it is:** How many signals your strategy generates over time.

**How to use it:**
- High frequency = more opportunities but higher transaction costs
- Low frequency = fewer trades but each signal may be higher quality
- Monitor for unusual spikes or drops in signal frequency

**TradeMoq displays:** Signals per day/week/month with trend visualization

### Timing Analysis

**What it is:** When your signals tend to occur.

**How to use it:**
- Identify your strategy's most active hours
- Understand if certain times produce better results
- Optimize your availability around high-signal periods

**TradeMoq displays:** Signal distribution by hour, day of week, and session

## Reading the Dashboard

### The Signal Feed

Your real-time signal feed shows:
- Latest signals as they arrive
- Signal type (BUY/SELL) with color coding
- Symbol and price information
- Timestamp with millisecond precision

Use this to:
- Verify signals are arriving correctly
- Spot patterns in signal flow
- React quickly to new signals if needed

### Performance Charts

Visual representations of your data:
- **Line charts**: Track cumulative performance over time
- **Bar charts**: Compare signals across different periods
- **Distribution charts**: Understand signal timing patterns

### Summary Statistics

Quick-glance metrics at the top of your dashboard:
- Total signals tracked
- Win rate percentage
- Most active symbol
- Average signals per day

## Advanced Analytics Techniques

### Comparing Strategies

If you run multiple strategies, compare their performance:

1. **Correlation**: Do they signal at the same time or diversify?
2. **Performance**: Which strategy has the best metrics?
3. **Consistency**: Which is most reliable across market conditions?

### Identifying Market Conditions

Your analytics can reveal market state:
- High signal frequency often indicates trending markets
- Low frequency may suggest consolidation
- Sudden changes in win rate might signal regime change

### Seasonal Patterns

Look for patterns over longer periods:
- Weekly patterns (e.g., Monday reversals)
- Monthly patterns (e.g., end-of-month flows)
- Session patterns (e.g., Asian vs US session)

## Data Export for Deep Analysis

TradeMoq's CSV export lets you:
- Import data into Excel or Google Sheets
- Run custom statistical analysis
- Create personalized visualizations
- Build reports for stakeholders

### What's Included in Exports

- All signal data (action, symbol, price, time)
- Strategy identifiers
- Custom fields from your webhook payload
- Precise timestamps for temporal analysis

### Analysis Ideas

With exported data, try:
- Calculate risk-adjusted returns
- Build correlation matrices between symbols
- Create custom visualizations
- Run regression analysis on signal success factors

## Turning Insights Into Action

Analytics are only valuable if you act on them:

### Weekly Review Process

1. Review the past week's signals
2. Identify best and worst performing periods
3. Note any unusual patterns
4. Plan adjustments for the coming week

### Monthly Strategy Assessment

1. Compare performance to previous months
2. Evaluate if the strategy still fits market conditions
3. Consider parameter adjustments based on data
4. Document learnings for future reference

### Continuous Improvement Cycle

1. **Observe**: Track signals and gather data
2. **Analyze**: Use TradeMoq analytics to find patterns
3. **Hypothesize**: Form theories about improvements
4. **Test**: Implement changes carefully
5. **Repeat**: Continue the cycle

## Conclusion

Your signals contain a wealth of information about your trading approach. TradeMoq's analytics dashboard makes this data accessible and actionable. By regularly reviewing your metrics and acting on insights, you'll steadily improve your trading performance over time.

Remember: The goal isn't perfect signals - it's continuous improvement based on real data.
    `
  },
  {
    slug: 'sharing-strategies-public-pages',
    title: 'Sharing Your Track Record: Public Strategy Pages',
    excerpt: 'Discover how to use TradeMoq\'s public strategy pages to build credibility and grow your trading community.',
    author: 'TradeMoq Team',
    publishedAt: '2026-01-05',
    readTime: '6 min read',
    category: 'Features',
    tags: ['public-pages', 'sharing', 'community', 'signal-provider'],
    content: `
## Why Share Your Trading Signals?

Sharing your trading track record serves multiple purposes:

- **Build Credibility**: Verified, real-time signals prove your trading ability
- **Grow Community**: Attract followers interested in your strategies
- **Accountability**: Public tracking keeps you disciplined
- **Monetization**: Establish yourself as a signal provider

## TradeMoq Public Strategy Pages

Public strategy pages give you a shareable URL where anyone can view your signal history and performance. Unlike screenshots or claims, these are verified signals delivered through webhooks - impossible to fake.

### What's Displayed

Public pages show:
- Recent signals (action, symbol, price, time)
- Performance metrics (win rate, signal count)
- Signal frequency patterns
- Strategy description

### What's Protected

Your privacy is maintained:
- Webhook URL remains private
- Personal account details hidden
- Full historical data access controlled by you

## Setting Up a Public Page

### Step 1: Enable Public Sharing

In your strategy settings:
1. Navigate to the strategy you want to share
2. Find the "Public Page" section
3. Toggle "Enable Public Page"

### Step 2: Customize Your URL

Create a memorable slug for your strategy:
- Good: \`trademoq.com/s/btc-momentum-master\`
- Avoid: \`trademoq.com/s/strategy123\`

Choose something that reflects your trading style or brand.

### Step 3: Add a Description

Write a compelling description:
- Explain your trading approach
- Mention the assets you trade
- Set expectations about signal frequency
- Include any relevant disclaimers

### Step 4: Share Your Link

Once enabled, share your link:
- Social media (Twitter, Discord, Telegram)
- Trading forums and communities
- Your personal website or blog
- Email newsletters

## Building an Audience

### Consistency is Key

Regular, quality signals build trust:
- Stick to your strategy rules
- Don't cherry-pick what to share
- Let the data speak for itself

### Engage with Followers

If you share on social media:
- Explain your reasoning (when appropriate)
- Answer questions about your approach
- Share insights from your analytics

### Provide Context

Raw signals are more valuable with context:
- Market conditions when signals triggered
- How signals fit into your overall approach
- What to expect in different market regimes

## Use Cases for Public Pages

### For Individual Traders

- Track record documentation
- Personal accountability
- Learning from past signals

### For Signal Providers

- Proof of performance
- Marketing tool for signal services
- Transparent track record for clients

### For Trading Communities

- Share strategies within groups
- Compare approaches between members
- Educational resource for new traders

### For Fund Managers

- Investor transparency
- Compliance documentation
- Performance verification

## Best Practices

### Be Transparent

- Share both winning and losing signals
- Don't delete signals after the fact
- Include disclaimers about past performance

### Manage Expectations

- Clearly state your trading style
- Explain typical signal frequency
- Note that results may vary

### Protect Yourself

- Include appropriate disclaimers
- Don't promise specific returns
- Make clear this isn't financial advice

## Privacy Considerations

You control what's shared:
- Only enabled strategies are public
- You can disable at any time
- Historical data can be controlled

Consider:
- Position sizing remains private
- Your identity is what you make it
- You can use pseudonymous accounts

## Leveraging Public Pages for Growth

### Build a Track Record First

Before promoting heavily:
1. Track signals for at least 30 days
2. Ensure your strategy is working as expected
3. Have meaningful data to show

### Start Small

Share with:
1. Close trading friends first
2. Small communities where you're active
3. Gradually expand as you're comfortable

### Be Patient

Building credibility takes time:
- Consistent signals > perfect signals
- Long track records > short impressive runs
- Transparent performance > marketing claims

## Conclusion

Public strategy pages are a powerful tool for building your reputation as a trader. By sharing verified, real-time signals, you create undeniable proof of your trading approach. Whether you're building a personal brand, growing a signal service, or just want accountability, public pages help you achieve your goals.

Start tracking today, and let your signals speak for themselves.
    `
  },
  {
    slug: 'api-keys-and-automation',
    title: 'API Keys and Advanced Automation with TradeMoq',
    excerpt: 'Learn how to use TradeMoq API keys to build custom integrations, automate workflows, and extend platform functionality.',
    author: 'TradeMoq Team',
    publishedAt: '2026-01-02',
    readTime: '9 min read',
    category: 'Technical Guide',
    tags: ['api', 'automation', 'integration', 'developer'],
    content: `
## Unlocking Advanced Capabilities

While TradeMoq's dashboard provides everything most traders need, API access opens up a world of possibilities for automation and custom integrations. This guide explains how to use API keys effectively.

## Understanding API Keys

### What Are API Keys?

API keys are secure credentials that allow external applications to interact with your TradeMoq account programmatically. They're like a password specifically for automated access.

### When to Use API Keys

Consider API access when you want to:
- Build custom dashboards or visualizations
- Integrate signals with other trading tools
- Automate signal processing workflows
- Create alerts on external platforms
- Build mobile apps or bots

## Getting Started with API Keys

### Creating an API Key

1. Navigate to Dashboard > API Keys
2. Click "Generate New Key"
3. Give your key a descriptive name
4. Set appropriate permissions
5. Copy and securely store your key

**Important:** Your API key is shown only once. Store it securely - you cannot retrieve it later.

### API Key Best Practices

- **One key per application**: Don't reuse keys across different integrations
- **Minimal permissions**: Only grant permissions the integration needs
- **Regular rotation**: Periodically generate new keys and retire old ones
- **Secure storage**: Never commit keys to version control or share publicly

## Common API Use Cases

### Custom Alerting

Build notifications beyond TradeMoq's built-in options:

\`\`\`javascript
// Example: Send signals to Telegram
async function forwardToTelegram(signal) {
  const message = \`🚨 New Signal: \${signal.action} \${signal.symbol} @ \${signal.price}\`;
  
  await fetch(\`https://api.telegram.org/bot\${BOT_TOKEN}/sendMessage\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: message
    })
  });
}
\`\`\`

### Data Aggregation

Combine TradeMoq data with other sources:

- Merge signals with market data feeds
- Correlate signals with news events
- Build comprehensive trading logs

### Trading Bot Integration

Connect signals to execution platforms:

\`\`\`python
# Example: Forward signal to trading bot
def process_signal(signal):
    if signal['action'] == 'BUY':
        execute_market_order(
            symbol=signal['symbol'],
            side='buy',
            quantity=calculate_position_size()
        )
\`\`\`

**Disclaimer:** Always test thoroughly and understand the risks of automated trading.

### Custom Analytics

Build specialized analysis tools:

- Backtesting frameworks
- Monte Carlo simulations
- Machine learning models
- Custom reporting

## API Rate Limits

TradeMoq implements rate limits to ensure platform stability:

| Plan | Requests per minute | Concurrent connections |
|------|--------------------|-----------------------|
| Free | 60 | 2 |
| Pro | 300 | 10 |
| Elite | 1200 | Unlimited |

### Handling Rate Limits

If you exceed limits:
1. Wait for the reset window
2. Implement exponential backoff
3. Cache responses when possible
4. Consider upgrading your plan for higher limits

## Security Considerations

### Protecting Your Keys

- Store in environment variables, not code
- Use secrets management tools
- Encrypt at rest when stored in databases
- Monitor for unauthorized usage

### Monitoring API Usage

Regularly check:
- Request volumes and patterns
- Failed authentication attempts
- Unusual access patterns
- Geographic locations of requests

### Revoking Compromised Keys

If you suspect a key is compromised:
1. Immediately revoke the key in your dashboard
2. Generate a new key
3. Update your integrations
4. Review access logs for unauthorized activity

## Building Robust Integrations

### Error Handling

Always handle potential errors:

\`\`\`javascript
async function fetchSignals() {
  try {
    const response = await fetch(API_URL, {
      headers: { 'Authorization': \`Bearer \${API_KEY}\` }
    });
    
    if (!response.ok) {
      throw new Error(\`API error: \${response.status}\`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch signals:', error);
    // Implement retry logic or fallback
  }
}
\`\`\`

### Webhook Verification

When receiving webhooks from TradeMoq:
- Verify the request signature
- Check timestamps to prevent replay attacks
- Validate payload structure

### Idempotency

Design integrations to handle duplicate events:
- Use signal IDs for deduplication
- Make operations idempotent
- Handle retries gracefully

## Example Projects

### Discord Bot

Post signals to a Discord channel:
- Real-time signal notifications
- Performance summaries on demand
- Interactive commands for signal queries

### Google Sheets Integration

Automatically log signals to a spreadsheet:
- Backup your signal data
- Create custom analytics
- Share with team members

### Mobile Push Notifications

Get alerts on your phone:
- Integrate with Pushover or similar
- Set up filters for important signals only
- Include key signal details

## Conclusion

API keys unlock TradeMoq's full potential for automation and integration. Whether you're building custom dashboards, connecting to trading bots, or creating novel applications, programmatic access gives you complete control over your signal data.

Start with simple integrations and gradually build more complex workflows as you become comfortable with the API. The possibilities are limited only by your imagination.

Remember to always prioritize security and test thoroughly before deploying any automated systems.
    `
  }
];

export const getBlogPost = (slug: string): BlogPost | undefined => {
  return blogPosts.find(post => post.slug === slug);
};

export const getBlogPostsByCategory = (category: string): BlogPost[] => {
  return blogPosts.filter(post => post.category === category);
};

export const getBlogPostsByTag = (tag: string): BlogPost[] => {
  return blogPosts.filter(post => post.tags.includes(tag));
};

export const getCategories = (): string[] => {
  return [...new Set(blogPosts.map(post => post.category))];
};

export const getAllTags = (): string[] => {
  const tags = blogPosts.flatMap(post => post.tags);
  return [...new Set(tags)];
};
