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
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle2 className="h-3 w-3 mr-1" />Success</Badge>;
      case 'error':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20"><XCircle className="h-3 w-3 mr-1" />Error</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
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
          <h1 className="text-3xl font-bold tracking-tight">Alert Logs</h1>
          <p className="text-muted-foreground mt-2">
            View and debug alert delivery attempts to your integrations
          </p>
          {logs.length === 0 && !loading && (
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                <strong>No logs found.</strong> This could mean:
              </p>
              <ul className="list-disc list-inside mt-2 text-sm text-yellow-600 dark:text-yellow-400 space-y-1">
                <li>No signals have been sent yet</li>
                <li>The send-alerts function hasn't been triggered</li>
                <li>No integrations are configured or enabled</li>
              </ul>
              <p className="text-xs mt-2 text-muted-foreground">
                Check Supabase Edge Function logs to see if the function is being called.
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
                    placeholder="Search logs..."
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
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select value={integrationTypeFilter} onValueChange={setIntegrationTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="discord">Discord</SelectItem>
                  <SelectItem value="slack">Slack</SelectItem>
                  <SelectItem value="telegram">Telegram</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
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
                <CardTitle>Alert Logs</CardTitle>
                <CardDescription>
                  {totalCount} total logs found
                </CardDescription>
              </div>
              <Button onClick={fetchLogs} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-16">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No logs found</h3>
                <p className="text-muted-foreground">
                  Alert logs will appear here when signals are sent to your integrations
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Integration</TableHead>
                        <TableHead>Strategy</TableHead>
                        <TableHead>Signal</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Response</TableHead>
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
                      Page {page} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Next
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

