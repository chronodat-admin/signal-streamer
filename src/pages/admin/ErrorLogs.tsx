import { useEffect, useState, useMemo } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  AlertCircle,
  XCircle,
  Search,
  Loader2,
  Trash2,
  Eye,
  RefreshCw,
  Filter,
  X,
} from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/formatUtils';
import { useToast } from '@/hooks/use-toast';

interface ErrorLog {
  id: string;
  user_id: string | null;
  error_type: 'api' | 'edge_function' | 'frontend' | 'webhook' | 'database';
  severity: 'error' | 'warning' | 'critical';
  source: string | null;
  message: string;
  error_message: string | null;
  stack_trace: string | null;
  request_url: string | null;
  request_method: string | null;
  request_headers: Record<string, unknown> | null;
  request_body: Record<string, unknown> | null;
  response_status: number | null;
  response_body: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user_email?: string | null;
}

interface ErrorStats {
  total: number;
  critical: number;
  errors: number;
  warnings: number;
  last24Hours: number;
  byType: Record<string, number>;
  bySource: Record<string, number>;
}

export const ErrorLogs = () => {
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'error' | 'warning'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'api' | 'edge_function' | 'frontend' | 'webhook' | 'database'>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<ErrorLog | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [stats, setStats] = useState<ErrorStats>({
    total: 0,
    critical: 0,
    errors: 0,
    warnings: 0,
    last24Hours: 0,
    byType: {},
    bySource: {},
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchErrorLogs();
  }, []);

  const fetchErrorLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch error logs with user emails
      const { data: logs, error: logsError } = await supabase
        .from('error_logs')
        .select(`
          *,
          profiles:user_id (
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (logsError) throw logsError;

      // Transform data to include user email
      const transformedLogs: ErrorLog[] = (logs || []).map((log: any) => ({
        ...log,
        user_email: log.profiles?.email || null,
      }));

      setErrorLogs(transformedLogs);
      calculateStats(transformedLogs);
    } catch (err) {
      console.error('Error fetching error logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch error logs');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (logs: ErrorLog[]) => {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const stats: ErrorStats = {
      total: logs.length,
      critical: logs.filter(l => l.severity === 'critical').length,
      errors: logs.filter(l => l.severity === 'error').length,
      warnings: logs.filter(l => l.severity === 'warning').length,
      last24Hours: logs.filter(l => new Date(l.created_at) >= last24Hours).length,
      byType: {},
      bySource: {},
    };

    logs.forEach(log => {
      stats.byType[log.error_type] = (stats.byType[log.error_type] || 0) + 1;
      if (log.source) {
        stats.bySource[log.source] = (stats.bySource[log.source] || 0) + 1;
      }
    });

    setStats(stats);
  };

  const deleteErrorLog = async (id: string) => {
    try {
      setDeleting(id);
      const { error: deleteError } = await supabase
        .from('error_logs')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setErrorLogs(prev => prev.filter(log => log.id !== id));
      toast({
        title: 'Success',
        description: 'Error log deleted successfully',
      });
    } catch (err) {
      console.error('Error deleting log:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete error log',
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  const deleteAllFiltered = async () => {
    if (!confirm('Are you sure you want to delete all filtered error logs? This action cannot be undone.')) {
      return;
    }

    try {
      const filteredIds = filteredLogs.map(log => log.id);
      const { error: deleteError } = await supabase
        .from('error_logs')
        .delete()
        .in('id', filteredIds);

      if (deleteError) throw deleteError;

      setErrorLogs(prev => prev.filter(log => !filteredIds.includes(log.id)));
      toast({
        title: 'Success',
        description: `Deleted ${filteredIds.length} error logs`,
      });
    } catch (err) {
      console.error('Error deleting logs:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete error logs',
        variant: 'destructive',
      });
    }
  };

  const filteredLogs = useMemo(() => {
    return errorLogs.filter(log => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          log.message.toLowerCase().includes(query) ||
          (log.error_message?.toLowerCase().includes(query)) ||
          (log.source?.toLowerCase().includes(query)) ||
          (log.user_email?.toLowerCase().includes(query)) ||
          (log.request_url?.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Severity filter
      if (severityFilter !== 'all' && log.severity !== severityFilter) {
        return false;
      }

      // Type filter
      if (typeFilter !== 'all' && log.error_type !== typeFilter) {
        return false;
      }

      // Source filter
      if (sourceFilter !== 'all' && log.source !== sourceFilter) {
        return false;
      }

      return true;
    });
  }, [errorLogs, searchQuery, severityFilter, typeFilter, sourceFilter]);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Critical</Badge>;
      case 'error':
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> Error</Badge>;
      case 'warning':
        return <Badge variant="outline" className="gap-1"><AlertTriangle className="h-3 w-3" /> Warning</Badge>;
      default:
        return <Badge>{severity}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      api: 'bg-blue-500',
      edge_function: 'bg-purple-500',
      frontend: 'bg-green-500',
      webhook: 'bg-orange-500',
      database: 'bg-red-500',
    };
    return <Badge className={colors[type] || 'bg-gray-500'}>{type}</Badge>;
  };

  const uniqueSources = useMemo(() => {
    const sources = new Set<string>();
    errorLogs.forEach(log => {
      if (log.source) sources.add(log.source);
    });
    return Array.from(sources).sort();
  }, [errorLogs]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Error Logs</h1>
            <p className="text-muted-foreground mt-1">
              Monitor and manage application errors
            </p>
          </div>
          <Button onClick={fetchErrorLogs} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.last24Hours} in last 24 hours
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.critical}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Errors</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.errors}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Warnings</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.warnings}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search errors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={severityFilter} onValueChange={(v: any) => setSeverityFilter(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="edge_function">Edge Function</SelectItem>
                  <SelectItem value="frontend">Frontend</SelectItem>
                  <SelectItem value="webhook">Webhook</SelectItem>
                  <SelectItem value="database">Database</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {uniqueSources.map(source => (
                    <SelectItem key={source} value={source}>{source}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(searchQuery || severityFilter !== 'all' || typeFilter !== 'all' || sourceFilter !== 'all') && (
              <div className="mt-4 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSeverityFilter('all');
                    setTypeFilter('all');
                    setSourceFilter('all');
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
                {filteredLogs.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={deleteAllFiltered}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete All Filtered ({filteredLogs.length})
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Error Logs ({filteredLogs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No error logs found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs">
                          {formatDateTime(log.created_at)}
                        </TableCell>
                        <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                        <TableCell>{getTypeBadge(log.error_type)}</TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {log.source || '-'}
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate" title={log.message}>
                          {log.message}
                        </TableCell>
                        <TableCell className="text-xs">
                          {log.user_email || (log.user_id ? 'Unknown' : 'Anonymous')}
                        </TableCell>
                        <TableCell>
                          {log.response_status ? (
                            <Badge variant={log.response_status >= 500 ? 'destructive' : log.response_status >= 400 ? 'outline' : 'default'}>
                              {log.response_status}
                            </Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedLog(log)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Error Log Details</DialogTitle>
                                  <DialogDescription>
                                    {formatDateTime(log.created_at)}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium">Severity</label>
                                      <div className="mt-1">{getSeverityBadge(log.severity)}</div>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Type</label>
                                      <div className="mt-1">{getTypeBadge(log.error_type)}</div>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Source</label>
                                      <div className="mt-1">{log.source || '-'}</div>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">User</label>
                                      <div className="mt-1">{log.user_email || (log.user_id ? 'Unknown' : 'Anonymous')}</div>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">IP Address</label>
                                      <div className="mt-1">{log.ip_address || '-'}</div>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Response Status</label>
                                      <div className="mt-1">{log.response_status || '-'}</div>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Message</label>
                                    <div className="mt-1 p-2 bg-muted rounded">{log.message}</div>
                                  </div>
                                  {log.error_message && (
                                    <div>
                                      <label className="text-sm font-medium">Error Message</label>
                                      <div className="mt-1 p-2 bg-muted rounded font-mono text-xs">{log.error_message}</div>
                                    </div>
                                  )}
                                  {log.stack_trace && (
                                    <div>
                                      <label className="text-sm font-medium">Stack Trace</label>
                                      <div className="mt-1 p-2 bg-muted rounded font-mono text-xs whitespace-pre-wrap max-h-64 overflow-y-auto">
                                        {log.stack_trace}
                                      </div>
                                    </div>
                                  )}
                                  {log.request_url && (
                                    <div>
                                      <label className="text-sm font-medium">Request URL</label>
                                      <div className="mt-1 p-2 bg-muted rounded font-mono text-xs break-all">{log.request_url}</div>
                                    </div>
                                  )}
                                  {log.request_method && (
                                    <div>
                                      <label className="text-sm font-medium">Request Method</label>
                                      <div className="mt-1">{log.request_method}</div>
                                    </div>
                                  )}
                                  {log.request_body && (
                                    <div>
                                      <label className="text-sm font-medium">Request Body</label>
                                      <div className="mt-1 p-2 bg-muted rounded font-mono text-xs max-h-64 overflow-y-auto">
                                        {JSON.stringify(log.request_body, null, 2)}
                                      </div>
                                    </div>
                                  )}
                                  {log.response_body && (
                                    <div>
                                      <label className="text-sm font-medium">Response Body</label>
                                      <div className="mt-1 p-2 bg-muted rounded font-mono text-xs max-h-64 overflow-y-auto">
                                        {log.response_body}
                                      </div>
                                    </div>
                                  )}
                                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                                    <div>
                                      <label className="text-sm font-medium">Metadata</label>
                                      <div className="mt-1 p-2 bg-muted rounded font-mono text-xs max-h-64 overflow-y-auto">
                                        {JSON.stringify(log.metadata, null, 2)}
                                      </div>
                                    </div>
                                  )}
                                  {log.user_agent && (
                                    <div>
                                      <label className="text-sm font-medium">User Agent</label>
                                      <div className="mt-1 p-2 bg-muted rounded text-xs break-all">{log.user_agent}</div>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteErrorLog(log.id)}
                              disabled={deleting === log.id}
                            >
                              {deleting === log.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 text-destructive" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};
