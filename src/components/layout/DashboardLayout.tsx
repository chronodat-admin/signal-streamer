import { ReactNode, useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Activity, LayoutDashboard, Layers, CreditCard, LogOut, Loader2, Menu, X, Settings, Radio, Plug, FileText, Key, MessageSquare, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ColorSchemePicker } from '@/components/ColorSchemePicker';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSignalNotifications } from '@/hooks/useSignalNotifications';
import { FeedbackDialog } from '@/components/FeedbackDialog';
import { useLanguage } from '@/i18n';

type PlanType = Database['public']['Enums']['plan_type'];

interface DashboardLayoutProps {
  children: ReactNode;
}

type NavKey = 'dashboard' | 'strategies' | 'signals' | 'integrations' | 'apiKeys' | 'alertLogs' | 'billing' | 'preferences';

const navigationConfig: { key: NavKey; href: string; icon: typeof LayoutDashboard }[] = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'strategies', href: '/dashboard/strategies', icon: Layers },
  { key: 'signals', href: '/dashboard/signals', icon: Radio },
  { key: 'integrations', href: '/dashboard/integrations', icon: Plug },
  { key: 'apiKeys', href: '/dashboard/api-keys', icon: Key },
  { key: 'alertLogs', href: '/dashboard/logs', icon: FileText },
  { key: 'billing', href: '/dashboard/billing', icon: CreditCard },
  { key: 'preferences', href: '/dashboard/preferences', icon: Settings },
];

const planColors: Record<PlanType, string> = {
  FREE: 'bg-muted text-muted-foreground',
  PRO: 'bg-primary/20 text-primary',
  ELITE: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400',
};

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    }
    return false;
  });
  const [userPlan, setUserPlan] = useState<PlanType>('FREE');
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Enable real-time signal notifications
  useSignalNotifications();

  // Build navigation with translations
  const navigation = navigationConfig.map((item) => ({
    ...item,
    name: t.nav[item.key],
  }));

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    const fetchProfileAndRole = async () => {
      if (!user) return;
      
      // Fetch plan from profiles
      const { data: profileData } = await supabase
        .from('profiles')
        .select('plan')
        .eq('user_id', user.id)
        .single();
      
      if (profileData?.plan) setUserPlan(profileData.plan);
      
      // Check admin role using RPC function
      const { data: hasAdminRole } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin',
      });
      
      if (hasAdminRole) setIsAdmin(true);
    };
    fetchProfileAndRole();
  }, [user]);

  // Subscribe to realtime updates for plan changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`layout-profile:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedProfile = payload.new as { plan?: PlanType };
          if (updatedProfile?.plan) {
            console.log('Plan updated in layout:', updatedProfile.plan);
            setUserPlan(updatedProfile.plan);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const NavItem = ({ item }: { item: typeof navigation[0] }) => {
    const isActive = location.pathname === item.href || 
      (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
    
    const content = (
      <Link
        to={item.href}
        onClick={() => setSidebarOpen(false)}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
          isActive
            ? 'bg-primary/10 text-primary shadow-sm'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        } ${collapsed ? 'justify-center' : ''}`}
      >
        <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-primary' : ''}`} />
        {!collapsed && <span>{item.name}</span>}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.name}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg">TradeOrin</span>
        </Link>
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ColorSchemePicker />
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-card border-r border-border transform transition-all duration-300 ease-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'w-20' : 'w-72'}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-border">
            {collapsed ? (
              <div className="flex flex-col items-center gap-3">
                <Link to="/" className="flex items-center justify-center">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-md flex-shrink-0">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCollapsed(!collapsed)}
                  className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-foreground"
                  title="Expand sidebar"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <Link to="/" className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-md flex-shrink-0">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <span className="text-xl font-bold">TradeOrin</span>
                    <p className="text-xs text-muted-foreground">Trading Signals</p>
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCollapsed(!collapsed)}
                  className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-foreground"
                  title="Collapse sidebar"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1.5">
            {navigation.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </nav>

          {/* User Section */}
          <div className={`p-3 border-t border-border ${collapsed ? 'flex flex-col items-center' : ''}`}>
            {collapsed ? (
              <>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center ring-2 ring-primary/20 mb-2 cursor-default">
                      <span className="text-sm font-bold text-primary">
                        {user.email?.[0].toUpperCase()}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="font-medium">{user.email}</p>
                    <p className="text-xs text-muted-foreground">{userPlan} Plan</p>
                  </TooltipContent>
                </Tooltip>
                {isAdmin && (
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Link to="/admin">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-primary hover:bg-primary/10 mb-1"
                        >
                          <Shield className="h-5 w-5" />
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">{t.nav.adminPanel}</TooltipContent>
                  </Tooltip>
                )}
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-purple-500 hover:bg-purple-500/10 mb-1"
                      onClick={() => setFeedbackOpen(true)}
                    >
                      <MessageSquare className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{t.feedback.title}</TooltipContent>
                </Tooltip>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{t.nav.signOut}</TooltipContent>
                </Tooltip>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-xl bg-muted/30">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center ring-2 ring-primary/20 flex-shrink-0">
                    <span className="text-sm font-bold text-primary">
                      {user.email?.[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.email}</p>
                    <Badge className={`text-xs mt-1 ${planColors[userPlan]}`}>
                      {userPlan} Plan
                    </Badge>
                  </div>
                </div>
                {isAdmin && (
                  <Link to="/admin">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 text-muted-foreground hover:text-primary hover:bg-primary/10 mb-1"
                    >
                      <Shield className="h-5 w-5" />
                      {t.nav.adminPanel}
                    </Button>
                  </Link>
                )}
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-muted-foreground hover:text-purple-500 hover:bg-purple-500/10 mb-1"
                  onClick={() => setFeedbackOpen(true)}
                >
                  <MessageSquare className="h-5 w-5" />
                  {t.feedback.title}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-5 w-5" />
                  {t.nav.signOut}
                </Button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Desktop Top Header */}
      <header className={`hidden lg:flex fixed top-0 right-0 z-40 h-14 bg-background/95 backdrop-blur-md border-b border-border transition-all duration-300 ${collapsed ? 'left-20' : 'left-72'}`}>
        <div className="flex items-center justify-end gap-2 px-6 w-full">
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <ColorSchemePicker />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`pt-14 lg:pt-14 min-h-screen transition-all duration-300 ${collapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Feedback Dialog */}
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </div>
  );
};
