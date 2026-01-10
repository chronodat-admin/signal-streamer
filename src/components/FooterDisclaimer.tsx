import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

interface FooterDisclaimerProps {
  compact?: boolean;
}

export const FooterDisclaimer = ({ compact = false }: FooterDisclaimerProps) => {
  if (compact) {
    return (
      <div className="text-[11px] text-muted-foreground/70 leading-relaxed max-w-4xl mx-auto text-center">
        <span className="inline-flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          <strong>Risk Disclaimer:</strong>
        </span>{' '}
        TradeOrin is a signal routing platform only. We do not provide trading advice or recommendations. 
        Trading involves substantial risk of loss.{' '}
        <Link to="/terms" className="underline hover:text-foreground">
          Read full disclaimer
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-muted/30 border border-border/50 rounded-lg p-4 text-[11px] text-muted-foreground/80 leading-relaxed">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-500/70" />
        <div>
          <strong className="text-foreground/70 block mb-1">Important Disclaimer</strong>
          <p>
            TradeOrin is a signal routing and notification platform that allows users to receive, manage, and forward trading alerts. 
            We do not generate, provide, or recommend any trading signals, investment advice, or market analysis. 
            All trading decisions are made entirely by the user. Trading in financial markets involves substantial risk of loss 
            and is not suitable for all investors. Past performance is not indicative of future results. 
            Only trade with capital you can afford to lose.{' '}
            <Link to="/terms" className="text-primary hover:underline">
              Read full Terms of Service
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default FooterDisclaimer;

