import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Copy, Check, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AIDescriptionGeneratorProps {
  strategyId: string;
  strategyName: string;
  currentDescription?: string;
  onDescriptionGenerated: (description: string) => void;
}

interface StrategyData {
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  avgPnlPercent: number;
  topSymbols: string[];
  signalTypes: { buys: number; sells: number };
  exchange?: string;
  timeframe?: string;
}

export function AIDescriptionGenerator({
  strategyId,
  strategyName,
  currentDescription,
  onDescriptionGenerated,
}: AIDescriptionGeneratorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [generatedDescription, setGeneratedDescription] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchStrategyData = async (): Promise<StrategyData | null> => {
    try {
      // Fetch strategy stats
      const { data: stats } = await supabase
        .from('strategy_stats')
        .select('*')
        .eq('strategy_id', strategyId)
        .maybeSingle();

      // Fetch strategy details
      const { data: strategy } = await supabase
        .from('strategies')
        .select('exchange, timeframe')
        .eq('id', strategyId)
        .single();

      // Fetch recent signals to get top symbols
      const { data: signals } = await supabase
        .from('signals')
        .select('symbol, signal_type')
        .eq('strategy_id', strategyId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!stats || stats.total_trades < 5) {
        return null;
      }

      // Calculate top symbols
      const symbolCounts: Record<string, number> = {};
      let buys = 0;
      let sells = 0;

      signals?.forEach((s) => {
        symbolCounts[s.symbol] = (symbolCounts[s.symbol] || 0) + 1;
        const type = s.signal_type.toUpperCase();
        if (type === 'BUY' || type === 'LONG') buys++;
        else if (type === 'SELL' || type === 'SHORT') sells++;
      });

      const topSymbols = Object.entries(symbolCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([symbol]) => symbol);

      return {
        totalTrades: stats.total_trades,
        winRate: Number(stats.win_rate) || 0,
        profitFactor: Number(stats.profit_factor) || 0,
        avgPnlPercent: Number((stats as any).avg_pnl_percent) || 0,
        topSymbols,
        signalTypes: { buys, sells },
        exchange: strategy?.exchange || undefined,
        timeframe: strategy?.timeframe || undefined,
      };
    } catch (error) {
      console.error('Error fetching strategy data:', error);
      return null;
    }
  };

  const generateDescription = async () => {
    setLoading(true);
    setGeneratedDescription(null);

    try {
      const strategyData = await fetchStrategyData();

      if (!strategyData) {
        toast({
          title: 'Not enough data',
          description: 'Your strategy needs at least 5 completed trades to generate an AI description.',
          variant: 'destructive',
        });
        return;
      }

      // Call AI edge function
      const { data, error } = await supabase.functions.invoke('ai-generate-description', {
        body: {
          strategyName,
          ...strategyData,
        },
      });

      if (error) throw error;

      if (data?.description) {
        setGeneratedDescription(data.description);
      } else {
        throw new Error('No description generated');
      }
    } catch (error: any) {
      console.error('Error generating description:', error);
      toast({
        title: 'Generation failed',
        description: error.message || 'Failed to generate AI description. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (generatedDescription) {
      navigator.clipboard.writeText(generatedDescription);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUse = () => {
    if (generatedDescription) {
      onDescriptionGenerated(generatedDescription);
      toast({
        title: 'Description applied',
        description: 'AI-generated description has been applied to your strategy.',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">AI Description Generator</span>
          <Badge variant="secondary" className="text-xs">Beta</Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={generateDescription}
          disabled={loading}
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : generatedDescription ? (
            <>
              <RefreshCw className="h-4 w-4" />
              Regenerate
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate with AI
            </>
          )}
        </Button>
      </div>

      {generatedDescription && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">AI-Generated Description</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-7 gap-1 text-xs"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
            <p className="text-sm leading-relaxed">{generatedDescription}</p>
            <Button
              size="sm"
              onClick={handleUse}
              className="w-full gap-2"
            >
              <Check className="h-4 w-4" />
              Use This Description
            </Button>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        AI analyzes your trading history to generate a compelling, data-driven description that attracts followers.
        Requires at least 5 completed trades.
      </p>
    </div>
  );
}
