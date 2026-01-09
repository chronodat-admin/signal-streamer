import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, Filter, RefreshCw, AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { usePreferences } from '@/hooks/usePreferences';
import { formatDate, formatDateTime } from '@/lib/formatUtils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyAlertLogs } from '@/components/dashboard/EmptyState';
import { useLanguage } from '@/i18n';

interface AlertLog {
  id: string;
  user_id: string;
  strategy_id: string | null;
  signal_id: string | null;
  integration_id: string | null;
  integration_type: string;
  status: 'success' | 'error' | 'pending';
  message: string | null;
  error_message: string | null;
  webhook_url: string | null;
  response_status: number | null;
  response_body: string | null;
  created_at: string;
  strategies?: { name: string };
  integrations?: { name: string };
  signals?: { symbol: string; signal_type: string };
}

export default function AlertLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AlertLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [integrationTypeFilter, setIntegrationTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const logsPerPage = 50;
  const { preferences } = usePreferences();
  const { t } = useLanguage();

  const fetchLogs = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('alert_logs')
        .select(`
          *,
          strategies(name),
          integrations(name),
          signals(symbol, signal_type)
        `, { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range((page - 1) * logsPerPage, page * logsPerPage - 1);

      console.log('Fetching logs for user:', user.id);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (integrationTypeFilter !== 'all') {
        query = query.eq('integration_type', integrationTypeFilter);
      }

      if (searchTerm) {
        query = query.or(`message.ilike.%${searchTerm}%,error_message.ilike.%${searchTerm}%,webhook_url.ilike.%${searchTerm}%`);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching logs:', error);
        throw error;
      }

      console.log('Fetched logs:', data?.length || 0, 'total:', count);
      setLogs(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [user, page, statusFilter, integrationTypeFilter]);

  const handleSearch = () => {
    setPage(1);
    fetchLogs();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle2 className="h-3 w-3 mr-1" />{t.alertLogs.success}</Badge>;
      case 'error':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20"><XCircle className="h-3 w-3 mr-1" />{t.alertLogs.error}</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><Clock className="h-3 w-3 mr-1" />{t.alertLogs.pending}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getIntegrationTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      discord: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
      slack: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      telegram: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      whatsapp: 'bg-green-500/10 text-green-500 border-green-500/20',
    };
    return <Badge className={colors[type] || 'bg-muted'}>{type}</Badge>;
  };

  const totalPages = Math.ceil(totalCount / logsPerPage);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">{t.alertLogs.title}</h1>
          <p className="text-muted-foreground mt-2">
            {t.alertLogs.subtitle}
          </p>
          {logs.length === 0 && !loading && (
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                <strong>{t.alertLogs.noLogsFound}</strong> {t.alertLogs.noLogsReason1}:
              </p>
              <ul className="list-disc list-inside mt-2 text-sm text-yellow-600 dark:text-yellow-400 space-y-1">
                <li>{t.alertLogs.noLogsReason1}</li>
                <li>{t.alertLogs.noLogsReason2}</li>
                <li>{t.alertLogs.noLogsReason3}</li>
              </ul>
              <p className="text-xs mt-2 text-muted-foreground">
                {t.alertLogs.checkSupabaseLogs}
              </p>
            </div>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="flex gap-2">
                  <Input
                    placeholder={t.alertLogs.searchLogs}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch} variant="outline">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t.alertLogs.filterByStatus} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.alertLogs.allStatuses}</SelectItem>
                  <SelectItem value="success">{t.alertLogs.success}</SelectItem>
                  <SelectItem value="error">{t.alertLogs.error}</SelectItem>
                  <SelectItem value="pending">{t.alertLogs.pending}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={integrationTypeFilter} onValueChange={setIntegrationTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t.alertLogs.filterByType} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.alertLogs.allTypes}</SelectItem>
                  <SelectItem value="discord">{t.alertLogs.discord}</SelectItem>
                  <SelectItem value="slack">{t.alertLogs.slack}</SelectItem>
                  <SelectItem value="telegram">{t.alertLogs.telegram}</SelectItem>
                  <SelectItem value="whatsapp">{t.alertLogs.whatsapp}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t.alertLogs.title}</CardTitle>
                <CardDescription>
                  {t.alertLogs.totalLogsFound.replace('{count}', totalCount.toString())}
                </CardDescription>
              </div>
              <Button onClick={fetchLogs} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                {t.alertLogs.refresh}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4 py-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-4 items-center">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            ) : logs.length === 0 ? (
              <EmptyAlertLogs />
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.alertLogs.time}</TableHead>
                        <TableHead>{t.alertLogs.integration}</TableHead>
                        <TableHead>{t.alertLogs.strategy}</TableHead>
                        <TableHead>{t.alertLogs.signal}</TableHead>
                        <TableHead>{t.alertLogs.status}</TableHead>
                        <TableHead>{t.alertLogs.message}</TableHead>
                        <TableHead>{t.alertLogs.response}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-xs">
                            {formatDateTime(log.created_at, preferences.dateFormat)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {getIntegrationTypeBadge(log.integration_type)}
                              {log.integrations?.name && (
                                <span className="text-xs text-muted-foreground">{log.integrations.name}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {log.strategies?.name || (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {log.signals ? (
                              <div className="flex flex-col gap-1">
                                <Badge variant="outline" className="text-xs">
                                  {log.signals.signal_type} {log.signals.symbol}
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(log.status)}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="flex flex-col gap-1">
                              {log.message && (
                                <span className="text-sm truncate" title={log.message}>
                                  {log.message}
                                </span>
                              )}
                              {log.error_message && (
                                <span className="text-xs text-red-500 truncate" title={log.error_message}>
                                  {log.error_message}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {log.response_status ? (
                              <div className="flex flex-col gap-1">
                                <Badge 
                                  variant="outline" 
                                  className={log.response_status >= 200 && log.response_status < 300 
                                    ? 'text-green-500 border-green-500/20' 
                                    : 'text-red-500 border-red-500/20'
                                  }
                                >
                                  {log.response_status}
                                </Badge>
                                {log.response_body && (
                                  <span className="text-xs text-muted-foreground truncate max-w-[100px]" title={log.response_body}>
                                    {log.response_body.substring(0, 50)}...
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      {t.alertLogs.page.replace('{current}', page.toString()).replace('{total}', totalPages.toString())}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        {t.alertLogs.previous}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        {t.alertLogs.next}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

