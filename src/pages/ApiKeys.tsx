import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, Key, Copy, Check, Trash2, Loader2, Eye, EyeOff, 
  Code, Settings, ExternalLink, Zap, Clock, AlertCircle 
} from 'lucide-react';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { formatDateTime } from '@/lib/formatUtils';
import { usePreferences } from '@/hooks/usePreferences';

interface ApiKey {
  id: string;
  name: string;
  description: string | null;
  api_key: string;
  strategy_id: string | null;
  payload_mapping: Record<string, string>;
  default_values: Record<string, string>;
  rate_limit_per_minute: number;
  is_active: boolean;
  last_used_at: string | null;
  request_count: number;
  created_at: string;
}

interface Strategy {
  id: string;
  name: string;
}

const DEFAULT_MAPPING = {
  signal: 'signal',
  symbol: 'symbol',
  price: 'price',
  time: 'time',
};

const EXAMPLE_PAYLOADS = [
  {
    name: 'Standard Format',
    mapping: { signal: 'signal', symbol: 'symbol', price: 'price', time: 'time' },
    example: '{\n  "signal": "BUY",\n  "symbol": "AAPL",\n  "price": 150.25,\n  "time": "2024-01-01T12:00:00Z"\n}',
  },
  {
    name: 'TradingView Style',
    mapping: { signal: 'action', symbol: 'ticker', price: 'close', time: 'time' },
    example: '{\n  "action": "buy",\n  "ticker": "AAPL",\n  "close": 150.25,\n  "time": "{{time}}"\n}',
  },
  {
    name: 'Nested Data',
    mapping: { signal: 'data.signal', symbol: 'data.ticker', price: 'data.price', time: 'timestamp' },
    example: '{\n  "timestamp": "2024-01-01T12:00:00Z",\n  "data": {\n    "signal": "LONG",\n    "ticker": "BTC",\n    "price": 45000\n  }\n}',
  },
  {
    name: 'Simple Alert',
    mapping: { signal: 'type', symbol: 'asset', price: 'value', time: '' },
    example: '{\n  "type": "SELL",\n  "asset": "ETH",\n  "value": 2500.50\n}',
  },
];

export default function ApiKeys() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { preferences } = usePreferences();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null);
  const [creating, setCreating] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    strategy_id: '',
    payload_mapping: DEFAULT_MAPPING,
    default_values: {} as Record<string, string>,
    rate_limit_per_minute: 60,
    is_active: true,
  });

  useEffect(() => {
    if (user) {
      fetchApiKeys();
      fetchStrategies();
    }
  }, [user]);

  const fetchApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error: any) {
      console.error('Error fetching API keys:', error?.message || error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to load API keys',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStrategies = async () => {
    const { data } = await supabase
      .from('strategies')
      .select('id, name')
      .eq('user_id', user!.id)
      .eq('is_deleted', false)
      .order('name');
    setStrategies(data || []);
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Name is required', variant: 'destructive' });
      return;
    }

    setCreating(true);
    try {
      // Generate API key on server side
      const { data: keyData, error: keyError } = await supabase.rpc('generate_api_key');
      if (keyError) throw keyError;

      const { error } = await supabase.from('api_keys').insert({
        user_id: user!.id,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        api_key: keyData,
        strategy_id: formData.strategy_id || null,
        payload_mapping: formData.payload_mapping,
        default_values: formData.default_values,
        rate_limit_per_minute: formData.rate_limit_per_minute,
        is_active: formData.is_active,
      });

      if (error) throw error;

      toast({ title: 'Success', description: 'API key created successfully' });
      setDialogOpen(false);
      resetForm();
      fetchApiKeys();
    } catch (error: any) {
      console.error('Error creating API key:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create API key',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingKey) return;

    setCreating(true);
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          strategy_id: formData.strategy_id || null,
          payload_mapping: formData.payload_mapping,
          default_values: formData.default_values,
          rate_limit_per_minute: formData.rate_limit_per_minute,
          is_active: formData.is_active,
        })
        .eq('id', editingKey.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'API key updated successfully' });
      setDialogOpen(false);
      setEditingKey(null);
      resetForm();
      fetchApiKeys();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update API key',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) return;

    try {
      const { error } = await supabase.from('api_keys').delete().eq('id', id);
      if (error) throw error;

      toast({ title: 'Success', description: 'API key deleted' });
      fetchApiKeys();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete API key',
        variant: 'destructive',
      });
    }
  };

  const toggleKeyVisibility = (id: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisibleKeys(newVisible);
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: 'Copied!', description: 'API key copied to clipboard' });
  };

  const copyCodeToClipboard = async (code: string, codeId: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(codeId);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({ title: 'Copied!', description: 'Code copied to clipboard' });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      strategy_id: '',
      payload_mapping: DEFAULT_MAPPING,
      default_values: {},
      rate_limit_per_minute: 60,
      is_active: true,
    });
  };

  const openEditDialog = (key: ApiKey) => {
    setEditingKey(key);
    setFormData({
      name: key.name,
      description: key.description || '',
      strategy_id: key.strategy_id || '',
      payload_mapping: key.payload_mapping || DEFAULT_MAPPING,
      default_values: key.default_values || {},
      rate_limit_per_minute: key.rate_limit_per_minute,
      is_active: key.is_active,
    });
    setDialogOpen(true);
  };

  const applyTemplate = (template: typeof EXAMPLE_PAYLOADS[0]) => {
    setFormData(prev => ({
      ...prev,
      payload_mapping: template.mapping,
    }));
  };

  const getApiEndpoint = () => {
    // Use configured app URL or fallback to current origin
    // In production: VITE_APP_URL = https://your-domain.com
    // Locally: falls back to window.location.origin (http://localhost:8080)
    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    return `${appUrl}/api/signal`;
  };

  const getDirectSupabaseEndpoint = () => {
    const baseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    return `${baseUrl}/functions/v1/signal-api`;
  };

  const maskKey = (key: string) => {
    return key.substring(0, 7) + '•'.repeat(20) + key.substring(key.length - 4);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-72" />
            </div>
            <Skeleton className="h-10 w-36" />
          </div>
          <div className="grid gap-4">
            {[1, 2].map(i => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-60" />
                      <Skeleton className="h-8 w-80 mt-4" />
                    </div>
                    <Skeleton className="h-10 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight">API Keys</h1>
            <p className="text-muted-foreground mt-1">
              Create API keys for third-party applications to send signals
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingKey(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create API Key
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingKey ? 'Edit API Key' : 'Create API Key'}</DialogTitle>
                <DialogDescription>
                  Configure how your third-party application sends signals
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Basic Info */}
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., My Trading Bot"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="What is this API key used for?"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                    />
                  </div>
                </div>

                {/* Strategy Selection */}
                <div className="space-y-2">
                  <Label>Link to Strategy (Optional)</Label>
                  <Select
                    value={formData.strategy_id || '_auto'}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, strategy_id: value === '_auto' ? '' : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Auto (uses first active strategy)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_auto">Auto (first active strategy)</SelectItem>
                      {strategies.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Leave empty to automatically route signals to your first active strategy
                  </p>
                </div>

                {/* Payload Mapping */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Payload Mapping</Label>
                    <Select onValueChange={(idx) => applyTemplate(EXAMPLE_PAYLOADS[parseInt(idx)])}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Load template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {EXAMPLE_PAYLOADS.map((t, i) => (
                          <SelectItem key={i} value={i.toString()}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Map your payload fields to our signal format. Use dot notation for nested fields (e.g., data.ticker)
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="map-signal" className="text-sm">Signal Field</Label>
                      <Input
                        id="map-signal"
                        placeholder="signal"
                        value={formData.payload_mapping.signal || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          payload_mapping: { ...prev.payload_mapping, signal: e.target.value }
                        }))}
                      />
                      <p className="text-xs text-muted-foreground">e.g., action, type, data.signal</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="map-symbol" className="text-sm">Symbol Field</Label>
                      <Input
                        id="map-symbol"
                        placeholder="symbol"
                        value={formData.payload_mapping.symbol || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          payload_mapping: { ...prev.payload_mapping, symbol: e.target.value }
                        }))}
                      />
                      <p className="text-xs text-muted-foreground">e.g., ticker, asset, data.symbol</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="map-price" className="text-sm">Price Field</Label>
                      <Input
                        id="map-price"
                        placeholder="price"
                        value={formData.payload_mapping.price || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          payload_mapping: { ...prev.payload_mapping, price: e.target.value }
                        }))}
                      />
                      <p className="text-xs text-muted-foreground">e.g., close, value, entry_price</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="map-time" className="text-sm">Time Field (Optional)</Label>
                      <Input
                        id="map-time"
                        placeholder="time"
                        value={formData.payload_mapping.time || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          payload_mapping: { ...prev.payload_mapping, time: e.target.value }
                        }))}
                      />
                      <p className="text-xs text-muted-foreground">Leave empty to use current time</p>
                    </div>
                  </div>
                </div>

                {/* Rate Limiting */}
                <div className="space-y-2">
                  <Label htmlFor="rate-limit">Rate Limit (requests per minute)</Label>
                  <Input
                    id="rate-limit"
                    type="number"
                    min={1}
                    max={1000}
                    value={formData.rate_limit_per_minute}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      rate_limit_per_minute: parseInt(e.target.value) || 60 
                    }))}
                  />
                </div>

                {/* Active Toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Active</Label>
                    <p className="text-sm text-muted-foreground">Enable or disable this API key</p>
                  </div>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={editingKey ? handleUpdate : handleCreate} disabled={creating}>
                  {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingKey ? 'Update' : 'Create'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* API Endpoint Info */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Code className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0 space-y-3">
                <div>
                  <div className="font-medium flex items-center gap-2">
                    API Endpoint
                    <Badge variant="secondary" className="text-xs">Recommended</Badge>
                  </div>
                  <code className="text-sm text-primary break-all">{getApiEndpoint()}</code>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p className="mb-1">Alternative (direct Supabase):</p>
                  <code className="text-xs break-all opacity-70">{getDirectSupabaseEndpoint()}</code>
                </div>
                <p className="text-sm text-muted-foreground">
                  Send a POST request with your API key in the <code className="text-primary">x-api-key</code> header
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Keys List */}
        {apiKeys.length === 0 ? (
          <EmptyState
            title="No API Keys"
            description="Create an API key to allow third-party applications to send signals"
            action={{
              label: 'Create API Key',
              onClick: () => setDialogOpen(true)
            }}
            variant="illustration"
          />
        ) : (
          <div className="grid gap-4">
            {apiKeys.map((key) => (
              <Card key={key.id} className={!key.is_active ? 'opacity-60' : ''}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="space-y-3 flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                          <Key className="h-5 w-5 text-amber-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{key.name}</h3>
                            <Badge variant={key.is_active ? 'default' : 'secondary'}>
                              {key.is_active ? 'Active' : 'Disabled'}
                            </Badge>
                          </div>
                          {key.description && (
                            <p className="text-sm text-muted-foreground">{key.description}</p>
                          )}
                        </div>
                      </div>

                      {/* API Key Display */}
                      <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-3">
                        <code className="text-sm font-mono flex-1 break-all">
                          {visibleKeys.has(key.id) ? key.api_key : maskKey(key.api_key)}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={() => toggleKeyVisibility(key.id)}
                        >
                          {visibleKeys.has(key.id) ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={() => copyToClipboard(key.api_key, key.id)}
                        >
                          {copiedId === key.id ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {/* Stats */}
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Zap className="h-4 w-4" />
                          <span>{key.request_count.toLocaleString()} requests</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          <span>
                            {key.last_used_at 
                              ? `Last used ${formatDateTime(key.last_used_at, preferences)}`
                              : 'Never used'
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="h-4 w-4" />
                          <span>{key.rate_limit_per_minute}/min limit</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => openEditDialog(key)}
                      >
                        <Settings className="h-4 w-4" />
                        Configure
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(key.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Documentation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Quick Start Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* cURL Example */}
            {(() => {
              const curlCode = `curl -X POST "${getApiEndpoint()}" \\
  --header "Content-Type: application/json" \\
  --header "x-api-key: YOUR_API_KEY" \\
  --data '{
    "signal": "BUY",
    "symbol": "AAPL",
    "price": 150.25,
    "time": "${new Date().toISOString()}"
  }'`;
              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">cURL</Badge>
                      Example Request
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      onClick={() => copyCodeToClipboard(curlCode, 'curl')}
                    >
                      {copiedCode === 'curl' ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-green-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="relative group">
                    <pre className="bg-muted/50 p-4 rounded-lg text-sm overflow-x-auto border">
                      <code>{curlCode}</code>
                    </pre>
                  </div>
                </div>
              );
            })()}

            {/* Python Example */}
            {(() => {
              const pythonCode = `import requests

response = requests.post(
    "${getApiEndpoint()}",
    headers={
        "Content-Type": "application/json",
        "x-api-key": "YOUR_API_KEY"
    },
    json={
        "signal": "BUY",
        "symbol": "AAPL",
        "price": 150.25
    }
)

print(response.status_code)
print(response.json())`;
              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">Python</Badge>
                      Example Request
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      onClick={() => copyCodeToClipboard(pythonCode, 'python')}
                    >
                      {copiedCode === 'python' ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-green-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="relative group">
                    <pre className="bg-muted/50 p-4 rounded-lg text-sm overflow-x-auto border">
                      <code>{pythonCode}</code>
                    </pre>
                  </div>
                </div>
              );
            })()}

            {/* JavaScript/Node.js Example */}
            {(() => {
              const jsCode = `const response = await fetch("${getApiEndpoint()}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "YOUR_API_KEY"
  },
  body: JSON.stringify({
    signal: "BUY",
    symbol: "AAPL",
    price: 150.25
  })
});

const data = await response.json();
console.log(data);`;
              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">JavaScript</Badge>
                      Example Request
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      onClick={() => copyCodeToClipboard(jsCode, 'js')}
                    >
                      {copiedCode === 'js' ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-green-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="relative group">
                    <pre className="bg-muted/50 p-4 rounded-lg text-sm overflow-x-auto border">
                      <code>{jsCode}</code>
                    </pre>
                  </div>
                </div>
              );
            })()}

            {/* Response Example */}
            <div className="space-y-2">
              <h4 className="font-medium">Expected Response</h4>
              <pre className="bg-green-500/10 border-green-500/20 p-4 rounded-lg text-sm overflow-x-auto border">
                <code className="text-green-600 dark:text-green-400">{`{
  "success": true,
  "signal_id": "uuid-...",
  "message": "Signal received successfully"
}`}</code>
              </pre>
            </div>

            {/* Notes */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-sm space-y-2">
              <p className="font-medium text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Important Notes
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Replace <code className="bg-muted px-1 py-0.5 rounded text-xs">YOUR_API_KEY</code> with your actual API key</li>
                <li>Configure <strong>payload mapping</strong> if your data format differs</li>
                <li>Use dot notation for nested fields (e.g., <code className="bg-muted px-1 py-0.5 rounded text-xs">data.ticker</code>)</li>
                <li>The <code className="bg-muted px-1 py-0.5 rounded text-xs">time</code> field is optional (defaults to current time)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

