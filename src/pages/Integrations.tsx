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
import { IntegrationsPageSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { getUserPlan, getPlanLimits } from '@/lib/planUtils';
import { useLanguage } from '@/i18n';

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

// Note: Integration descriptions and categories are now translated in the component
const getAvailableIntegrations = (t: any): IntegrationOption[] => [
  {
    id: 'discord',
    name: 'Discord',
    description: t.integrations.discordDescription,
    icon: <MessageSquare className="h-6 w-6" />,
    logoUrl: 'https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-500/10',
    categories: [t.integrations.categoryMessaging, t.integrations.categoryWebhooks],
    docsUrl: 'https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: t.integrations.slackDescription,
    icon: <Hash className="h-6 w-6" />,
    logoUrl: 'https://a.slack-edge.com/80588/marketing/img/icons/icon_slack_hash_colored.png',
    color: 'text-purple-600',
    bgColor: 'bg-purple-500/10',
    categories: [t.integrations.categoryMessaging, t.integrations.categoryWebhooks],
    docsUrl: 'https://api.slack.com/messaging/webhooks',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    description: t.integrations.telegramDescription,
    icon: <Send className="h-6 w-6" />,
    logoUrl: 'https://telegram.org/img/t_logo.png',
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
    categories: [t.integrations.categoryMessaging, t.integrations.categoryBot],
    docsUrl: 'https://core.telegram.org/bots/api',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    description: t.integrations.whatsappDescription,
    icon: <Phone className="h-6 w-6" />,
    logoUrl: 'https://static.whatsapp.net/rsrc.php/v3/yz/r/ujTY9i_Jhs1.png',
    color: 'text-green-600',
    bgColor: 'bg-green-500/10',
    categories: [t.integrations.categoryMessaging, t.integrations.categorySMS],
    docsUrl: 'https://www.twilio.com/docs/whatsapp',
  },
  {
    id: 'email',
    name: 'Email',
    description: t.integrations.emailDescription,
    icon: <MessageSquare className="h-6 w-6" />,
    logoUrl: 'https://www.gstatic.com/images/branding/product/1x/gmail_48dp.png',
    color: 'text-gray-600',
    bgColor: 'bg-gray-500/10',
    categories: [t.integrations.categoryEmail],
  },
  {
    id: 'webhook',
    name: 'Generic Webhook',
    description: t.integrations.webhookDescription,
    icon: <ExternalLink className="h-6 w-6" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-500/10',
    categories: [t.integrations.categoryWebhooks],
  },
  {
    id: 'pushover',
    name: 'Pushover',
    description: t.integrations.pushoverDescription,
    icon: <Phone className="h-6 w-6" />,
    logoUrl: 'https://pushover.net/images/logo.png',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-500/10',
    categories: [t.integrations.categoryPushNotifications],
    docsUrl: 'https://pushover.net/api',
  },
  {
    id: 'ntfy',
    name: 'ntfy',
    description: t.integrations.ntfyDescription,
    icon: <MessageSquare className="h-6 w-6" />,
    logoUrl: 'https://ntfy.sh/static/img/ntfy.png',
    color: 'text-teal-600',
    bgColor: 'bg-teal-500/10',
    categories: [t.integrations.categoryPushNotifications],
    docsUrl: 'https://ntfy.sh/docs/publish/',
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: t.integrations.zapierDescription,
    icon: <ExternalLink className="h-6 w-6" />,
    logoUrl: 'https://cdn.zapier.com/zapier/images/logos/zapier-logo.png',
    color: 'text-red-600',
    bgColor: 'bg-red-500/10',
    categories: [t.integrations.categoryAutomation, t.integrations.categoryWebhooks],
    docsUrl: 'https://zapier.com/apps/webhook',
  },
  {
    id: 'ifttt',
    name: 'IFTTT',
    description: t.integrations.iftttDescription,
    icon: <ExternalLink className="h-6 w-6" />,
    logoUrl: 'https://ifttt.com/favicon.ico',
    color: 'text-pink-600',
    bgColor: 'bg-pink-500/10',
    categories: [t.integrations.categoryAutomation, t.integrations.categoryWebhooks],
    docsUrl: 'https://ifttt.com/maker_webhooks',
  },
  {
    id: 'microsoft-teams',
    name: 'Microsoft Teams',
    description: t.integrations.microsoftTeamsDescription,
    icon: <MessageSquare className="h-6 w-6" />,
    logoUrl: 'https://c.s-microsoft.com/favicon.ico',
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
    categories: [t.integrations.categoryMessaging, t.integrations.categoryWebhooks],
    docsUrl: 'https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to-add-incoming-webhook',
  },
  {
    id: 'google-chat',
    name: 'Google Chat',
    description: t.integrations.googleChatDescription,
    icon: <MessageSquare className="h-6 w-6" />,
    logoUrl: 'https://www.gstatic.com/images/branding/product/1x/chat_48dp.png',
    color: 'text-green-600',
    bgColor: 'bg-green-500/10',
    categories: [t.integrations.categoryMessaging, t.integrations.categoryWebhooks],
    docsUrl: 'https://developers.google.com/chat/how-tos/webhooks',
  },
];

const Integrations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [strategies, setStrategies] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { preferences } = usePreferences();
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationOption | null>(null);
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userPlan, setUserPlan] = useState<'FREE' | 'PRO' | 'ELITE'>('FREE');
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
    api_service: 'smtp', // 'smtp', 'resend', 'sendgrid', or webhook
    // SMTP specific
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_password: '',
    // Custom webhook specific
    http_method: 'POST',
    auth_header: '',
    payload_template: '',
  });

  useEffect(() => {
    if (user) {
      fetchIntegrations();
      fetchStrategies();
      fetchUserPlan();
    }
  }, [user]);

  const fetchUserPlan = async () => {
    if (!user) return;
    const plan = await getUserPlan(user.id);
    setUserPlan(plan);
  };

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
        title: t.common.error,
        description: t.integrations.failedToLoad,
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
    // Check plan limits
    const limits = getPlanLimits(userPlan);
    if (limits.integrations !== -1 && integrations.length >= limits.integrations) {
      toast({
        title: t.integrations.upgradeRequired,
        description: limits.integrations === 0 
          ? t.integrations.integrationsNotAvailable
          : t.integrations.planLimitReached.replace('{plan}', userPlan).replace('{count}', limits.integrations.toString()),
        variant: 'destructive',
      });
      return;
    }

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
      api_service: 'smtp',
      smtp_host: '',
      smtp_port: '587',
      smtp_user: '',
      smtp_password: '',
      http_method: 'POST',
      auth_header: '',
      payload_template: '',
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
        config.api_service = formData.api_service;
        if (formData.api_service === 'smtp') {
          config.smtp_host = formData.smtp_host;
          config.smtp_port = parseInt(formData.smtp_port) || 587;
          config.smtp_user = formData.smtp_user;
          config.smtp_password = formData.smtp_password;
        } else {
          config.api_key = formData.api_key;
        }
      } else if (formData.integration_type === 'webhook') {
        config.method = formData.http_method || 'POST';
        if (formData.auth_header) {
          config.headers = { 'Authorization': formData.auth_header };
        }
        if (formData.payload_template) {
          config.payload_template = formData.payload_template;
        }
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
          title: t.integrations.integrationUpdated,
          description: t.integrations.integrationUpdatedDescription,
        });
      } else {
        const { error } = await supabase
          .from('integrations')
          .insert(payload);

        if (error) throw error;
        toast({
          title: t.integrations.integrationCreated,
          description: t.integrations.integrationCreatedDescription,
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchIntegrations();
    } catch (error: any) {
      console.error('Error saving integration:', error);
      toast({
        title: t.common.error,
        description: error.message || t.integrations.failedToSave,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.integrations.confirmDelete)) return;

    try {
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({
        title: t.integrations.integrationDeleted,
        description: t.integrations.integrationDeletedDescription,
      });
      fetchIntegrations();
    } catch (error) {
      console.error('Error deleting integration:', error);
      toast({
        title: t.common.error,
        description: t.integrations.failedToDelete,
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
      api_service: (integration.config?.api_service || 'smtp') as string,
      // SMTP fields
      smtp_host: integration.config?.smtp_host || '',
      smtp_port: String(integration.config?.smtp_port || 587),
      smtp_user: integration.config?.smtp_user || '',
      smtp_password: integration.config?.smtp_password || '',
      // Custom webhook fields
      http_method: integration.config?.method || 'POST',
      auth_header: integration.config?.headers?.Authorization || '',
      payload_template: integration.config?.payload_template || '',
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
      api_service: 'smtp',
      smtp_host: '',
      smtp_port: '587',
      smtp_user: '',
      smtp_password: '',
      http_method: 'POST',
      auth_header: '',
      payload_template: '',
    });
  };

  const availableIntegrations = getAvailableIntegrations(t);
  
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

  if (loading) {
    return (
      <DashboardLayout>
        <IntegrationsPageSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">{t.integrations.title}</h1>
          <p className="text-muted-foreground mt-2">
            {t.integrations.subtitle}
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.common.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Available Integrations Grid */}
        <div>
          <h2 className="text-xl font-semibold mb-4">{t.integrations.availableIntegrations}</h2>
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
                            <Badge variant="outline" className="text-xs">{t.integrations.configured}</Badge>
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
            <h2 className="text-xl font-semibold mb-4">{t.integrations.yourIntegrations}</h2>
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
                                  {t.integrations.allStrategies}
                                </Badge>
                              )}
                              <div className="flex items-center gap-1">
                                {getStatusIcon(integration.status)}
                                <span className="text-xs text-muted-foreground">{integration.status === 'active' ? t.integrations.active : integration.status === 'inactive' ? t.integrations.inactive : integration.status}</span>
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
                                <span>{t.integrations.lastUsed.replace('{date}', formatDateTime(integration.last_used_at, preferences.dateFormat))}</span>
                              )}
                              {integration.error_message && (
                                <span className="text-red-500">{t.integrations.error.replace('{message}', integration.error_message)}</span>
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
          <DialogContent className="max-w-2xl max-h-[85vh] p-0 flex flex-col overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shrink-0">
              <DialogTitle className="font-display">
                {editingIntegration ? t.integrations.editIntegration : t.integrations.configureIntegration.replace('{name}', selectedIntegration?.name || 'Integration')}
              </DialogTitle>
              <DialogDescription>
                {selectedIntegration?.description || t.integrations.integrationDescription}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-minimal">
              <div>
                <Label htmlFor="name">{t.integrations.name}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t.integrations.namePlaceholder}
                  required
                />
              </div>

              <div>
                <Label htmlFor="strategy_id">{t.integrations.strategyOptional}</Label>
                <Select
                  value={formData.strategy_id}
                  onValueChange={(value) => setFormData({ ...formData, strategy_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.integrations.selectStrategy} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.integrations.allStrategies}</SelectItem>
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
                  <Label htmlFor="webhook_url">{t.integrations.webhookUrl}</Label>
                  <Input
                    id="webhook_url"
                    type="url"
                    value={formData.webhook_url}
                    onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                    placeholder={t.integrations.webhookUrlPlaceholder}
                    required
                  />
                  {selectedIntegration?.docsUrl && (
                    <p className="text-xs text-muted-foreground mt-1">
                      <a href={selectedIntegration.docsUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {t.integrations.howToGetWebhook}
                      </a>
                    </p>
                  )}
                </div>
              )}

              {/* Custom Webhook Advanced Options */}
              {formData.integration_type === 'webhook' && (
                <>
                  <div>
                    <Label htmlFor="http_method">{t.integrations.httpMethod}</Label>
                    <Select
                      value={formData.http_method || 'POST'}
                      onValueChange={(value) => setFormData({ ...formData, http_method: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t.integrations.httpMethodPlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="PATCH">PATCH</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="auth_header">{t.integrations.authorizationHeader} ({t.common.optional})</Label>
                    <Input
                      id="auth_header"
                      value={formData.auth_header || ''}
                      onChange={(e) => setFormData({ ...formData, auth_header: e.target.value })}
                      placeholder={t.integrations.authorizationHeaderPlaceholder}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {t.integrations.authorizationHeaderDescription}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="payload_template">{t.integrations.payloadTemplate} ({t.common.optional})</Label>
                    <textarea
                      id="payload_template"
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                      value={formData.payload_template || ''}
                      onChange={(e) => setFormData({ ...formData, payload_template: e.target.value })}
                      placeholder={t.integrations.payloadTemplatePlaceholder}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {t.integrations.payloadTemplateDescription}
                    </p>
                  </div>
                </>
              )}

              {formData.integration_type === 'telegram' && (
                <>
                  <div>
                    <Label htmlFor="bot_token">{t.integrations.botToken}</Label>
                    <Input
                      id="bot_token"
                      value={formData.bot_token}
                      onChange={(e) => setFormData({ ...formData, bot_token: e.target.value })}
                      placeholder={t.integrations.botTokenPlaceholder}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="chat_id">{t.integrations.chatId}</Label>
                    <Input
                      id="chat_id"
                      value={formData.chat_id}
                      onChange={(e) => setFormData({ ...formData, chat_id: e.target.value })}
                      placeholder={t.integrations.chatIdPlaceholder}
                      required
                    />
                  </div>
                  {selectedIntegration?.docsUrl && (
                    <p className="text-xs text-muted-foreground">
                      <a href={selectedIntegration.docsUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {t.integrations.howToGetBotToken}
                      </a>
                    </p>
                  )}
                </>
              )}

              {formData.integration_type === 'whatsapp' && (
                <>
                  <div>
                    <Label htmlFor="api_key">{t.integrations.apiKey}</Label>
                    <Input
                      id="api_key"
                      value={formData.api_key}
                      onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                      placeholder={t.integrations.apiKeyPlaceholder}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone_number">{t.integrations.phoneNumber}</Label>
                    <Input
                      id="phone_number"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      placeholder={t.integrations.phoneNumberPlaceholder}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="from_number">{t.integrations.fromNumber}</Label>
                    <Input
                      id="from_number"
                      value={formData.from_number}
                      onChange={(e) => setFormData({ ...formData, from_number: e.target.value })}
                      placeholder={t.integrations.fromNumberPlaceholder}
                    />
                  </div>
                  {selectedIntegration?.docsUrl && (
                    <p className="text-xs text-muted-foreground">
                      <a href={selectedIntegration.docsUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {t.integrations.howToSetupWhatsApp}
                      </a>
                    </p>
                  )}
                </>
              )}

              {formData.integration_type === 'email' && (
                <>
                  <div>
                    <Label htmlFor="to_email">{t.integrations.recipientEmail}</Label>
                    <Input
                      id="to_email"
                      type="email"
                      value={formData.to_email}
                      onChange={(e) => setFormData({ ...formData, to_email: e.target.value })}
                      placeholder={t.integrations.recipientEmailPlaceholder}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="from_email">{t.integrations.fromEmail}</Label>
                    <Input
                      id="from_email"
                      type="email"
                      value={formData.from_email}
                      onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
                      placeholder={t.integrations.fromEmailPlaceholder}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {t.integrations.fromEmailDescription}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="api_service">{t.integrations.emailService}</Label>
                    <Select
                      value={formData.api_service}
                      onValueChange={(value) => setFormData({ ...formData, api_service: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="smtp">{t.integrations.emailServiceSmtp}</SelectItem>
                        <SelectItem value="resend">{t.integrations.emailServiceResend}</SelectItem>
                        <SelectItem value="sendgrid">{t.integrations.emailServiceSendgrid}</SelectItem>
                        <SelectItem value="webhook">{t.integrations.emailServiceWebhook}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* SMTP Configuration */}
                  {formData.api_service === 'smtp' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="smtp_host">{t.integrations.smtpHost}</Label>
                          <Input
                            id="smtp_host"
                            value={formData.smtp_host || ''}
                            onChange={(e) => setFormData({ ...formData, smtp_host: e.target.value })}
                            placeholder={t.integrations.smtpHostPlaceholder}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="smtp_port">{t.integrations.smtpPort}</Label>
                          <Input
                            id="smtp_port"
                            type="number"
                            value={formData.smtp_port || '587'}
                            onChange={(e) => setFormData({ ...formData, smtp_port: e.target.value })}
                            placeholder={t.integrations.smtpPortPlaceholder}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="smtp_user">{t.integrations.smtpUsername}</Label>
                        <Input
                          id="smtp_user"
                          value={formData.smtp_user || ''}
                          onChange={(e) => setFormData({ ...formData, smtp_user: e.target.value })}
                          placeholder={t.integrations.smtpUsernamePlaceholder}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="smtp_password">{t.integrations.smtpPassword}</Label>
                        <Input
                          id="smtp_password"
                          type="password"
                          value={formData.smtp_password || ''}
                          onChange={(e) => setFormData({ ...formData, smtp_password: e.target.value })}
                          placeholder={t.integrations.smtpPasswordPlaceholder}
                          required
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {t.integrations.smtpPasswordDescription}
                        </p>
                      </div>
                    </>
                  )}

                  {/* API Key for Resend/SendGrid/Webhook */}
                  {(formData.api_service === 'resend' || formData.api_service === 'sendgrid' || formData.api_service === 'webhook') && (
                    <div>
                      <Label htmlFor="api_key_email">
                        {formData.api_service === 'webhook' ? t.integrations.webhookUrl : t.integrations.apiKeyEmail}
                      </Label>
                      <Input
                        id="api_key_email"
                        value={formData.api_key}
                        onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                        placeholder={
                          formData.api_service === 'webhook' 
                            ? t.integrations.apiKeyEmailWebhookPlaceholder
                            : formData.api_service === 'resend'
                            ? t.integrations.apiKeyEmailPlaceholder
                            : t.integrations.apiKeyEmailSendgridPlaceholder
                        }
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {formData.api_service === 'resend' && (
                          <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {t.integrations.getApiKeyResend}
                          </a>
                        )}
                        {formData.api_service === 'sendgrid' && (
                          <a href="https://app.sendgrid.com/settings/api_keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {t.integrations.getApiKeySendgrid}
                          </a>
                        )}
                        {formData.api_service === 'webhook' && t.integrations.webhookUrlDescription}
                      </p>
                    </div>
                  )}
                </>
              )}

              </div>
              {/* Sticky Footer */}
              <div className="px-6 py-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.enabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                    />
                    <Label>{t.integrations.enabled}</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      {t.integrations.cancel}
                    </Button>
                    <Button type="submit">
                      {editingIntegration ? t.integrations.updateIntegration : t.integrations.createIntegration}
                    </Button>
                  </div>
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
