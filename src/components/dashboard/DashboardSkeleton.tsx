import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Stats card skeleton
export const StatsCardSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
    </CardContent>
  </Card>
);

// Stats grid skeleton for dashboard
export const StatsGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
    {Array.from({ length: count }).map((_, i) => (
      <StatsCardSkeleton key={i} />
    ))}
  </div>
);

// Table skeleton with rows
export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-3 p-6">
    {/* Table header */}
    <div className="flex gap-4 pb-3 border-b">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-24" />
    </div>
    {/* Table rows */}
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 py-3 items-center">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
    ))}
  </div>
);

// Card skeleton for strategies
export const StrategyCardSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-64" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-10 rounded-full" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Integration card skeleton
export const IntegrationCardSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-start gap-4">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Full dashboard skeleton
export const DashboardPageSkeleton = () => (
  <div className="space-y-8 animate-fade-in">
    {/* Header */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-5 w-64" />
      </div>
      <Skeleton className="h-10 w-32 rounded-md" />
    </div>
    
    {/* Stats */}
    <StatsGridSkeleton count={6} />
    
    {/* Table card */}
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-28" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <TableSkeleton rows={5} />
      </CardContent>
    </Card>
  </div>
);

// Strategies page skeleton
export const StrategiesPageSkeleton = () => (
  <div className="space-y-8 animate-fade-in">
    {/* Header */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-5 w-56" />
      </div>
      <Skeleton className="h-10 w-36 rounded-md" />
    </div>
    
    {/* Plan info card */}
    <Card>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-9 w-20" />
      </CardContent>
    </Card>
    
    {/* Strategy cards */}
    <div className="grid gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <StrategyCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

// Signals page skeleton
export const SignalsPageSkeleton = () => (
  <div className="space-y-6 animate-fade-in">
    {/* Header */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-5 w-64" />
      </div>
      <Skeleton className="h-10 w-32 rounded-md" />
    </div>
    
    {/* Stats */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatsCardSkeleton key={i} />
      ))}
    </div>
    
    {/* Filters */}
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </div>
      </CardContent>
    </Card>
    
    {/* Table */}
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-24" />
      </CardHeader>
      <CardContent>
        <TableSkeleton rows={8} />
      </CardContent>
    </Card>
  </div>
);

// Integrations page skeleton
export const IntegrationsPageSkeleton = () => (
  <div className="space-y-6 animate-fade-in">
    {/* Header */}
    <div className="space-y-2">
      <Skeleton className="h-9 w-40" />
      <Skeleton className="h-5 w-80" />
    </div>
    
    {/* Search */}
    <Skeleton className="h-10 w-full rounded-md" />
    
    {/* Available Integrations */}
    <div>
      <Skeleton className="h-6 w-48 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <IntegrationCardSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
);





