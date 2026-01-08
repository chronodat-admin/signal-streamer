import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * API endpoint to retrieve the TradingView secret
 * 
 * This endpoint returns the TRADINGVIEW_SECRET value so users can
 * configure their TradingView alerts. The secret is used programmatically
 * but is masked in the UI for security.
 * 
 * Note: This endpoint is accessible to all users since the secret needs
 * to be included in TradingView webhook payloads. However, it's masked
 * in the UI display.
 * 
 * Environment Variables Required:
 * - TRADINGVIEW_SECRET: Secret value for TradingView webhook validation
 */

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only GET requests are allowed'
    });
  }

  try {
    const tradingviewSecret = process.env.TRADINGVIEW_SECRET;

    if (!tradingviewSecret) {
      return res.status(404).json({ 
        error: 'Not configured',
        message: 'TRADINGVIEW_SECRET is not configured. Please set it in Vercel environment variables.',
        secret: null
      });
    }

    // Return the secret (used programmatically, masked in UI)
    return res.status(200).json({ 
      secret: tradingviewSecret,
      message: 'TradingView secret retrieved successfully'
    });

  } catch (error) {
    console.error('Error retrieving TradingView secret:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      secret: null
    });
  }
}

