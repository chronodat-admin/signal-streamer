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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, MessageSquare, Hash, Send, Phone, Loader2, ExternalLink, Settings, Search, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { usePreferences } from '@/hooks/usePreferences';
import { formatDate, formatDateTime } from '@/lib/formatUtils';

type IntegrationType = 'discord' | 'slack' | 'telegram' | 'whatsapp' | 'email' | 'webhook' | 'pushover' | 'ntfy' | 'zapier' | 'ifttt' | 'microsoft-teams' | 'google-chat';
type IntegrationStatus = 'active' | 'inactive' | 'error';

interface Integration {
  id: string;
  user_id: string;
  strategy_id: string | null;
  integration_type?: IntegrationType;
  type?: IntegrationType;
  name: string;
  webhook_url?: string;
  status: IntegrationStatus;
  enabled?: boolean;
  config: Record<string, any>;
  last_used_at?: string | null;
  last_delivery_at?: string | null;
  error_message?: string | null;
  error_count?: number;
  created_at: string;
  updated_at?: string;
  strategies?: {
    name: string;
  };
}

interface IntegrationOption {
  id: IntegrationType;
  name: string;
  description: string;
  icon: React.ReactNode;
  logoUrl?: string;
  logoSvg?: string;
  color: string;
  bgColor: string;
  categories: string[];
  docsUrl?: string;
}

const availableIntegrations: IntegrationOption[] = [
  {
    id: 'discord',
    name: 'Discord',
    description: 'Send alerts to Discord channels via webhooks',
    icon: <MessageSquare className="h-6 w-6" />,
    logoUrl: 'https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-500/10',
    categories: ['Messaging', 'Webhooks'],
    docsUrl: 'https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send alerts to Slack channels via webhooks',
    icon: <Hash className="h-6 w-6" />,
    logoUrl: 'https://a.slack-edge.com/80588/marketing/img/icons/icon_slack_hash_colored.png',
    color: 'text-purple-600',
    bgColor: 'bg-purple-500/10',
    categories: ['Messaging', 'Webhooks'],
    docsUrl: 'https://api.slack.com/messaging/webhooks',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    description: 'Send alerts via Telegram bot',
    icon: <Send className="h-6 w-6" />,
    logoUrl: 'https://telegram.org/img/t_logo.png',
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
    categories: ['Messaging', 'Bot'],
    docsUrl: 'https://core.telegram.org/bots/api',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    description: 'Send alerts via WhatsApp (Twilio)',
    icon: <Phone className="h-6 w-6" />,
    logoUrl: 'https://static.whatsapp.net/rsrc.php/v3/yz/r/ujTY9i_Jhs1.png',
    color: 'text-green-600',
    bgColor: 'bg-green-500/10',
    categories: ['Messaging', 'SMS'],
    docsUrl: 'https://www.twilio.com/docs/whatsapp',
  },
  {
    id: 'email',
    name: 'Email',
    description: 'Send alerts via email (SMTP)',
    icon: <MessageSquare className="h-6 w-6" />,
    logoUrl: 'https://www.gstatic.com/images/branding/product/1x/gmail_48dp.png',
    color: 'text-gray-600',
    bgColor: 'bg-gray-500/10',
    categories: ['Email'],
  },
  {
    id: 'webhook',
    name: 'Generic Webhook',
    description: 'Send alerts to any webhook URL',
    icon: <ExternalLink className="h-6 w-6" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-500/10',
    categories: ['Webhooks'],
  },
  {
    id: 'pushover',
    name: 'Pushover',
    description: 'Send push notifications via Pushover',
    icon: <Phone className="h-6 w-6" />,
    logoUrl: 'https://pushover.net/images/logo.png',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-500/10',
    categories: ['Push Notifications'],
    docsUrl: 'https://pushover.net/api',
  },
  {
    id: 'ntfy',
    name: 'ntfy',
    description: 'Send push notifications via ntfy',
    icon: <MessageSquare className="h-6 w-6" />,
    logoUrl: 'https://ntfy.sh/static/img/ntfy.png',
    color: 'text-teal-600',
    bgColor: 'bg-teal-500/10',
    categories: ['Push Notifications'],
    docsUrl: 'https://ntfy.sh/docs/publish/',
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connect to Zapier workflows',
    icon: <ExternalLink className="h-6 w-6" />,
    logoUrl: 'https://cdn.zapier.com/zapier/images/logos/zapier-logo.png',
    color: 'text-red-600',
    bgColor: 'bg-red-500/10',
    categories: ['Automation', 'Webhooks'],
    docsUrl: 'https://zapier.com/apps/webhook',
  },
  {
    id: 'ifttt',
    name: 'IFTTT',
    description: 'Connect to IFTTT applets',
    icon: <ExternalLink className="h-6 w-6" />,
    logoUrl: 'https://ifttt.com/favicon.ico',
    color: 'text-pink-600',
    bgColor: 'bg-pink-500/10',
    categories: ['Automation', 'Webhooks'],
    docsUrl: 'https://ifttt.com/maker_webhooks',
  },
  {
    id: 'microsoft-teams',
    name: 'Microsoft Teams',
    description: 'Send alerts to Teams channels',
    icon: <MessageSquare className="h-6 w-6" />,
    logoUrl: 'https://c.s-microsoft.com/favicon.ico',
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
    categories: ['Messaging', 'Webhooks'],
    docsUrl: 'https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to-add-incoming-webhook',
  },
  {
    id: 'google-chat',
    name: 'Google Chat',
    description: 'Send alerts to Google Chat spaces',
    icon: <MessageSquare className="h-6 w-6" />,
    logoUrl: 'https://www.gstatic.com/images/branding/product/1x/chat_48dp.png',
    color: 'text-green-600',
    bgColor: 'bg-green-500/10',
    categories: ['Messaging', 'Webhooks'],
    docsUrl: 'https://developers.google.com/chat/how-tos/webhooks',
  },
];

const Integrations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [strategies, setStrategies] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationOption | null>(null);
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    integration_type: 'discord' as IntegrationType,
    name: '',
    strategy_id: 'all',
    webhook_url: '',
    enabled: true,
    bot_token: '',
    chat_id: '',
    phone_number: '',
    api_key: '',
    from_number: '',
    // Email specific
    to_email: '',
    from_email: '',
    api_service: 'resend', // 'resend', 'sendgrid', or webhook
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

  const handleCreateIntegration = (integration: IntegrationOption) => {
    setSelectedIntegration(integration);
    setEditingIntegration(null);
    setFormData({
      integration_type: integration.id,
      name: integration.name,
      strategy_id: 'all',
      webhook_url: '',
      enabled: true,
      bot_token: '',
      chat_id: '',
      phone_number: '',
      api_key: '',
      from_number: '',
      to_email: '',
      from_email: '',
      api_service: 'resend',
    });
    setDialogOpen(true);
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
      } else if (formData.integration_type === 'email') {
        config.to_email = formData.to_email;
        config.from_email = formData.from_email;
        config.api_key = formData.api_key;
        config.api_service = formData.api_service;
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
        description: 'Your integration has been deleted successfully.',
      });
      fetchIntegrations();
    } catch (error) {
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
    const option = availableIntegrations.find(i => i.id === integrationType);
    setSelectedIntegration(option || null);
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
      to_email: integration.config?.to_email || '',
      from_email: integration.config?.from_email || '',
      api_service: (integration.config?.api_service || 'resend') as 'resend' | 'sendgrid' | 'webhook',
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingIntegration(null);
    setSelectedIntegration(null);
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
      to_email: '',
      from_email: '',
      api_service: 'resend',
    });
  };

  const filteredIntegrations = availableIntegrations.filter(integration =>
    integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    integration.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    integration.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusIcon = (status: IntegrationStatus) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground mt-2">
            Connect your trading signals to Discord, Slack, Telegram, WhatsApp, and more
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Start typing to filter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Available Integrations Grid */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Available Integrations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIntegrations.map((integration) => {
              const isConfigured = integrations.some(
                i => (i.integration_type || i.type) === integration.id
              );
              return (
                <Card
                  key={integration.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleCreateIntegration(integration)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`${integration.bgColor} ${integration.color} p-3 rounded-lg flex items-center justify-center min-w-[48px] min-h-[48px] relative`}>
                        {integration.logoUrl ? (
                          <>
                            <img 
                              src={integration.logoUrl} 
                              alt={integration.name}
                              className="h-6 w-6 object-contain"
                              onError={(e) => {
                                // Hide image and show icon fallback
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) {
                                  fallback.style.display = 'block';
                                }
                              }}
                            />
                            <div className="hidden">
                              {integration.icon}
                            </div>
                          </>
                        ) : (
                          integration.icon
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-base">{integration.name}</h3>
                          {isConfigured && (
                            <Badge variant="outline" className="text-xs">Configured</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {integration.description}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {integration.categories.map((cat) => (
                            <Badge key={cat} variant="secondary" className="text-xs">
                              {cat}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Configured Integrations */}
        {integrations.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Your Integrations</h2>
            <div className="grid gap-4">
              {integrations.map((integration) => {
                const integrationType = integration.integration_type || integration.type || 'discord';
                const option = availableIntegrations.find(i => i.id === integrationType);
                return (
                  <Card key={integration.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          {option && (
                            <div className={`${option.bgColor} ${option.color} p-3 rounded-lg flex items-center justify-center min-w-[48px] min-h-[48px] relative`}>
                              {option.logoUrl ? (
                                <>
                                  <img 
                                    src={option.logoUrl} 
                                    alt={option.name}
                                    className="h-6 w-6 object-contain"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const fallback = target.nextElementSibling as HTMLElement;
                                      if (fallback) {
                                        fallback.style.display = 'block';
                                      }
                                    }}
                                  />
                                  <div className="hidden">
                                    {option.icon}
                                  </div>
                                </>
                              ) : (
                                option.icon
                              )}
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{integration.name}</h3>
                              <Badge variant="outline" className="text-xs">
                                {integrationType}
                              </Badge>
                              {integration.strategies ? (
                                <Badge variant="secondary" className="text-xs">
                                  {integration.strategies.name}
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  All Strategies
                                </Badge>
                              )}
                              <div className="flex items-center gap-1">
                                {getStatusIcon(integration.status)}
                                <span className="text-xs text-muted-foreground">{integration.status}</span>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {integration.webhook_url ? (
                                <span className="truncate block max-w-md">{integration.webhook_url}</span>
                              ) : (
                                option?.description || integrationType
                              )}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {integration.last_used_at && (
                                <span>Last used: {formatDateTime(integration.last_used_at, preferences.dateFormat)}</span>
                              )}
                              {integration.error_message && (
                                <span className="text-red-500">Error: {integration.error_message}</span>
                              )}
                            </div>
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
                );
              })}
            </div>
          </div>
        )}

        {/* Configuration Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingIntegration ? 'Edit Integration' : `Configure ${selectedIntegration?.name || 'Integration'}`}
              </DialogTitle>
              <DialogDescription>
                {selectedIntegration?.description || 'Configure your integration settings'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My Integration"
                  required
                />
              </div>

              <div>
                <Label htmlFor="strategy_id">Strategy (Optional - leave empty for all strategies)</Label>
                <Select
                  value={formData.strategy_id}
                  onValueChange={(value) => setFormData({ ...formData, strategy_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Strategies</SelectItem>
                    {strategies.map((strategy) => (
                      <SelectItem key={strategy.id} value={strategy.id}>
                        {strategy.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(formData.integration_type === 'discord' || formData.integration_type === 'slack' || 
                formData.integration_type === 'webhook' || formData.integration_type === 'zapier' || 
                formData.integration_type === 'ifttt' || formData.integration_type === 'microsoft-teams' ||
                formData.integration_type === 'google-chat' || formData.integration_type === 'pushover' ||
                formData.integration_type === 'ntfy') && (
                <div>
                  <Label htmlFor="webhook_url">Webhook URL</Label>
                  <Input
                    id="webhook_url"
                    type="url"
                    value={formData.webhook_url}
                    onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                    placeholder="https://..."
                    required
                  />
                  {selectedIntegration?.docsUrl && (
                    <p className="text-xs text-muted-foreground mt-1">
                      <a href={selectedIntegration.docsUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        How to get webhook URL
                      </a>
                    </p>
                  )}
                </div>
              )}

              {formData.integration_type === 'telegram' && (
                <>
                  <div>
                    <Label htmlFor="bot_token">Bot Token</Label>
                    <Input
                      id="bot_token"
                      value={formData.bot_token}
                      onChange={(e) => setFormData({ ...formData, bot_token: e.target.value })}
                      placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="chat_id">Chat ID</Label>
                    <Input
                      id="chat_id"
                      value={formData.chat_id}
                      onChange={(e) => setFormData({ ...formData, chat_id: e.target.value })}
                      placeholder="-1001234567890"
                      required
                    />
                  </div>
                  {selectedIntegration?.docsUrl && (
                    <p className="text-xs text-muted-foreground">
                      <a href={selectedIntegration.docsUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        How to get bot token and chat ID
                      </a>
                    </p>
                  )}
                </>
              )}

              {formData.integration_type === 'whatsapp' && (
                <>
                  <div>
                    <Label htmlFor="api_key">API Key</Label>
                    <Input
                      id="api_key"
                      value={formData.api_key}
                      onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                      placeholder="Your Twilio API key"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone_number">Phone Number</Label>
                    <Input
                      id="phone_number"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      placeholder="+1234567890"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="from_number">From Number</Label>
                    <Input
                      id="from_number"
                      value={formData.from_number}
                      onChange={(e) => setFormData({ ...formData, from_number: e.target.value })}
                      placeholder="whatsapp:+14155238886"
                    />
                  </div>
                  {selectedIntegration?.docsUrl && (
                    <p className="text-xs text-muted-foreground">
                      <a href={selectedIntegration.docsUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        How to set up WhatsApp integration
                      </a>
                    </p>
                  )}
                </>
              )}

              {formData.integration_type === 'email' && (
                <>
                  <div>
                    <Label htmlFor="to_email">Recipient Email</Label>
                    <Input
                      id="to_email"
                      type="email"
                      value={formData.to_email}
                      onChange={(e) => setFormData({ ...formData, to_email: e.target.value })}
                      placeholder="alerts@example.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="from_email">From Email</Label>
                    <Input
                      id="from_email"
                      type="email"
                      value={formData.from_email}
                      onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
                      placeholder="noreply@signalpulse.com"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Leave empty to use default
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="api_service">Email Service</Label>
                    <Select
                      value={formData.api_service}
                      onValueChange={(value) => setFormData({ ...formData, api_service: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="resend">Resend (Recommended)</SelectItem>
                        <SelectItem value="sendgrid">SendGrid</SelectItem>
                        <SelectItem value="webhook">Webhook/API</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="api_key_email">API Key or Webhook URL</Label>
                    <Input
                      id="api_key_email"
                      value={formData.api_key}
                      onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                      placeholder={formData.api_service === 'webhook' ? 'https://api.example.com/send-email' : 're_... or SG....'}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.api_service === 'resend' && 'Get your API key from resend.com'}
                      {formData.api_service === 'sendgrid' && 'Get your API key from sendgrid.com'}
                      {formData.api_service === 'webhook' && 'Enter your email webhook URL'}
                    </p>
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
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingIntegration ? 'Update' : 'Create'} Integration
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Integrations;
