import { ReactNode, useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  MessageSquare, 
  LogOut, 
  Loader2, 
  Menu, 
  X, 
  Shield,
  ArrowLeft,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ColorSchemePicker } from '@/components/ColorSchemePicker';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

interface AdminLayoutProps {
  children: ReactNode;
}

const adminNavigation = [
  { 
    name: 'Dashboard', 
    href: '/admin', 
    icon: LayoutDashboard,
    description: 'Admin overview and statistics'
  },
  { 
    name: 'User Management', 
    href: '/admin/users', 
    icon: Users,
    description: 'Advanced user management'
  },
  { 
    name: 'Subscribed Users', 
    href: '/admin/subscriptions', 
    icon: CreditCard,
    description: 'View and manage user subscriptions'
  },
  { 
    name: 'Contact Messages', 
    href: '/admin/contact', 
    icon: MessageSquare,
    description: 'View and manage contact form submissions'
  },
  { 
    name: 'User Feedback', 
    href: '/admin/feedback', 
    icon: MessageSquare,
    description: 'View and manage user feedback submissi...'
  },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin-sidebar-collapsed') === 'true';
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('admin-sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    if (!authLoading && !adminLoading) {
      if (!user) {
        navigate('/auth');
      } else if (!isAdmin) {
        navigate('/dashboard');
      }
    }
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const NavItem = ({ item }: { item: typeof adminNavigation[0] }) => {
    const isActive = location.pathname === item.href || 
      (item.href !== '/admin' && location.pathname.startsWith(item.href));
    
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
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">{item.name}</div>
            <div className="text-xs text-muted-foreground truncate">{item.description}</div>
          </div>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            <div>{item.name}</div>
            <div className="text-xs text-muted-foreground">{item.description}</div>
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
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg">Smartwork Sys</span>
        </Link>
        <div className="flex items-center gap-1">
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
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md flex-shrink-0">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCollapsed(!collapsed)}
                  className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-foreground"
                  title="Expand sidebar"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md flex-shrink-0">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold">Admin Panel</div>
                    <div className="text-xs text-muted-foreground">System Management</div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCollapsed(!collapsed)}
                  className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-foreground"
                  title="Collapse sidebar"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Back to Dashboard Link */}
          {!collapsed && (
            <div className="px-4 pt-2">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>← Back to Dashboard</span>
              </Link>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
            {!collapsed && (
              <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                ADMINISTRATION
              </p>
            )}
            {adminNavigation.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </nav>

          {/* Appearance Controls - Desktop */}
          <div className={`px-3 py-2 border-t border-border hidden lg:flex items-center ${collapsed ? 'flex-col gap-2' : 'justify-between'}`}>
            {!collapsed && <span className="text-sm text-muted-foreground">Appearance</span>}
            <div className={`flex items-center ${collapsed ? 'flex-col gap-1' : 'gap-1'}`}>
              <ColorSchemePicker />
              <ThemeToggle />
            </div>
          </div>

          {/* User Section */}
          <div className={`p-3 border-t border-border ${collapsed ? 'flex flex-col items-center' : ''}`}>
            {collapsed ? (
              <>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500/30 to-purple-500/10 flex items-center justify-center ring-2 ring-purple-500/20 mb-2 cursor-default">
                      <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                        {user.email?.[0].toUpperCase()}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="font-medium">{user.email}</p>
                    <Badge className="mt-1 bg-purple-500/20 text-purple-600 dark:text-purple-400">Admin</Badge>
                  </TooltipContent>
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
                  <TooltipContent side="right">Sign Out</TooltipContent>
                </Tooltip>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-xl bg-muted/30">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500/30 to-purple-500/10 flex items-center justify-center ring-2 ring-purple-500/20 flex-shrink-0">
                    <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                      {user.email?.[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.email}</p>
                    <Badge className="text-xs mt-1 bg-purple-500/20 text-purple-600 dark:text-purple-400">
                      Admin
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </Button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`pt-14 lg:pt-0 min-h-screen transition-all duration-300 ${collapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

