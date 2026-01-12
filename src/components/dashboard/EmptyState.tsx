import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { LucideIcon, Plus, Sparkles, Zap, TrendingUp, Radio, Plug, FileText, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  variant?: 'default' | 'minimal' | 'illustration';
  className?: string;
  children?: ReactNode;
}

// Animated floating particles for visual interest
const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/20 rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
    <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-primary/30 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
    <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-primary/25 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
    <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-primary/15 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />
  </div>
);

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  variant = 'default',
  className,
  children,
}: EmptyStateProps) => {
  const ActionButton = action && (
    action.href ? (
      <Link to={action.href}>
        <Button className="gap-2 shadow-md hover:shadow-lg transition-all">
          <Plus className="h-4 w-4" />
          {action.label}
        </Button>
      </Link>
    ) : (
      <Button onClick={action.onClick} className="gap-2 shadow-md hover:shadow-lg transition-all">
        <Plus className="h-4 w-4" />
        {action.label}
      </Button>
    )
  );

  const SecondaryButton = secondaryAction && (
    secondaryAction.href ? (
      <Link to={secondaryAction.href}>
        <Button variant="outline" className="gap-2">
          {secondaryAction.label}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    ) : (
      <Button variant="outline" onClick={secondaryAction.onClick} className="gap-2">
        {secondaryAction.label}
        <ArrowRight className="h-4 w-4" />
      </Button>
    )
  );

  if (variant === 'minimal') {
    return (
      <div className={cn("text-center py-12 px-6", className)}>
        {Icon && (
          <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
            <Icon className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <h3 className="text-base font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        {action && (
          <div className="flex items-center justify-center gap-3">
            {ActionButton}
            {SecondaryButton}
          </div>
        )}
        {children}
      </div>
    );
  }

  if (variant === 'illustration') {
    return (
      <div className={cn("relative text-center py-16 px-6", className)}>
        <FloatingParticles />
        
        {/* Decorative rings */}
        <div className="relative mx-auto w-32 h-32 mb-6">
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/20 animate-[spin_20s_linear_infinite]" />
          <div className="absolute inset-4 rounded-full border border-primary/10" />
          <div className="absolute inset-0 flex items-center justify-center">
            {Icon && (
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg">
                <Icon className="h-8 w-8 text-primary" />
              </div>
            )}
          </div>
        </div>
        
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">{description}</p>
        
        {action && (
          <div className="flex items-center justify-center gap-3">
            {ActionButton}
            {SecondaryButton}
          </div>
        )}
        {children}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn("relative text-center py-16 px-6 rounded-xl bg-gradient-to-b from-muted/30 to-transparent", className)}>
      <FloatingParticles />
      
      {Icon && (
        <div className="relative mx-auto w-20 h-20 mb-5">
          <div className="absolute inset-0 bg-primary/10 rounded-2xl rotate-6" />
          <div className="absolute inset-0 bg-primary/5 rounded-2xl -rotate-3" />
          <div className="relative h-full w-full rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center shadow-sm">
            <Icon className="h-9 w-9 text-muted-foreground" />
          </div>
        </div>
      )}
      
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm mx-auto mb-6">{description}</p>
      
      {action && (
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {ActionButton}
          {SecondaryButton}
        </div>
      )}
      {children}
    </div>
  );
};

// Pre-configured empty states for common scenarios
export const EmptyStrategies = ({ onCreateClick }: { onCreateClick?: () => void }) => {
  const { t } = useLanguage();
  return (
    <EmptyState
      icon={Sparkles}
      title={t.empty.noStrategies}
      description={t.empty.noStrategiesDescription}
      action={{
        label: t.strategies.newStrategy,
        onClick: onCreateClick,
      }}
      secondaryAction={{
        label: t.integrations.learnMore,
        href: "/pricing",
      }}
      variant="illustration"
    />
  );
};

export const EmptySignals = ({ hasStrategies = false }: { hasStrategies?: boolean }) => {
  const { t } = useLanguage();
  return (
    <EmptyState
      icon={Radio}
      title={t.empty.noSignals}
      description={
        hasStrategies
          ? t.empty.noSignalsDescription
          : t.empty.noStrategiesDescription
      }
      action={
        !hasStrategies
          ? {
              label: t.strategies.newStrategy,
              href: "/dashboard/strategies",
            }
          : undefined
      }
      variant="default"
    />
  );
};

export const EmptyTrades = ({ type = 'open' }: { type?: 'open' | 'closed' }) => {
  const { t } = useLanguage();
  return (
    <EmptyState
      icon={TrendingUp}
      title={type === 'open' ? t.empty.noOpenTrades : t.empty.noClosedTrades}
      description={
        type === 'open'
          ? t.empty.noOpenTradesDescription
          : t.empty.noClosedTradesDescription
      }
      variant="minimal"
    />
  );
};

export const EmptyIntegrations = ({ onCreateClick }: { onCreateClick?: () => void }) => {
  const { t } = useLanguage();
  return (
    <EmptyState
      icon={Plug}
      title={t.empty.noResults}
      description={t.integrations.tradingViewDescription}
      action={{
        label: t.common.add,
        onClick: onCreateClick,
      }}
      variant="default"
    />
  );
};

export const EmptyAlertLogs = () => {
  const { t } = useLanguage();
  return (
    <EmptyState
      icon={FileText}
      title={t.empty.noResults}
      description={t.alertLogs.title}
      secondaryAction={{
        label: t.integrations.configure,
        href: "/dashboard/integrations",
      }}
      variant="minimal"
    />
  );
};

export const NoSearchResults = ({ query }: { query: string }) => {
  const { t } = useLanguage();
  return (
    <EmptyState
      icon={Zap}
      title={t.empty.noResults}
      description={t.empty.noResultsDescription.replace('{query}', query)}
      variant="minimal"
    />
  );
};






