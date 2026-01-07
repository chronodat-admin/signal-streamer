import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, MessageSquare, Hash, Send, Phone, Loader2, ExternalLink, Settings } from 'lucide-react';
import { format } from 'date-fns';

type IntegrationType = 'discord' | 'slack' | 'telegram' | 'whatsapp';
type IntegrationStatus = 'active' | 'inactive' | 'error';

interface Integration {
  id: string;
  user_id: string;
  strategy_id: string | null;
  integration_type?: IntegrationType;
  type?: IntegrationType; // Support both old and new schema
  name: string;
  webhook_url?: string; // May not exist in old schema
  status: IntegrationStatus;
  enabled?: boolean;
  config: Record<string, any>;
  last_used_at?: string | null;
  last_delivery_at?: string | null; // Old schema field
  error_message?: string | null;
  error_count?: number; // Old schema field
  created_at: string;
  updated_at?: string;
  strategies?: {
    name: string;
  };
}

const Integrations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [strategies, setStrategies] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);
  const [formData, setFormData] = useState({
    integration_type: 'discord' as IntegrationType,
    name: '',
    strategy_id: 'all',
    webhook_url: '',
    enabled: true,
    // Telegram/WhatsApp specific
    bot_token: '',
    chat_id: '',
    phone_number: '',
    api_key: '',
    from_number: '',
  });

  useEffect(() => {
    if (user) {
      fetchIntegrations();
      fetchStrategies();
    }
  }, [user]);

  const fetchIntegrations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('integrations')
        .select(`
          *,
          strategies (name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIntegrations(data || []);
    } catch (error) {
      console.error('Error fetching integrations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load integrations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStrategies = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('strategies')
        .select('id, name')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('name');

      if (error) throw error;
      setStrategies(data || []);
    } catch (error) {
      console.error('Error fetching strategies:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const config: Record<string, any> = {};
      if (formData.integration_type === 'telegram') {
        config.bot_token = formData.bot_token;
        config.chat_id = formData.chat_id;
      } else if (formData.integration_type === 'whatsapp') {
        config.api_key = formData.api_key;
        config.phone_number = formData.phone_number;
        config.from_number = formData.from_number;
      }

      const payload: any = {
        user_id: user.id,
        integration_type: formData.integration_type,
        name: formData.name,
        webhook_url: formData.webhook_url,
        enabled: formData.enabled,
        config,
        status: 'active',
      };

      if (formData.strategy_id && formData.strategy_id !== "all") {
        payload.strategy_id = formData.strategy_id;
      } else {
        payload.strategy_id = null;
      }

      if (editingIntegration) {
        const { error } = await supabase
          .from('integrations')
          .update(payload)
          .eq('id', editingIntegration.id);

        if (error) throw error;
        toast({
          title: 'Integration Updated',
          description: 'Your integration has been updated successfully.',
        });
      } else {
        const { error } = await supabase
          .from('integrations')
          .insert(payload);

        if (error) throw error;
        toast({
          title: 'Integration Created',
          description: 'Your integration has been created successfully.',
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchIntegrations();
    } catch (error: any) {
      console.error('Error saving integration:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save integration',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this integration?')) return;

    try {
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({
        title: 'Integration Deleted',
        description: 'Your integration has been removed.',
      });
      fetchIntegrations();
    } catch (error: any) {
      console.error('Error deleting integration:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete integration',
        variant: 'destructive',
      });
    }
  };

  const handleToggle = async (integration: Integration) => {
    try {
      const { error } = await supabase
        .from('integrations')
        .update({ enabled: !(integration.enabled !== false) })
        .eq('id', integration.id);

      if (error) throw error;
      fetchIntegrations();
    } catch (error) {
      console.error('Error toggling integration:', error);
    }
  };

  const handleEdit = (integration: Integration) => {
    setEditingIntegration(integration);
    const integrationType = integration.integration_type || integration.type || 'discord';
    setFormData({
      integration_type: integrationType as IntegrationType,
      name: integration.name,
      strategy_id: integration.strategy_id || 'all',
      webhook_url: integration.webhook_url || integration.config?.webhook_url || '',
      enabled: integration.enabled !== undefined ? integration.enabled : true,
      bot_token: integration.config?.bot_token || '',
      chat_id: integration.config?.chat_id || '',
      phone_number: integration.config?.phone_number || '',
      api_key: integration.config?.api_key || '',
      from_number: integration.config?.from_number || '',
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingIntegration(null);
    setFormData({
      integration_type: 'discord',
      name: '',
      strategy_id: 'all',
      webhook_url: '',
      enabled: true,
      bot_token: '',
      chat_id: '',
      phone_number: '',
      api_key: '',
      from_number: '',
    });
  };

  const getIntegrationIcon = (type: IntegrationType) => {
    switch (type) {
      case 'discord':
        return <MessageSquare className="h-5 w-5" />;
      case 'slack':
        return <Hash className="h-5 w-5" />;
      case 'telegram':
        return <Send className="h-5 w-5" />;
      case 'whatsapp':
        return <Phone className="h-5 w-5" />;
    }
  };

  const getIntegrationDocs = (type: IntegrationType) => {
    switch (type) {
      case 'discord':
        return 'https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks';
      case 'slack':
        return 'https://api.slack.com/messaging/webhooks';
      case 'telegram':
        return 'https://core.telegram.org/bots/api';
      case 'whatsapp':
        return 'https://www.twilio.com/docs/whatsapp';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Integrations</h1>
            <p className="text-muted-foreground text-lg">
              Send trading signals to Discord, Slack, Telegram, and WhatsApp
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-md hover:shadow-lg transition-all">
                <Plus className="h-4 w-4" />
                New Integration
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingIntegration ? 'Edit Integration' : 'Create Integration'}</DialogTitle>
                <DialogDescription>
                  Configure alerts for your trading signals
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Integration Type</Label>
                  <Select
                    value={formData.integration_type}
                    onValueChange={(value) => setFormData({ ...formData, integration_type: value as IntegrationType })}
                    disabled={!!editingIntegration}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="discord">Discord</SelectItem>
                      <SelectItem value="slack">Slack</SelectItem>
                      <SelectItem value="telegram">Telegram</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="My Discord Alerts"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Strategy (Optional - leave empty for all strategies)</Label>
                  <Select
                    value={formData.strategy_id || "all"}
                    onValueChange={(value) => setFormData({ ...formData, strategy_id: value === "all" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Strategies" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Strategies</SelectItem>
                      {strategies.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(formData.integration_type === 'discord' || formData.integration_type === 'slack') && (
                  <div className="space-y-2">
                    <Label>Webhook URL</Label>
                    <Input
                      type="url"
                      value={formData.webhook_url}
                      onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                      placeholder="https://discord.com/api/webhooks/..."
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      <a href={getIntegrationDocs(formData.integration_type)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        How to get webhook URL
                      </a>
                    </p>
                  </div>
                )}

                {formData.integration_type === 'telegram' && (
                  <>
                    <div className="space-y-2">
                      <Label>Bot Token</Label>
                      <Input
                        value={formData.bot_token}
                        onChange={(e) => setFormData({ ...formData, bot_token: e.target.value })}
                        placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Get your bot token from <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@BotFather</a>
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Chat ID</Label>
                      <Input
                        value={formData.chat_id}
                        onChange={(e) => setFormData({ ...formData, chat_id: e.target.value })}
                        placeholder="123456789"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Get your chat ID from <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@userinfobot</a>
                      </p>
                    </div>
                  </>
                )}

                {formData.integration_type === 'whatsapp' && (
                  <>
                    <div className="space-y-2">
                      <Label>API Key (Twilio Account SID)</Label>
                      <Input
                        value={formData.api_key}
                        onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                        placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number (with country code)</Label>
                      <Input
                        value={formData.phone_number}
                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                        placeholder="+1234567890"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>From Number (Optional)</Label>
                      <Input
                        value={formData.from_number}
                        onChange={(e) => setFormData({ ...formData, from_number: e.target.value })}
                        placeholder="whatsapp:+14155238886"
                      />
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.enabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                    />
                    <Label>Enabled</Label>
                  </div>
                  <Button type="submit">
                    {editingIntegration ? 'Update' : 'Create'} Integration
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Integrations List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : integrations.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No integrations yet</h3>
              <p className="text-muted-foreground mb-6">
                Create an integration to receive alerts on Discord, Slack, Telegram, or WhatsApp
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {integrations.map((integration) => (
              <Card key={integration.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                        (integration.integration_type || integration.type) === 'discord' ? 'bg-indigo-500/10 text-indigo-500' :
                        (integration.integration_type || integration.type) === 'slack' ? 'bg-purple-500/10 text-purple-500' :
                        (integration.integration_type || integration.type) === 'telegram' ? 'bg-blue-500/10 text-blue-500' :
                        'bg-green-500/10 text-green-500'
                      }`}>
                        {getIntegrationIcon((integration.integration_type || integration.type || 'discord') as IntegrationType)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{integration.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {integration.integration_type || integration.type || 'unknown'}
                          </Badge>
                          {integration.strategies && (
                            <Badge variant="secondary" className="text-xs">
                              {integration.strategies.name}
                            </Badge>
                          )}
                          {!integration.strategies && (
                            <Badge variant="secondary" className="text-xs">
                              All Strategies
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {integration.webhook_url || `${integration.integration_type || integration.type || 'integration'}`}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Status: <Badge variant={integration.status === 'active' ? 'default' : 'destructive'} className="ml-1">{integration.status}</Badge></span>
                          {integration.last_used_at && (
                            <span>Last used: {format(new Date(integration.last_used_at), 'MMM d, HH:mm')}</span>
                          )}
                        </div>
                        {integration.error_message && (
                          <p className="text-xs text-destructive mt-2">{integration.error_message}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={integration.enabled !== false}
                        onCheckedChange={() => handleToggle(integration)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(integration)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(integration.id)}
                        className="text-destructive hover:text-destructive"
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
      </div>
    </DashboardLayout>
  );
};

export default Integrations;
